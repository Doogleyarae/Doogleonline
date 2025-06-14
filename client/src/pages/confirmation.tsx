import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Copy, CreditCard, X, Clock, Timer } from "lucide-react";
import { formatDate, formatCurrency, formatAmount, copyToClipboard } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";

export default function Confirmation() {
  const [order, setOrder] = useState<Order | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("currentOrder");
    if (storedOrder) {
      setOrder(JSON.parse(storedOrder));
    }
  }, []);

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

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
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

  const handleCancelOrder = () => {
    if (order) {
      updateOrderStatusMutation.mutate({ orderId: order.orderId, status: "cancelled" });
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Received!</h1>
            <p className="text-lg text-gray-600">We received your exchange request. Processing will complete in 15 minutes.</p>
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
                  <span className="text-sm text-gray-900">{formatDate(order.createdAt)}</span>
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
                    Mark as Paid
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    disabled={updateOrderStatusMutation.isPending}
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