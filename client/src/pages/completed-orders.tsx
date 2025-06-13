import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, ArrowRight, Copy } from "lucide-react";
import { formatDate, formatCurrency, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

export default function CompletedOrders() {
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Filter completed orders
  const completedOrders = orders.filter((order: Order) => order.status === "completed");

  const handleCopyOrderId = async (orderId: string) => {
    try {
      await copyToClipboard(orderId);
      toast({
        title: "Copied!",
        description: "Order ID copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the order ID manually",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading completed orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Completed Orders</h1>
            <p className="text-lg text-gray-600">View your successfully completed transactions</p>
          </div>
          <Link href="/exchange">
            <Button>
              New Exchange
            </Button>
          </Link>
        </div>
      </div>

      {completedOrders.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <div className="mb-6">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Completed Orders</h2>
              <p className="text-gray-600 mb-6">You haven't completed any exchanges yet.</p>
              <Link href="/exchange">
                <Button>
                  Start Your First Exchange
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                {completedOrders.length} completed {completedOrders.length === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              All Successful
            </Badge>
          </div>

          {completedOrders.map((order: Order) => (
            <Card key={order.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Order #{order.orderId}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyOrderId(order.orderId)}
                      className="h-6 w-6"
                      title="Copy Order ID"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Transaction Details */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600 uppercase font-medium">{order.sendMethod}</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(order.sendAmount, order.sendMethod)}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                          <div className="text-left">
                            <p className="text-sm text-gray-600 uppercase font-medium">{order.receiveMethod}</p>
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(order.receiveAmount, order.receiveMethod)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Exchange Rate: {parseFloat(order.exchangeRate).toFixed(4)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium">Customer</p>
                        <p className="text-gray-900">{order.fullName}</p>
                        <p className="text-gray-700">{order.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Wallet Address</p>
                        <p className="text-gray-900 font-mono text-xs break-all">
                          {order.walletAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date & Actions */}
                  <div className="flex flex-col justify-between">
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        Completed
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(order.updatedAt)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Link href={`/track?orderId=${order.orderId}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Summary Statistics */}
          <Card className="bg-gray-50 border border-gray-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{completedOrders.length}</p>
                  <p className="text-sm text-gray-600">Total Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">100%</p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {completedOrders.reduce((total: number, order: Order) => total + parseFloat(order.sendAmount), 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Total Volume (USD)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Link href="/exchange">
              <Button>
                New Exchange
              </Button>
            </Link>
            <Link href="/order-history">
              <Button variant="outline">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}