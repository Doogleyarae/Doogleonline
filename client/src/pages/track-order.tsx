import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Clock, CheckCircle, Send, XCircle, RefreshCw } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Order } from "@shared/schema";

const trackFormSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

type TrackFormData = z.infer<typeof trackFormSchema>;

export default function TrackOrder() {
  const [searchedOrderId, setSearchedOrderId] = useState<string>("");
  
  const form = useForm<TrackFormData>({
    resolver: zodResolver(trackFormSchema),
    defaultValues: {
      orderId: "",
    },
  });

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: [`/api/orders/${searchedOrderId}`],
    enabled: !!searchedOrderId,
  });

  const onSubmit = (data: TrackFormData) => {
    setSearchedOrderId(data.orderId.trim());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-8 h-8 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your order is waiting for payment confirmation';
      case 'processing':
        return 'Your exchange is being processed';
      case 'completed':
        return 'Your exchange has been completed successfully';
      case 'cancelled':
        return 'Your order has been cancelled';
      default:
        return 'Status unknown';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Track Your Order</h1>
        <p className="text-lg text-gray-600">Enter your Order ID to check the status</p>
      </div>

      {/* Order ID Input */}
      <Card className="shadow-lg mb-8">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order ID</FormLabel>
                    <FormControl>
                      <Input placeholder="DGL-2024-001234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Searching..." : "Track Order"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Order Status Display */}
      {error && (
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600">The order ID you entered could not be found. Please check and try again.</p>
          </CardContent>
        </Card>
      )}

      {order && (
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                order.status === 'completed' ? 'bg-green-100' :
                order.status === 'processing' ? 'bg-blue-100' :
                order.status === 'cancelled' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                {getStatusIcon(order.status)}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{getStatusTitle(order.status)}</h2>
              <p className="text-gray-600">{getStatusDescription(order.status)}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Order ID:</span>
                <span className="text-sm text-gray-900">{order.orderId}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Created:</span>
                <span className="text-sm text-gray-900">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">From:</span>
                <span className="text-sm text-gray-900">
                  {formatCurrency(order.sendAmount, order.sendMethod)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">To:</span>
                <span className="text-sm text-gray-900">
                  {formatCurrency(order.receiveAmount, order.receiveMethod)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusTitle(order.status)}
                </Badge>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">Received</span>
                </div>
                <div className={`flex-1 h-0.5 mx-2 ${
                  order.status === 'processing' || order.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    order.status === 'processing' || order.status === 'completed' 
                      ? 'bg-blue-500' 
                      : 'bg-gray-200'
                  }`}>
                    <RefreshCw className={`w-4 h-4 ${
                      order.status === 'processing' || order.status === 'completed' 
                        ? 'text-white' 
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">Processing</span>
                </div>
                <div className={`flex-1 h-0.5 mx-2 ${
                  order.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    order.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  }`}>
                    <Send className={`w-4 h-4 ${
                      order.status === 'completed' ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">Completed</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
