import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Settings, Users, DollarSign, MessageSquare, TrendingUp, CheckCircle, XCircle, Clock, Search, Download, Filter, History } from "lucide-react";
import type { Order, ContactMessage } from "@shared/schema";

const paymentMethods = [
  { value: "zaad", label: "Zaad" },
  { value: "sahal", label: "Sahal" },
  { value: "evc", label: "EVC Plus" },
  { value: "edahab", label: "eDahab" },
  { value: "premier", label: "Premier Bank" },
  { value: "moneygo", label: "MoneyGo" },
  { value: "trx", label: "TRX" },
  { value: "trc20", label: "TRC20" },
  { value: "peb20", label: "PEB20" },
  { value: "usdc", label: "USDC" },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [fromCurrency, setFromCurrency] = useState<string>("");
  const [toCurrency, setToCurrency] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<string>("");
  
  // Transaction limits
  const [minAmount, setMinAmount] = useState<string>("5");
  const [maxAmount, setMaxAmount] = useState<string>("10000");
  const [limitFromCurrency, setLimitFromCurrency] = useState<string>("");
  const [limitToCurrency, setLimitToCurrency] = useState<string>("");
  const [limitMinAmount, setLimitMinAmount] = useState<string>("5");
  const [limitMaxAmount, setLimitMaxAmount] = useState<string>("10000");

  // Query currency limits
  const { data: currencyLimitsData } = useQuery({
    queryKey: ["/api/admin/currency-limits"],
    enabled: true,
  });

  // Mutation for updating currency limits
  const updateCurrencyLimitMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; minAmount: string; maxAmount: string }) => {
      const response = await fetch("/api/admin/currency-limits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/currency-limits"] });
      setLimitFromCurrency("");
      setLimitToCurrency("");
      setLimitMinAmount("5");
      setLimitMaxAmount("10000");
      toast({
        title: "Success",
        description: "Currency limit updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update currency limit",
        variant: "destructive",
      });
    },
  });
  
  // Universal limits update mutation
  const updateLimitsMutation = useMutation({
    mutationFn: async ({ minAmount, maxAmount, fromCurrency, toCurrency }: { 
      minAmount: string; 
      maxAmount: string; 
      fromCurrency?: string; 
      toCurrency?: string; 
    }) => {
      const response = await apiRequest("POST", "/api/admin/universal-limits", { 
        min: parseFloat(minAmount), 
        max: parseFloat(maxAmount) 
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-limits"] });
      toast({
        title: "Limits Updated",
        description: `Universal limits updated: $${data.min} - $${data.max}`,
      });
    },
    onError: (error: any) => {
      console.error('Universal limits update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update universal limits",
        variant: "destructive",
      });
    },
  });

  // Order history filters
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

  // Update currency limits mutation
  const updateCurrencyLimitMutation2 = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; minAmount: string; maxAmount: string }) => {
      const response = await apiRequest("POST", "/api/admin/currency-limits", {
        fromCurrency: data.fromCurrency.toUpperCase(),
        toCurrency: data.toCurrency.toUpperCase(),
        minAmount: parseFloat(data.minAmount),
        maxAmount: parseFloat(data.maxAmount),
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `Currency limits set for ${variables.fromCurrency.toUpperCase()} → ${variables.toCurrency.toUpperCase()}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currency-limits'] });
      setLimitFromCurrency("");
      setLimitToCurrency("");
      setLimitMinAmount("5");
      setLimitMaxAmount("10000");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set currency limits",
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

  const handleLimitsUpdate = () => {
    if (!minAmount || !maxAmount) {
      toast({
        title: "Error",
        description: "Please enter both minimum and maximum amounts",
        variant: "destructive",
      });
      return;
    }
    if (parseFloat(minAmount) >= parseFloat(maxAmount)) {
      toast({
        title: "Error",
        description: "Minimum amount must be less than maximum amount",
        variant: "destructive",
      });
      return;
    }
    updateLimitsMutation.mutate({ 
      minAmount, 
      maxAmount, 
      fromCurrency: limitFromCurrency === "all" ? undefined : limitFromCurrency || undefined,
      toCurrency: limitToCurrency === "all" ? undefined : limitToCurrency || undefined
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    let matchesDate = true;
    
    if (dateRange === "today") {
      matchesDate = orderDate.toDateString() === now.toDateString();
    } else if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = orderDate >= weekAgo;
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = orderDate >= monthAgo;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Export orders to CSV
  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'From', 'To', 'Send Amount', 'Receive Amount', 'Status', 'Created'];
    const rows = filteredOrders.map(order => [
      order.orderId,
      order.fullName,
      order.phoneNumber,
      order.sendMethod,
      order.receiveMethod,
      order.sendAmount,
      order.receiveAmount,
      order.status,
      formatDate(new Date(order.createdAt))
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Orders exported successfully",
    });
  };

  // Calculate dashboard stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const totalRevenue = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + parseFloat(order.sendAmount), 0);
  const totalVolume = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + parseFloat(order.sendAmount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
        <p className="text-lg text-gray-600">Manage orders, exchange rates, and customer messages</p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-primary mr-3" />
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
              <Clock className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
          <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
          <TabsTrigger value="limits">Transaction Limits</TabsTrigger>
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
              <CardTitle>All Orders</CardTitle>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order History Management */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Order History
                </div>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Order ID, Name, Phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-filter">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setDateRange("all");
                    }}
                    className="w-full"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {filteredOrders.length} of {orders.length} orders
                </span>
                <span>
                  Total value: ${filteredOrders.reduce((sum, order) => sum + parseFloat(order.sendAmount), 0).toFixed(2)}
                </span>
              </div>

              {/* Orders Table */}
              {ordersLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No orders found matching your criteria
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>From Method</TableHead>
                        <TableHead>To Method</TableHead>
                        <TableHead>Send Amount</TableHead>
                        <TableHead>Receive Amount</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.orderId} className="hover:bg-gray-50">
                          <TableCell className="font-medium font-mono text-sm">
                            {order.orderId}
                          </TableCell>
                          <TableCell className="font-medium">
                            {order.fullName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {order.phoneNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {order.sendMethod.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {order.receiveMethod.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            ${parseFloat(order.sendAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(order.receiveAmount, order.receiveMethod)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {parseFloat(order.exchangeRate).toFixed(6)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              <div className="flex items-center">
                                {getStatusIcon(order.status)}
                                <span className="ml-1 capitalize">{order.status}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(order.updatedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exchange Rates */}
        <TabsContent value="rates" className="space-y-6">
          {/* Individual Rate Update */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Update Individual Exchange Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="fromCurrency">From Currency</Label>
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="From currency" />
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
                      <SelectValue placeholder="To currency" />
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

          {/* Bulk Rate Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Rate Management
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      paymentMethods.forEach(method => {
                        updateRateMutation.mutate({
                          fromCurrency: method.value,
                          toCurrency: "usd",
                          rate: "1"
                        });
                      });
                    }}
                  >
                    Set All to 1:1
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paymentMethods.map((fromMethod) => (
                  <div key={fromMethod.value} className="space-y-3">
                    <h4 className="font-semibold text-lg capitalize flex items-center">
                      {fromMethod.label} Exchange Rates
                    </h4>
                    <div className="space-y-2">
                      {paymentMethods
                        .filter(toMethod => toMethod.value !== fromMethod.value)
                        .map((toMethod) => (
                          <div key={`${fromMethod.value}-${toMethod.value}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {fromMethod.label} → {toMethod.label}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 font-mono">
                                1:1
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFromCurrency(fromMethod.value);
                                  setToCurrency(toMethod.value);
                                  setExchangeRate("1");
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Quick Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updates = [
                        { from: "zaad", to: "usd", rate: "0.0018" },
                        { from: "sahal", to: "usd", rate: "0.0017" },
                        { from: "premier", to: "usd", rate: "1" },
                        { from: "trc20", to: "usd", rate: "1" }
                      ];
                      updates.forEach(update => {
                        updateRateMutation.mutate({
                          fromCurrency: update.from,
                          toCurrency: update.to,
                          rate: update.rate
                        });
                      });
                    }}
                  >
                    Real Market Rates
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      paymentMethods.forEach(method => {
                        updateRateMutation.mutate({
                          fromCurrency: method.value,
                          toCurrency: "usd",
                          rate: "1"
                        });
                      });
                    }}
                  >
                    Reset All to 1:1
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const cryptoMethods = ["trx", "trc20", "peb20", "usdc"];
                      cryptoMethods.forEach(method => {
                        updateRateMutation.mutate({
                          fromCurrency: method,
                          toCurrency: "usd",
                          rate: "1"
                        });
                      });
                    }}
                  >
                    Crypto 1:1
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const mobileMethods = ["zaad", "sahal", "evc", "edahab"];
                      mobileMethods.forEach(method => {
                        updateRateMutation.mutate({
                          fromCurrency: method,
                          toCurrency: "usd",
                          rate: "0.0018"
                        });
                      });
                    }}
                  >
                    Mobile Money
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Limits */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Transaction Limits Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* New Currency Management System */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">Currency Limits Management</h3>
                <p className="text-blue-700 mb-6">Set minimum and maximum transaction amounts for individual currencies</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="fromCurrency">From Currency</Label>
                    <Select value={limitFromCurrency} onValueChange={setLimitFromCurrency}>
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
                    <Select value={limitToCurrency} onValueChange={setLimitToCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select to currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods
                          .filter(method => method.value !== limitFromCurrency)
                          .map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="minAmount">Min Amount ($)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      value={limitMinAmount}
                      onChange={(e) => setLimitMinAmount(e.target.value)}
                      placeholder="5"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Max Amount ($)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={limitMaxAmount}
                      onChange={(e) => setLimitMaxAmount(e.target.value)}
                      placeholder="10000"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    if (limitFromCurrency && limitToCurrency && limitMinAmount && limitMaxAmount) {
                      updateCurrencyLimitMutation2.mutate({
                        fromCurrency: limitFromCurrency,
                        toCurrency: limitToCurrency,
                        minAmount: limitMinAmount,
                        maxAmount: limitMaxAmount,
                      });
                    }
                  }}
                  disabled={!limitFromCurrency || !limitToCurrency || !limitMinAmount || !limitMaxAmount || updateCurrencyLimitMutation2.isPending}
                  className="w-full"
                >
                  {updateCurrencyLimitMutation2.isPending ? "Setting Limit..." : "Set Currency Limit"}
                </Button>
              </div>

              {/* Display Current Currency Limits */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Currency Limits</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {paymentMethods.map((fromMethod) => (
                    <div key={fromMethod.value} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-3 capitalize text-gray-800">
                        {fromMethod.label} Limits
                      </h4>
                      <div className="space-y-2">
                        {paymentMethods
                          .filter(toMethod => toMethod.value !== fromMethod.value)
                          .map((toMethod) => {
                            const key = `${fromMethod.value}-${toMethod.value}`;
                            const specificLimits = Array.isArray(currencyLimitsData) ? currencyLimitsData.find((limit: any) => 
                              limit.fromCurrency === fromMethod.value && limit.toCurrency === toMethod.value
                            ) : undefined;
                            const currentMin = specificLimits ? parseFloat(specificLimits.minAmount).toFixed(2) : "5.00";
                            const currentMax = specificLimits ? parseFloat(specificLimits.maxAmount).toFixed(2) : "10000.00";
                            const isCustom = !!specificLimits;
                            
                            return (
                              <div key={key} className={`flex items-center justify-between p-3 rounded-lg ${isCustom ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">
                                    → {toMethod.label}
                                  </span>
                                  {isCustom && (
                                    <Badge variant="secondary" className="text-xs">
                                      Custom
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-xs font-mono ${isCustom ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>
                                    ${currentMin} - ${currentMax}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setLimitFromCurrency(fromMethod.value);
                                      setLimitToCurrency(toMethod.value);
                                      if (specificLimits) {
                                        setLimitMinAmount(parseFloat(specificLimits.minAmount).toString());
                                        setLimitMaxAmount(parseFloat(specificLimits.maxAmount).toString());
                                      } else {
                                        setLimitMinAmount("5");
                                        setLimitMaxAmount("10000");
                                      }
                                    }}
                                  >
                                    {isCustom ? 'Edit' : 'Set Limit'}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
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
  );
}
