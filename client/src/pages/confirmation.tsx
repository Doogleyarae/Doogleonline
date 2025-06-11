import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Copy } from "lucide-react";
import { formatDate, formatCurrency, copyToClipboard } from "@/lib/utils";
import type { Order } from "@shared/schema";

export default function Confirmation() {
  const [order, setOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("currentOrder");
    if (storedOrder) {
      setOrder(JSON.parse(storedOrder));
    }
  }, []);

  const handleCopyWallet = async () => {
    if (order?.paymentWallet) {
      try {
        await copyToClipboard(order.paymentWallet);
        toast({
          title: "Copied!",
          description: "Wallet address copied to clipboard",
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
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border border-blue-200 mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Send Payment To:</h3>
              <div className="flex items-center justify-between bg-white rounded-md px-3 py-2">
                <span className="text-sm font-mono text-gray-900 flex-1 break-all">{order.paymentWallet}</span>
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
