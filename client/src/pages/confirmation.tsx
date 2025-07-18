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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Initialize WebSocket for real-time order status updates
  const { isConnected } = useOrderStatusSync(order?.orderId);

  useEffect(() => {
    try {
      console.log('🔄 Loading order from session storage...');
      const storedOrder = sessionStorage.getItem("currentOrder");
      
      if (storedOrder) {
        const orderData = JSON.parse(storedOrder);
        console.log('✅ Order loaded successfully:', orderData);
        setOrder(orderData);
        
        // Auto-redirect if order is already completed or cancelled
        if (orderData.status === 'completed') {
          console.log('🔄 Order completed, redirecting...');
          setLocation('/order-completed');
        } else if (orderData.status === 'cancelled') {
          console.log('🔄 Order cancelled, redirecting...');
          setLocation('/order-cancelled');
        }
      } else {
        console.log('❌ No order found in session storage');
        setError("No order information found. Please create a new exchange order.");
      }
    } catch (err) {
      console.error("❌ Error loading order from session storage:", err);
      setError("Failed to load order information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [setLocation]);

  // Listen for real-time order updates
  useEffect(() => {
    const handleOrderUpdate = () => {
      try {
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
      } catch (error) {
        console.error('Error handling order update:', error);
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
    retry: 3,
    retryDelay: 1000,
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
    try {
      const response = await fetch("/api/orders/check-cancellation-limit", {
        method: "POST",
        body: JSON.stringify({ phoneNumber, email }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Failed to check cancellation limit");
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking cancellation limit:', error);
      throw error;
    }
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
        credentials: "include",
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
    onError: (error: any) => {
      console.error('Order status update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  // Function to replace amount placeholder in payment strings
  const getFormattedPaymentString = (paymentString: string | undefined, amount: string | undefined): string => {
    if (!paymentString || !amount) {
      return paymentString || '';
    }
    
    // Format amount to remove unnecessary decimal places (e.g., 55.00 -> 55, 55.75 -> 55.75)
    const numericAmount = parseFloat(amount);
    const cleanAmount = formatAmount(numericAmount);
    
    // Replace 'amount' placeholder with cleaned amount (case insensitive)
    return paymentString.replace(/amount/gi, cleanAmount);
  };

  const handleCopyWallet = async () => {
    try {
      // Use live wallet address from admin dashboard, fallback to order wallet
      // FIXED: Use sendMethod instead of receiveMethod - customer sends TO the send currency wallet
      const rawWallet = walletAddresses?.[order?.sendMethod || ''] || order?.paymentWallet || '';
      const currentWallet = getFormattedPaymentString(rawWallet, order?.sendAmount || '');
      
      if (currentWallet) {
        await copyToClipboard(currentWallet);
        toast({
          title: "Copied!",
          description: "Payment string copied to clipboard",
        });
      } else {
        throw new Error("No wallet address available");
      }
    } catch (error) {
      console.error('Copy wallet error:', error);
      toast({
        title: "Failed to copy",
        description: "Please copy the address manually",
        variant: "destructive",
      });
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
      console.error('Cancel order error:', error);
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center p-8">
          <CardContent>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 mb-4">Loading order information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center p-8">
          <CardContent>
            <div className="text-red-600 mb-4">
              <X className="w-12 h-12 mx-auto mb-2" />
              <h2 className="text-xl font-bold mb-2">Error Loading Page</h2>
              <p className="text-sm">{error}</p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                Refresh Page
              </Button>
              <Link href="/exchange">
                <Button variant="outline" className="w-full">
                  Create New Exchange
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show no order state
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center p-8">
          <CardContent>
            <div className="text-gray-600 mb-4">
              <X className="w-12 h-12 mx-auto mb-2" />
              <h2 className="text-xl font-bold mb-2">No Order Found</h2>
              <p className="text-sm">No order information was found. Please create a new exchange order.</p>
            </div>
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
                <p className="text-xl font-semibold text-green-800">Order completed successfully!</p>
              </div>
            )}
          </div>

          {/* Order Details */}
          <Card className="bg-gray-50 border border-gray-200 mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Order ID:</strong> <span className="font-mono text-blue-600">{order.orderId}</span></p>
                  <p><strong>Status:</strong> {getStatusBadge(order.status)}</p>
                  <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p><strong>From:</strong> {formatCurrency(order.sendAmount, order.sendMethod)} ({order.sendMethod.toUpperCase()})</p>
                  <p><strong>To:</strong> {formatCurrency(order.receiveAmount, order.receiveMethod)} ({order.receiveMethod.toUpperCase()})</p>
                  <p><strong>Rate:</strong> {parseFloat(order.exchangeRate).toFixed(6)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Payment To: Always show admin's wallet for sendMethod */}
          <Card className="bg-blue-50 border border-blue-200 mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Send Payment To:</h3>
              <div className="flex items-center justify-between bg-white rounded-md px-3 py-2">
                <span className="text-sm font-mono text-gray-900 flex-1 break-all">
                  {getFormattedPaymentString(
                    walletAddresses?.[order.sendMethod] || order.paymentWallet,
                    order.sendAmount
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const paymentString = getFormattedPaymentString(
                      walletAddresses?.[order.sendMethod] || order.paymentWallet,
                      order.sendAmount
                    );
                    copyToClipboard(paymentString);
                    toast({ title: "Copied!", description: "Payment string copied to clipboard" });
                  }}
                  className="ml-2 text-primary hover:text-blue-700"
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
                <div className="text-2xl font-bold text-blue-900">
                  {formatCountdown(countdown)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/exchange">
              <Button variant="outline" className="w-full sm:w-auto">
                Create New Exchange
              </Button>
            </Link>
            <Link href={`/track/${order.orderId}`}>
              <Button className="w-full sm:w-auto">
                Track Order
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}