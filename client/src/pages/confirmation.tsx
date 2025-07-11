import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Copy, CreditCard, X, Clock, Timer } from "lucide-react";
import { formatDate, formatCurrency, formatAmount, copyToClipboard } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useOrderStatusSync } from "@/hooks/use-websocket";
import type { Order } from "@shared/schema";

export default function Confirmation() {
  const [order, setOrder] = useState<Order | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Initialize WebSocket for real-time order status updates
  const { isConnected } = useOrderStatusSync(order?.orderId);

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("currentOrder");
    if (storedOrder) {
      const orderData = JSON.parse(storedOrder);
      setOrder(orderData);
      
      // Auto-redirect if order is already completed or cancelled
      if (orderData.status === 'completed') {
        setLocation('/order-completed');
      } else if (orderData.status === 'cancelled') {
        setLocation('/order-cancelled');
      }
    }
  }, [setLocation]);

  // Listen for real-time order updates
  useEffect(() => {
    const handleOrderUpdate = () => {
      const storedOrder = sessionStorage.getItem("currentOrder");
      if (storedOrder) {
        const orderData = JSON.parse(storedOrder);
        setOrder(orderData);
        
        // Auto-redirect based on new status
        if (orderData.status === 'completed') {
          setLocation('/order-completed');
        } else if (orderData.status === 'cancelled') {
          setLocation('/order-cancelled');
        }
      }
    };

    // Listen for sessionStorage changes (triggered by WebSocket updates)
    window.addEventListener('storage', handleOrderUpdate);
    
    return () => {
      window.removeEventListener('storage', handleOrderUpdate);
    };
  }, [setLocation]);

  // Query processing status for paid orders
  const { data: processingStatus } = useQuery<{ isProcessing: boolean; remainingTimeMinutes: number }>({
    queryKey: ["/api/orders", order?.orderId, "processing-status"],
    enabled: !!order && order.status === "paid",
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch live wallet addresses from admin dashboard
  const { data: walletAddresses } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/wallet-addresses"],
  });

  // Countdown timer for paid orders
  useEffect(() => {
    if (order?.status === "paid" && processingStatus?.isProcessing) {
      setCountdown(15 * 60); // 15 minutes in seconds
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [order?.status, processingStatus]);

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check cancellation limit before allowing cancellation
  const checkCancellationLimit = async (phoneNumber: string, email: string) => {
    const response = await fetch("/api/orders/check-cancellation-limit", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, email }),
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      throw new Error("Failed to check cancellation limit");
    }
    
    return await response.json();
  };

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      // Check cancellation limit before allowing cancellation
      if (status === "cancelled" && order) {
        const limitCheck = await checkCancellationLimit(order.phoneNumber, order.email);
        
        if (!limitCheck.canCancel) {
          throw new Error(limitCheck.reason || "Cancellation limit reached");
        }
        
        // Record the cancellation
        await fetch("/api/orders/record-cancellation", {
          method: "POST",
          body: JSON.stringify({ 
            phoneNumber: order.phoneNumber, 
            email: order.email 
          }),
          headers: { "Content-Type": "application/json" },
        });
      }

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Failed to update order status");
      }
      
      return await response.json();
    },
    onSuccess: (updatedOrder) => {
      setOrder(updatedOrder);
      sessionStorage.setItem("currentOrder", JSON.stringify(updatedOrder));
      toast({
        title: "Order Updated",
        description: `Order status changed to ${updatedOrder.status}`,
      });
      
      // Redirect to cancelled orders page if order was cancelled
      if (updatedOrder.status === "cancelled") {
        toast({
          title: "Redirecting...",
          description: "Taking you to cancelled orders page",
        });
        setTimeout(() => {
          window.location.href = "/cancelled";
        }, 1500); // 1.5 second delay to show the toast message
      }
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  // Function to replace amount placeholder in payment strings
  const getFormattedPaymentString = (paymentString: string | undefined, amount: string | undefined): string => {
    if (!paymentString || !amount) return paymentString || '';
    
    // Format amount to remove unnecessary decimal places (e.g., 55.00 -> 55, 55.75 -> 55.75)
    const numericAmount = parseFloat(amount);
    const cleanAmount = formatAmount(numericAmount);
    
    // Replace 'amount' placeholder with cleaned amount (case insensitive)
    return paymentString.replace(/amount/gi, cleanAmount);
  };

  const handleCopyWallet = async () => {
    // Use live wallet address from admin dashboard, fallback to order wallet
    const rawWallet = walletAddresses?.[order?.receiveMethod || ''] || order?.paymentWallet || '';
    const currentWallet = getFormattedPaymentString(rawWallet, order?.sendAmount || '');
    
    if (currentWallet) {
      try {
        await copyToClipboard(currentWallet);
        toast({
          title: "Copied!",
          description: "Payment string copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Failed to copy",
          description: "Please copy the address manually",
          variant: "destructive",
        });
      }
    }
  };

  const handleMarkAsPaid = () => {
    if (order) {
      updateOrderStatusMutation.mutate({ orderId: order.orderId, status: "paid" });
    }
  };

  // Customer-side order cancellation mutation with limit checking
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!order) throw new Error("Order not found");
      
      // Check cancellation limit first
      const limitCheck = await checkCancellationLimit(order.phoneNumber, order.email);
      
      if (!limitCheck.canCancel) {
        throw new Error(limitCheck.reason || "Cancellation limit reached");
      }
      
      // Record the cancellation
      await fetch("/api/orders/record-cancellation", {
        method: "POST",
        body: JSON.stringify({ 
          phoneNumber: order.phoneNumber, 
          email: order.email 
        }),
        headers: { "Content-Type": "application/json" },
      });
      
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status: "cancelled" });
      return response.json();
    },
    onSuccess: (updatedOrder) => {
      // Update stored order
      sessionStorage.setItem("currentOrder", JSON.stringify(updatedOrder));
      setOrder(updatedOrder);
      
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully",
      });
      
      // Redirect to cancelled page immediately
      setLocation('/order-cancelled');
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    },
  });

  const handleCancelOrder = () => {
    if (order) {
      cancelOrderMutation.mutate(order.orderId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "paid":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CreditCard className="w-3 h-3 mr-1" />Paid</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center p-8">
          <CardContent>
            <p className="text-lg text-gray-600 mb-4">No order information found.</p>
            <Link href="/exchange">
              <Button>Create New Exchange</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Exchange Order</h1>
            {order.status === "pending" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-xl font-semibold text-blue-800">Customer: Please make the payment.</p>
              </div>
            )}
            {order.status === "paid" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-xl font-semibold text-yellow-800">Waiting for admin confirmation...</p>
              </div>
            )}
            {order.status === "processing" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-xl font-semibold text-yellow-800">Waiting for admin confirmation...</p>
              </div>
            )}
            {order.status === "completed" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-xl font-semibold text-green-800">Order Completed Successfully.</p>
              </div>
            )}
            {order.status === "cancelled" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-xl font-semibold text-red-800">This order has been cancelled.</p>
              </div>
            )}
          </div>

          <Card className="bg-gray-50 mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Order ID:</span>
                  <span className="text-lg font-bold text-primary">{order.orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Date & Time:</span>
                  <span className="text-sm text-gray-900">{order.createdAt ? formatDate(order.createdAt) : 'Just now'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Amount:</span>
                  <span className="text-sm text-gray-900">
                    {formatCurrency(order.sendAmount, order.sendMethod)} → {formatCurrency(order.receiveAmount, order.receiveMethod)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sender and Receiver Account Details */}
          <Card className="bg-white border mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Sender Account</h3>
                  <div className="bg-gray-50 rounded px-3 py-2 text-left">
                    <span className="text-xs text-gray-500 block mb-1">
                      {(() => {
                        switch (order.sendMethod) {
                          case 'zaad': return 'Zaad Phone Number';
                          case 'sahal': return 'Sahal Phone Number';
                          case 'evc': return 'EVC Plus Phone Number';
                          case 'edahab': return 'eDahab Phone Number';
                          case 'premier': return 'Premier Bank Account Number';
                          default: return `${order.sendMethod?.toUpperCase()} Account`;
                        }
                      })()}
                    </span>
                    <span className="font-mono text-gray-900 text-sm break-all">{order.senderAccount || 'Not provided'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Receiver Account</h3>
                  <div className="bg-gray-50 rounded px-3 py-2 text-left">
                    <span className="text-xs text-gray-500 block mb-1">
                      {(() => {
                        switch (order.receiveMethod) {
                          case 'zaad': return 'Zaad Phone Number';
                          case 'sahal': return 'Sahal Phone Number';
                          case 'evc': return 'EVC Plus Phone Number';
                          case 'edahab': return 'eDahab Phone Number';
                          case 'premier': return 'Premier Bank Account Number';
                          case 'moneygo': return 'MoneyGo Phone Number';
                          case 'trc20': return 'TRC20 Wallet Address';
                          case 'trx': return 'TRX Wallet Address';
                          case 'peb20': return 'PEB20 Wallet Address';
                          default: return `${order.receiveMethod?.toUpperCase()} Account`;
                        }
                      })()}
                    </span>
                    <span className="font-mono text-gray-900 text-sm break-all">{order.walletAddress || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border border-blue-200 mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Send Payment To:</h3>
              <div className="flex items-center justify-between bg-white rounded-md px-3 py-2">
                <span className="text-sm font-mono text-gray-900 flex-1 break-all">
                  {getFormattedPaymentString(
                    walletAddresses?.[order.receiveMethod] || order.paymentWallet,
                    order.sendAmount
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyWallet}
                  className="ml-2 text-primary hover:text-blue-700"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order Status Actions */}
          {order.status === "pending" && (
            <Card className="bg-gray-50 border border-gray-200 mb-6">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">Order Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleMarkAsPaid}
                    disabled={updateOrderStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Paid
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    disabled={cancelOrderMutation.isPending}
                    variant="destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Timer for Paid Orders */}
          {order.status === "paid" && processingStatus?.isProcessing && countdown > 0 && (
            <Card className="bg-blue-50 border border-blue-200 mb-6">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-3">
                  <Timer className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-sm font-semibold text-blue-900">Processing Your Payment</h3>
                </div>
                <p className="text-blue-700 text-sm mb-3">
                  Your order will be automatically completed in:
                </p>
                <div className="text-2xl font-bold text-blue-800 mb-2">
                  {formatCountdown(countdown)}
                </div>
                <p className="text-xs text-blue-600">
                  Processing typically takes 15 minutes after payment confirmation
                </p>
              </CardContent>
            </Card>
          )}

          {/* Email Notification Information */}
          <Card className="bg-gray-50 border border-gray-200 mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Email Notifications</h3>
              <p className="text-sm text-gray-700">
                Dear Customer, thank you for submitting your exchange request. If you did not receive an email confirmation, please make sure you entered a correct email address and check your spam/junk folder. If you still haven't received anything, please contact our support team for assistance.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Link href="/track">
              <Button className="w-full">
                Track Your Order
              </Button>
            </Link>
            <Link href="/exchange">
              <Button variant="outline" className="w-full">
                Make Another Exchange
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}