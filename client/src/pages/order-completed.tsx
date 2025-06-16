import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Download, RefreshCw } from "lucide-react";
import { formatDate, formatCurrency, formatAmount } from "@/lib/utils";
import type { Order } from "@shared/schema";

export default function OrderCompleted() {
  const [order, setOrder] = useState<Order | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("currentOrder");
    if (storedOrder) {
      const orderData = JSON.parse(storedOrder);
      setOrder(orderData);
      
      // If order is not completed, redirect to tracking page
      if (orderData.status !== "completed") {
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Completed!</h1>
            <p className="text-lg text-gray-600 mb-4">
              Your exchange has been successfully processed
            </p>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Order ID: {order.orderId}
            </Badge>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">You Sent:</span>
                <span className="font-medium">
                  {formatAmount(parseFloat(order.sendAmount))} {order.sendMethod?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">You Received:</span>
                <span className="font-medium text-green-600">
                  {formatAmount(parseFloat(order.receiveAmount))} {order.receiveMethod?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate:</span>
                <span className="font-medium">1 {order.sendMethod?.toUpperCase()} = {order.exchangeRate} {order.receiveMethod?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
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
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{order.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{order.phoneNumber}</span>
              </div>
              {order.walletAddress && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet Address:</span>
                  <span className="font-medium text-xs break-all">{order.walletAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center p-6 bg-green-50 rounded-lg mb-6">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank You for Choosing DoogleOnline!</h3>
            <p className="text-gray-600 text-sm">
              Your funds have been successfully transferred to your designated wallet. 
              You should receive them within the next few minutes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/exchange">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Make Another Exchange
              </Button>
            </Link>
            <Link href="/track">
              <Button variant="outline" className="w-full">
                Track Another Order
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                Back to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}