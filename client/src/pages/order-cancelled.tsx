import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { formatDate, formatAmount } from "@/lib/utils";
import type { Order } from "@shared/schema";

export default function OrderCancelled() {
  const [order, setOrder] = useState<Order | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("currentOrder");
    if (storedOrder) {
      const orderData = JSON.parse(storedOrder);
      setOrder(orderData);
      
      // If order is not cancelled, redirect to tracking page
      if (orderData.status !== "cancelled") {
        setLocation("/track");
      }
    } else {
      // No order data, redirect to homepage
      setLocation("/");
    }
  }, [setLocation]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Cancelled</h1>
            <p className="text-lg text-gray-600 mb-4">
              Your exchange order has been cancelled
            </p>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Order ID: {order.orderId}
            </Badge>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cancelled Order Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Requested Amount:</span>
                <span className="font-medium text-gray-500 line-through">
                  {formatAmount(parseFloat(order.sendAmount))} {order.sendMethod?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected to Receive:</span>
                <span className="font-medium text-gray-500 line-through">
                  {formatAmount(parseFloat(order.receiveAmount))} {order.receiveMethod?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate:</span>
                <span className="font-medium">1 {order.sendMethod?.toUpperCase()} = {order.exchangeRate} {order.receiveMethod?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{order.createdAt ? formatDate(order.createdAt) : 'Recently'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant="destructive">Cancelled</Badge>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{order.fullName}</span>
              </div>
              {order.email && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{order.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{order.phoneNumber}</span>
              </div>
            </div>
          </div>

          {/* Cancellation Notice */}
          <div className="text-center p-6 bg-red-50 rounded-lg mb-6">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Cancelled</h3>
            <p className="text-gray-600 text-sm mb-3">
              This exchange order has been cancelled and will not be processed. 
              No funds were transferred.
            </p>
            <p className="text-xs text-gray-500">
              If you made any payments for this order, please contact our support team immediately.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/exchange">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Create New Exchange
              </Button>
            </Link>
            <Link href="/track">
              <Button variant="outline" className="w-full">
                Track Another Order
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                Contact Support
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}