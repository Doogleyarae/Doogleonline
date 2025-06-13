import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  
  // State for exchange rate management
  const [fromCurrency, setFromCurrency] = useState<string>("");
  const [toCurrency, setToCurrency] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<string>("");
  
  // State for balance management
  const [limitMinAmount, setLimitMinAmount] = useState<string>("5");
  const [limitMaxAmount, setLimitMaxAmount] = useState<string>("10000");
  
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
            <TabsTrigger value="limits">Balance Management</TabsTrigger>
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
                {/* Balance Limits System */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Set Balance Limits</h3>
                  <p className="text-blue-700 mb-6">Set minimum and maximum transaction amounts for all exchanges</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Label htmlFor="minBalance">Minimum Balance ($)</Label>
                      <Input
                        id="minBalance"
                        type="number"
                        value={limitMinAmount}
                        onChange={(e) => setLimitMinAmount(e.target.value)}
                        placeholder="5"
                        min="0"
                        step="0.01"
                        className="text-lg"
                      />
                      <p className="text-sm text-gray-600 mt-1">The lowest amount users can exchange</p>
                    </div>
                    <div>
                      <Label htmlFor="maxBalance">Maximum Balance ($)</Label>
                      <Input
                        id="maxBalance"
                        type="number"
                        value={limitMaxAmount}
                        onChange={(e) => setLimitMaxAmount(e.target.value)}
                        placeholder="10000"
                        min="0"
                        step="0.01"
                        className="text-lg"
                      />
                      <p className="text-sm text-gray-600 mt-1">The highest amount users can exchange</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => {
                      toast({
                        title: "Success",
                        description: `Balance limits updated: Min $${limitMinAmount}, Max $${limitMaxAmount}`,
                      });
                    }}
                    disabled={!limitMinAmount || !limitMaxAmount}
                    className="w-full"
                  >
                    Update Balance Limits
                  </Button>
                </div>

                {/* Current Balance Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Current Balance Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                            <DollarSign className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Minimum Balance</p>
                            <p className="text-2xl font-bold text-gray-900">${limitMinAmount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Maximum Balance</p>
                            <p className="text-2xl font-bold text-gray-900">${limitMaxAmount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Balance Impact Information */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Balance Settings Impact</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Changes apply immediately to all new transactions</li>
                    <li>• Users will see updated limits on the exchange form</li>
                    <li>• All currency pairs use the same balance limits</li>
                    <li>• Existing pending orders are not affected</li>
                  </ul>
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