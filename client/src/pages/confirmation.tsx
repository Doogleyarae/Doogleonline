import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Copy, CreditCard, X, Clock, Timer, QrCode, Camera } from "lucide-react";
import { formatDate, formatCurrency, copyToClipboard } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";

export default function Confirmation() {
  const [order, setOrder] = useState<Order | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setShowScanner(true);
        
        // Start scanning for QR codes
        const interval = setInterval(() => {
          scanForQRCode();
        }, 1000);
        
        // Store interval for cleanup
        videoRef.current.dataset.intervalId = interval.toString();
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      
      // Clear scanning interval
      const intervalId = videoRef.current.dataset.intervalId;
      if (intervalId) {
        clearInterval(parseInt(intervalId));
      }
    }
    setShowScanner(false);
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for QR code detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple QR detection placeholder - in production, use a QR library like jsqr
    // For now, we'll provide manual input option
  };

  const handleManualInput = () => {
    const input = prompt("Enter wallet address or payment information:");
    if (input && input.trim()) {
      setScannedData(input.trim());
      toast({
        title: "Payment Info Added",
        description: "Payment information has been captured",
      });
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

          {/* QR Scanner Section */}
          <Card className="bg-gray-50 border border-gray-200 mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">Payment Scanner</h3>
              
              {!showScanner && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600 text-center mb-3">
                    Scan QR codes or enter payment information manually
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={startCamera}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan QR
                    </Button>
                    <Button
                      onClick={handleManualInput}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Manual Entry
                    </Button>
                  </div>
                </div>
              )}

              {showScanner && (
                <div className="space-y-3">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    <div className="absolute inset-0 border-2 border-blue-400 opacity-50 pointer-events-none">
                      <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-blue-400"></div>
                      <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-blue-400"></div>
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-blue-400"></div>
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-blue-400"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Close Scanner
                    </Button>
                    <Button
                      onClick={handleManualInput}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Manual Entry
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Position QR code within the frame to scan payment information
                  </p>
                </div>
              )}

              {scannedData && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Scanned Information:</h4>
                  <p className="text-sm font-mono text-green-800 break-all">{scannedData}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(scannedData)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setScannedData("")}
                      className="text-green-700 border-green-300"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
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
