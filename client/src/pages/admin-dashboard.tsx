import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Settings,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  MessageSquare,
  Download,
  Search,
  Filter,
  History,
  CheckCircle,
  XCircle,
  Clock3,
  AlertCircle,
} from "lucide-react";
import type { Order, ContactMessage } from "@shared/schema";

const paymentMethods = [
  { value: "zaad", label: "Zaad" },
  { value: "sahal", label: "Sahal" },
  { value: "evcplus", label: "EVC Plus" },
  { value: "edahab", label: "eDahab" },
  { value: "premier", label: "Premier Bank" },
  { value: "moneygo", label: "MoneyGo" },
  { value: "trc20", label: "TRC20" },
  { value: "trx", label: "TRX" },
  { value: "peb20", label: "PEB20" },
  { value: "usdc", label: "USDC" },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  
  // State for order management
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  
  // Quick order action mutations
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Failed to accept order");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Accepted",
        description: "Order has been marked as completed",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to accept order",
        variant: "destructive",
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    },
  });
  
  // State for exchange rate management
  const [fromCurrency, setFromCurrency] = useState<string>("");
  const [toCurrency, setToCurrency] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<string>("");
  
  // State for balance management
  const [currencyLimits, setCurrencyLimits] = useState<Record<string, { min: string; max: string }>>({});
  
  // State for wallet management
  const [walletAddresses, setWalletAddresses] = useState<Record<string, string>>({});
  const [apiEndpoints, setApiEndpoints] = useState<Record<string, string>>({
    'rate_update': '',
    'order_status': '',
    'webhook_url': '',
    'notification_api': ''
  });
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [recentlyUpdated, setRecentlyUpdated] = useState<string>('');
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [recentlyUpdatedBalance, setRecentlyUpdatedBalance] = useState<string>('');
  
  // Fetch wallet addresses
  const { data: walletData } = useQuery({
    queryKey: ["/api/admin/wallet-addresses"],
  });

  // Fetch current balances
  const { data: currentBalances } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/balances"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Sync balance data with local state
  useEffect(() => {
    if (currentBalances) {
      setBalances(currentBalances);
    }
  }, [currentBalances]);

  // Fetch API endpoints
  const { data: apiData } = useQuery({
    queryKey: ["/api/admin/api-endpoints"],
  });

  // Fetch current currency limits from backend
  const { data: backendLimits } = useQuery({
    queryKey: ["/api/admin/balance-limits"],
  });



  // Update local state when wallet data is loaded
  useEffect(() => {
    if (walletData && typeof walletData === 'object') {
      setWalletAddresses(walletData as Record<string, string>);
    }
  }, [walletData]);

  // Update local state when API data is loaded
  useEffect(() => {
    if (apiData && typeof apiData === 'object') {
      setApiEndpoints(apiData as Record<string, string>);
    }
  }, [apiData]);

  // Update local state when backend data is loaded
  useEffect(() => {
    if (backendLimits) {
      const formattedLimits: Record<string, { min: string; max: string }> = {};
      Object.entries(backendLimits as Record<string, { min: number; max: number }>).forEach(([key, value]) => {
        formattedLimits[key] = {
          min: value.min.toString(),
          max: value.max.toString()
        };
      });
      setCurrencyLimits(formattedLimits);
    }
  }, [backendLimits]);

  // Update local state when balance data is loaded
  useEffect(() => {
    if (balanceData && typeof balanceData === 'object') {
      setBalances(balanceData as Record<string, number>);
    }
  }, [balanceData]);
  
  // State for order history filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  // Fetch all orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  // Fetch all contact messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ContactMessage[]>({
    queryKey: ['/api/contact'],
  });



  // Calculate analytics data
  const totalOrders = orders.length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const totalVolume = orders.reduce((sum, order) => sum + parseFloat(order.sendAmount || '0'), 0);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setSelectedOrderId("");
      setNewStatus("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  // Update exchange rate mutation
  const updateRateMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; rate: string }) => {
      const response = await apiRequest("POST", "/api/admin/exchange-rates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exchange rate updated successfully",
      });
      setFromCurrency("");
      setToCurrency("");
      setExchangeRate("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update exchange rate",
        variant: "destructive",
      });
    },
  });



  const handleStatusUpdate = () => {
    if (!selectedOrderId || !newStatus) {
      toast({
        title: "Error",
        description: "Please select an order and status",
        variant: "destructive",
      });
      return;
    }
    updateStatusMutation.mutate({ orderId: selectedOrderId, status: newStatus });
  };

  const handleRateUpdate = () => {
    if (!fromCurrency || !toCurrency || !exchangeRate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    updateRateMutation.mutate({ fromCurrency, toCurrency, rate: exchangeRate });
  };

  // Wallet management mutations
  const updateWalletMutation = useMutation({
    mutationFn: async ({ method, address }: { method: string; address: string }) => {
      console.log('Sending wallet update request:', { method, address });
      const response = await apiRequest('POST', '/api/admin/wallet-addresses', { method, address });
      const data = await response.json();
      console.log('Wallet update response:', data);
      return data;
    },
    onSuccess: (data: any, variables: { method: string; address: string }) => {
      console.log('Wallet update successful:', data, variables);
      
      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wallet-addresses'] });
      
      // Update timestamp
      setLastUpdated(data?.lastUpdated || new Date().toISOString());
      
      // Set recently updated for visual feedback
      setRecentlyUpdated(variables.method);
      setTimeout(() => setRecentlyUpdated(''), 3000); // Clear after 3 seconds
      
      // Update local state immediately for responsive UI
      setWalletAddresses(prev => ({
        ...prev,
        [variables.method]: variables.address
      }));
      
      // Show success notification
      toast({
        title: "✓ Wallet Updated Successfully",
        description: `${variables.method.toUpperCase()} address: ${variables.address.substring(0, 20)}${variables.address.length > 20 ? '...' : ''}`,
        duration: 4000,
      });
    },
    onError: (error: any) => {
      console.error('Wallet update failed:', error);
      toast({
        title: "❌ Update Failed",
        description: error.message || "Failed to update wallet address",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const updateApiEndpointMutation = useMutation({
    mutationFn: async ({ endpoint, url }: { endpoint: string; url: string }) => {
      const response = await apiRequest('POST', '/api/admin/api-endpoints', { endpoint, url });
      return await response.json();
    },
    onSuccess: (data: any, variables: { endpoint: string; url: string }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-endpoints'] });
      setLastUpdated(data?.lastUpdated || new Date().toISOString());
      // Update local state immediately
      setApiEndpoints(prev => ({
        ...prev,
        [variables.endpoint]: variables.url
      }));
      toast({
        title: "API Endpoint Updated",
        description: `${variables.endpoint.toUpperCase()} endpoint updated successfully`,
      });
    },
    onError: (error: any) => {
      console.error('API endpoint update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update API endpoint",
        variant: "destructive",
      });
    },
  });

  // Balance update mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async ({ currency, amount }: { currency: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/admin/balances", { currency, amount });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
      setRecentlyUpdatedBalance(data.currency.toLowerCase());
      setTimeout(() => setRecentlyUpdatedBalance(''), 3000);
      toast({
        title: "Balance Updated",
        description: `${data.currency} balance updated to ${data.amount}`,
      });
    },
    onError: (error: any) => {
      console.error('Balance update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update balance",
        variant: "destructive",
      });
    },
  });

  const handleWalletUpdate = (method: string, address: string) => {
    if (!address.trim()) {
      toast({
        title: "Error",
        description: "Wallet address cannot be empty",
        variant: "destructive",
      });
      return;
    }
    console.log('Updating wallet:', { method, address });
    updateWalletMutation.mutate({ method, address });
  };

  const handleApiEndpointUpdate = (endpoint: string, url: string) => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "API URL cannot be empty",
        variant: "destructive",
      });
      return;
    }
    updateApiEndpointMutation.mutate({ endpoint, url });
  };

  const handleBalanceUpdate = (currency: string, amount: number) => {
    if (amount < 0) {
      toast({
        title: "Error",
        description: "Balance cannot be negative",
        variant: "destructive",
      });
      return;
    }
    updateBalanceMutation.mutate({ currency, amount });
  };



  // Filter orders for history
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phoneNumber.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    const matchesDate = dateRange === "all" || (() => {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const diffTime = now.getTime() - orderDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateRange) {
        case "today": return diffDays <= 1;
        case "week": return diffDays <= 7;
        case "month": return diffDays <= 30;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'processing': return <Clock3 className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'From', 'To', 'Send Amount', 'Receive Amount', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.orderId,
        `"${order.fullName}"`,
        order.phoneNumber,
        order.sendMethod,
        order.receiveMethod,
        order.sendAmount,
        order.receiveAmount,
        order.status,
        formatDate(order.createdAt)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage orders, exchange rates, and transaction limits</p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
            <TabsTrigger value="limits">Balance Management</TabsTrigger>
            <TabsTrigger value="wallets">Wallet Settings</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Orders Management */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Update Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="orderId">Order ID</Label>
                    <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((order) => (
                          <SelectItem key={order.orderId} value={order.orderId}>
                            {order.orderId} - {order.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">New Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={handleStatusUpdate} 
                      disabled={updateStatusMutation.isPending}
                      className="w-full"
                    >
                      {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Order Management</CardTitle>
                    <p className="text-sm text-gray-600">
                      Accept orders to mark as completed or cancel pending/paid orders. Completed and cancelled orders cannot be modified.
                    </p>
                    {statusFilter !== "all" && (
                      <p className="text-sm font-medium text-blue-600 mt-1">
                        Showing {statusFilter} orders only ({orders.filter(order => order.status === statusFilter).length} found)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="status-filter">Filter:</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Orders" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <p>Loading orders...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const filteredOrders = orders.filter((order) => statusFilter === "all" || order.status === statusFilter);
                          
                          if (filteredOrders.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                  {statusFilter === "all" 
                                    ? "No orders found" 
                                    : `No ${statusFilter} orders found`
                                  }
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          return filteredOrders.map((order) => (
                            <TableRow key={order.orderId}>
                              <TableCell className="font-medium">{order.orderId}</TableCell>
                              <TableCell>{order.fullName}</TableCell>
                              <TableCell>{formatCurrency(order.sendAmount, order.sendMethod)}</TableCell>
                              <TableCell>{formatCurrency(order.receiveAmount, order.receiveMethod)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(order.status)}>
                                  <div className="flex items-center">
                                    {getStatusIcon(order.status)}
                                    <span className="ml-1 capitalize">{order.status}</span>
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(order.createdAt)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {order.status === "pending" || order.status === "paid" ? (
                                    <>
                                      {/* Accept Order Confirmation Dialog */}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            disabled={acceptOrderMutation.isPending}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Accept
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Accept Order</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to accept order {order.orderId}? This will mark the order as completed and cannot be undone.
                                              <div className="mt-3 p-3 bg-gray-50 rounded">
                                                <p><strong>Customer:</strong> {order.fullName}</p>
                                                <p><strong>Amount:</strong> {formatCurrency(order.sendAmount, order.sendMethod)} → {formatCurrency(order.receiveAmount, order.receiveMethod)}</p>
                                              </div>
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => acceptOrderMutation.mutate(order.orderId)}
                                              className="bg-green-600 hover:bg-green-700"
                                            >
                                              Accept Order
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>

                                      {/* Cancel Order Confirmation Dialog */}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={cancelOrderMutation.isPending}
                                          >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Cancel
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to cancel order {order.orderId}? This action cannot be undone and the customer will be notified.
                                              <div className="mt-3 p-3 bg-gray-50 rounded">
                                                <p><strong>Customer:</strong> {order.fullName}</p>
                                                <p><strong>Amount:</strong> {formatCurrency(order.sendAmount, order.sendMethod)} → {formatCurrency(order.receiveAmount, order.receiveMethod)}</p>
                                              </div>
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Keep Order</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => cancelOrderMutation.mutate(order.orderId)}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              Cancel Order
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </>
                                  ) : (
                                    <span className="text-gray-500 text-sm">No actions available</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exchange Rates Management */}
          <TabsContent value="rates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Update Exchange Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="fromCurrency">From Currency</Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="toCurrency">To Currency</Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select to currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="rate">Exchange Rate</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="0.000000"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={handleRateUpdate} 
                      disabled={updateRateMutation.isPending}
                      className="w-full"
                    >
                      {updateRateMutation.isPending ? "Updating..." : "Update Rate"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Management */}
          <TabsContent value="limits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Balance Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Actual Currency Balance Management */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-green-900 mb-4">Currency Balance Management</h3>
                  <p className="text-green-700 mb-6">Manage available balances for each currency - these control maximum outgoing amounts</p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {paymentMethods.map((method) => (
                      <div key={method.value} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-lg mb-4 flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <DollarSign className="w-4 h-4 text-green-600" />
                          </div>
                          {method.label}
                        </h4>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`balance-${method.value}`}>Current Balance ($)</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id={`balance-${method.value}`}
                                type="number"
                                value={balances[method.value.toUpperCase()] || 0}
                                onChange={(e) => setBalances(prev => ({
                                  ...prev,
                                  [method.value.toUpperCase()]: parseFloat(e.target.value) || 0
                                }))}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                className="flex-1"
                              />
                              <Button
                                onClick={async () => {
                                  try {
                                    const balance = balances[method.value.toUpperCase()] || 0;
                                    const response = await apiRequest("POST", "/api/admin/balances", {
                                      currency: method.value,
                                      amount: balance,
                                    });
                                    
                                    if (response.ok) {
                                      queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
                                      
                                      setRecentlyUpdatedBalance(method.value);
                                      setTimeout(() => setRecentlyUpdatedBalance(''), 3000);
                                      
                                      toast({
                                        title: "✓ Balance Updated",
                                        description: `${method.label}: $${balance.toLocaleString()}`,
                                        duration: 4000,
                                      });
                                    } else {
                                      throw new Error("Failed to update balance");
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "❌ Update Failed",
                                      description: "Failed to update balance",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                size="sm"
                                className={recentlyUpdatedBalance === method.value ? "bg-green-600" : ""}
                              >
                                {recentlyUpdatedBalance === method.value ? "✓" : "Update"}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            Available for outgoing transactions. Orders cannot exceed this amount.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction Limits Management */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Transaction Limits Management</h3>
                  <p className="text-blue-700 mb-6">Set minimum and maximum transaction amounts for each currency</p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {paymentMethods.map((method) => (
                      <div key={method.value} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-lg mb-4 flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          {method.label}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor={`min-${method.value}`}>Min Amount ($)</Label>
                            <Input
                              id={`min-${method.value}`}
                              type="number"
                              value={currencyLimits[method.value]?.min || "5"}
                              onChange={(e) => setCurrencyLimits(prev => ({
                                ...prev,
                                [method.value]: {
                                  ...prev[method.value],
                                  min: e.target.value
                                }
                              }))}
                              placeholder="5"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`max-${method.value}`}>Max Amount ($)</Label>
                            <Input
                              id={`max-${method.value}`}
                              type="number"
                              value={currencyLimits[method.value]?.max || "10000"}
                              onChange={(e) => setCurrencyLimits(prev => ({
                                ...prev,
                                [method.value]: {
                                  ...prev[method.value],
                                  max: e.target.value
                                }
                              }))}
                              placeholder="10000"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        
                        <Button
                          onClick={async () => {
                            const min = currencyLimits[method.value]?.min || "5";
                            const max = currencyLimits[method.value]?.max || "10000";
                            
                            try {
                              const response = await apiRequest("POST", `/api/admin/currency-limits/${method.value}`, {
                                minAmount: min,
                                maxAmount: max,
                              });
                              
                              if (response.ok) {
                                // Invalidate multiple caches to refresh the data everywhere
                                queryClient.invalidateQueries({ queryKey: ["/api/admin/balance-limits"] });
                                queryClient.invalidateQueries({ queryKey: ["/api/currency-limits"] });
                                queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
                                
                                toast({
                                  title: "✓ Limits Updated",
                                  description: `${method.label}: Min $${min} | Max $${parseFloat(max).toLocaleString()}`,
                                  duration: 4000,
                                });
                              } else {
                                throw new Error("Failed to update limits");
                              }
                            } catch (error) {
                              toast({
                                title: "❌ Update Failed",
                                description: "Failed to update currency limits",
                                variant: "destructive",
                              });
                            }
                          }}
                          size="sm"
                          className="w-full"
                        >
                          Update {method.label} Limits
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Settings Overview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Current Settings Overview</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Currency</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Min Amount</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Max Amount</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentMethods.map((method) => {
                          const min = currencyLimits[method.value]?.min || "5";
                          const max = currencyLimits[method.value]?.max || "10000";
                          return (
                            <tr key={method.value} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-medium">{method.label}</td>
                              <td className="border border-gray-300 px-4 py-2">${min}</td>
                              <td className="border border-gray-300 px-4 py-2">${max}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Active
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Balance Impact Information */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Balance Settings Impact</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Changes apply immediately to new transactions</li>
                    <li>• Users will see updated limits on the exchange form</li>
                    <li>• Each currency has its own individual limits</li>
                    <li>• Existing pending orders are not affected</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Management Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wallet Address Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Payment Wallet Management
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Update wallet addresses and account numbers for each payment method
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {walletData ? (
                    Object.entries(walletAddresses).map(([method, address]) => {
                      const methodLabel = paymentMethods.find(p => p.value === method)?.label || method.toUpperCase();
                      return (
                        <div key={method} className={`space-y-2 p-3 rounded-lg transition-all duration-300 ${
                          recentlyUpdated === method ? 'bg-green-50 border border-green-200' : 'bg-transparent'
                        }`}>
                          <Label htmlFor={`wallet-${method}`} className="text-sm font-semibold flex items-center gap-2">
                            {methodLabel}
                            {recentlyUpdated === method && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                ✓ Updated
                              </span>
                            )}
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`wallet-${method}`}
                              value={address || ''}
                              onChange={(e) => setWalletAddresses(prev => ({
                                ...prev,
                                [method]: e.target.value
                              }))}
                              placeholder={`Enter ${methodLabel} wallet/account`}
                              className={`flex-1 transition-all duration-200 ${
                                recentlyUpdated === method ? 'border-green-300 focus:border-green-500' : ''
                              }`}
                            />
                            <Button
                              onClick={() => handleWalletUpdate(method, address)}
                              disabled={updateWalletMutation.isPending}
                              size="sm"
                              className={`transition-all duration-200 ${
                                updateWalletMutation.isPending 
                                  ? "bg-gray-400 cursor-not-allowed" 
                                  : recentlyUpdated === method
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              {updateWalletMutation.isPending ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  Saving...
                                </div>
                              ) : recentlyUpdated === method ? (
                                "✓ Saved"
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Current: {address || 'Not configured'}
                          </p>
                          {recentlyUpdated === method && (
                            <div className="flex items-center gap-2 text-sm text-green-700">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Successfully saved to database
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading wallet addresses...</p>
                      </div>
                    </div>
                  )}
                  
                  {lastUpdated && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        Last updated: {new Date(lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* API Endpoints Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    API Endpoint Configuration
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Configure API endpoints for external integrations
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {apiData ? (
                    Object.entries(apiEndpoints).map(([endpoint, url]) => {
                      const endpointLabel = endpoint.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <div key={endpoint} className="space-y-2">
                          <Label htmlFor={`api-${endpoint}`} className="text-sm font-semibold">
                            {endpointLabel}
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`api-${endpoint}`}
                              value={url || ''}
                              onChange={(e) => setApiEndpoints(prev => ({
                                ...prev,
                                [endpoint]: e.target.value
                              }))}
                              placeholder={`Enter ${endpointLabel} URL`}
                              className="flex-1"
                            />
                            <Button
                              onClick={() => handleApiEndpointUpdate(endpoint, url)}
                              disabled={updateApiEndpointMutation.isPending}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {updateApiEndpointMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Current: {url || 'Not configured'}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading API endpoints...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Current Wallet Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Current Wallet Configuration</CardTitle>
                <p className="text-sm text-gray-600">
                  Overview of all configured payment methods and their addresses
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Payment Method</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Type</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Address/Account</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(walletAddresses).map(([method, address]) => {
                        const methodData = paymentMethods.find(p => p.value === method);
                        const methodLabel = methodData?.label || method.toUpperCase();
                        
                        let methodType = "Digital Wallet";
                        if (method === 'premier') methodType = "Bank Account";
                        else if (['zaad', 'sahal', 'evc'].includes(method)) methodType = "Mobile Money";
                        else if (['trc20', 'trx', 'peb20'].includes(method)) methodType = "Cryptocurrency";
                        
                        return (
                          <tr key={method} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium">{methodLabel}</td>
                            <td className="border border-gray-300 px-4 py-2">{methodType}</td>
                            <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                              {address || 'Not configured'}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <Badge 
                                variant="outline" 
                                className={address ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}
                              >
                                {address ? 'Configured' : 'Missing'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Security and Usage Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Security Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Wallet Security</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Verify wallet addresses before saving</li>
                      <li>• Use secure, dedicated business accounts</li>
                      <li>• Enable two-factor authentication when available</li>
                      <li>• Regularly monitor account balances</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-2">API Configuration</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Test endpoints before applying changes</li>
                      <li>• Use HTTPS URLs for security</li>
                      <li>• Validate API responses in testing</li>
                      <li>• Keep backup of working configurations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Contact Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <p>Loading messages...</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <Card key={message.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{message.name}</h4>
                              <p className="text-sm text-gray-600">{message.email}</p>
                            </div>
                            <Badge variant="outline">{message.subject}</Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{message.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(message.createdAt)}</p>
                        </CardContent>
                      </Card>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No messages yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-primary mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Volume</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${totalVolume.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}