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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // State for exchange rate management
  const [fromCurrency, setFromCurrency] = useState<string>("");
  const [toCurrency, setToCurrency] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<string>("");
  
  // State for balance management
  const [balances, setBalances] = useState<{ [key: string]: number }>({});
  const [recentlyUpdatedBalance, setRecentlyUpdatedBalance] = useState<string>("");
  
  // State for currency limits
  const [currencyLimits, setCurrencyLimits] = useState<{ [key: string]: { min: number; max: number } }>({});
  const [savingLimits, setSavingLimits] = useState<boolean>(false);

  // Queries
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: allExchangeRates = [] } = useQuery({
    queryKey: ["/api/admin/exchange-rates"],
    staleTime: 30 * 60 * 1000,
  });

  const { data: adminBalances = {} } = useQuery({
    queryKey: ["/api/admin/balances"],
    staleTime: 30 * 60 * 1000,
  });

  const { data: contactMessages = [] } = useQuery({
    queryKey: ["/api/contact"],
    staleTime: 30 * 60 * 1000,
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully",
      });
      setSelectedOrderId("");
      setNewStatus("");
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/exchange-rate", {
        fromCurrency,
        toCurrency,
        rate: parseFloat(exchangeRate),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exchange-rates"] });
      toast({
        title: "Rate Updated",
        description: `Exchange rate for ${fromCurrency} to ${toCurrency} updated`,
      });
      setFromCurrency("");
      setToCurrency("");
      setExchangeRate("");
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update exchange rate",
        variant: "destructive",
      });
    },
  });

  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status: "completed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Accepted",
        description: "Order has been marked as completed",
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled",
      });
    },
  });

  // Load balances
  useEffect(() => {
    if (adminBalances) {
      setBalances(adminBalances);
    }
  }, [adminBalances]);

  // Helper functions
  const handleStatusUpdate = () => {
    if (selectedOrderId && newStatus) {
      updateStatusMutation.mutate({ orderId: selectedOrderId, status: newStatus });
    }
  };

  const handleRateUpdate = () => {
    if (fromCurrency && toCurrency && exchangeRate) {
      updateRateMutation.mutate();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      case "processing":
        return <Clock3 className="w-3 h-3" />;
      case "paid":
        return <DollarSign className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Send Amount', 'Receive Amount', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...orders.map((order: Order) => [
        order.orderId,
        order.fullName,
        order.sendAmount,
        order.receiveAmount,
        order.status,
        new Date(order.createdAt).toLocaleDateString()
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 text-lg">
                Comprehensive management center for orders, rates, and system settings
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                <div className="text-sm text-slate-500">Total Orders</div>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {orders.filter((o: Order) => o.status === 'completed').length}
                </div>
                <div className="text-sm text-slate-500">Completed</div>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {orders.filter((o: Order) => o.status === 'pending').length}
                </div>
                <div className="text-sm text-slate-500">Pending</div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <TabsList className="grid w-full grid-cols-6 bg-slate-50 gap-2 p-2">
              <TabsTrigger 
                value="orders" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-3 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Orders</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="rates" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-3 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Exchange Rates</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="limits" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-3 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">Balance Management</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="wallets" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-3 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Wallets</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-3 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium">Messages</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-3 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Analytics</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Orders Management */}
          <TabsContent value="orders" className="space-y-8">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 p-6">
                <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  Quick Order Actions
                </h3>
                <p className="text-slate-600 mt-1">Update order status or manage pending transactions</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="orderId" className="text-sm font-medium text-slate-700">Order Selection</Label>
                    <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                      <SelectTrigger className="bg-slate-50 border-slate-300 focus:bg-white">
                        <SelectValue placeholder="Choose an order to manage" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((order: Order) => (
                          <SelectItem key={order.orderId} value={order.orderId}>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                {order.orderId}
                              </span>
                              <span>{order.fullName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-slate-700">New Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="bg-slate-50 border-slate-300 focus:bg-white">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span>Pending</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="processing">
                          <div className="flex items-center space-x-2">
                            <Clock3 className="w-4 h-4 text-blue-500" />
                            <span>Processing</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Completed</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <div className="flex items-center space-x-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span>Cancelled</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={handleStatusUpdate} 
                      disabled={updateStatusMutation.isPending || !selectedOrderId || !newStatus}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300"
                      size="lg"
                    >
                      {updateStatusMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        "Update Status"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Management Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                      <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center mr-3">
                        <History className="w-4 h-4 text-white" />
                      </div>
                      Order Management
                    </h3>
                    <p className="text-slate-600 mt-1">
                      Review and manage all customer orders with quick action buttons
                    </p>
                    {statusFilter !== "all" && (
                      <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mt-2">
                        <Filter className="w-3 h-3 mr-1" />
                        Showing {statusFilter} orders ({orders.filter((order: Order) => order.status === statusFilter).length} found)
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="status-filter" className="text-sm font-medium text-slate-700 whitespace-nowrap">Filter by:</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-white border-slate-300">
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
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-0">
                {ordersLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-600">Loading orders...</span>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50">
                          <TableHead className="font-semibold text-slate-700 py-4">Order ID</TableHead>
                          <TableHead className="font-semibold text-slate-700 py-4">Customer</TableHead>
                          <TableHead className="font-semibold text-slate-700 py-4">Transaction</TableHead>
                          <TableHead className="font-semibold text-slate-700 py-4">Status</TableHead>
                          <TableHead className="font-semibold text-slate-700 py-4">Date</TableHead>
                          <TableHead className="font-semibold text-slate-700 py-4 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const filteredOrders = orders.filter((order: Order) => statusFilter === "all" || order.status === statusFilter);
                          
                          if (filteredOrders.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">
                                  <div className="flex flex-col items-center space-y-3">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                      <Search className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div className="text-slate-500 font-medium">
                                      {statusFilter === "all" ? "No orders found" : `No ${statusFilter} orders found`}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                      Orders will appear here when customers place transactions
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          return filteredOrders.map((order: Order) => (
                            <TableRow key={order.orderId} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                              <TableCell className="py-4">
                                <div className="font-mono text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  {order.orderId}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div>
                                  <div className="font-medium text-slate-800">{order.fullName}</div>
                                  <div className="text-sm text-slate-500">{order.phoneNumber}</div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-slate-600">Send:</span>
                                    <span className="font-semibold text-slate-800">
                                      {formatCurrency(order.sendAmount, order.sendMethod)}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-slate-600">Receive:</span>
                                    <span className="font-semibold text-green-600">
                                      {formatCurrency(order.receiveAmount, order.receiveMethod)}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge className={`${getStatusColor(order.status)} border-0 font-medium`}>
                                  <div className="flex items-center space-x-1">
                                    {getStatusIcon(order.status)}
                                    <span className="capitalize">{order.status}</span>
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="text-sm text-slate-600">
                                  {formatDate(order.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex justify-center space-x-2">
                                  {order.status === "pending" || order.status === "paid" ? (
                                    <>
                                      {/* Accept Order Button */}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            disabled={acceptOrderMutation.isPending}
                                            className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm"
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Accept
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="sm:max-w-md">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center space-x-2">
                                              <CheckCircle className="w-5 h-5 text-green-600" />
                                              <span>Accept Order</span>
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to accept order {order.orderId}? This will mark the order as completed and cannot be undone.
                                              <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                                                <div className="space-y-2 text-sm">
                                                  <div><span className="font-medium text-slate-700">Customer:</span> {order.fullName}</div>
                                                  <div><span className="font-medium text-slate-700">Transaction:</span> {formatCurrency(order.sendAmount, order.sendMethod)} → {formatCurrency(order.receiveAmount, order.receiveMethod)}</div>
                                                </div>
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

                                      {/* Cancel Order Button */}
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
                                    <span className="text-slate-400 text-sm italic">No actions available</span>
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
              </div>
            </div>
          </TabsContent>

          {/* Exchange Rates Management */}
          <TabsContent value="rates" className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200 p-6">
                <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  Current Exchange Rates
                </h3>
                <p className="text-slate-600 mt-1">Live rates affecting all transaction calculations</p>
              </div>
              <div className="p-6">
                {Array.isArray(allExchangeRates) && allExchangeRates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {allExchangeRates.map((rate: any) => (
                      <div key={`${rate.fromCurrency}-${rate.toCurrency}`} className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="font-semibold text-slate-700 bg-white px-2 py-1 rounded text-sm">
                            {rate.fromCurrency.toUpperCase()}
                          </span>
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold text-slate-700 bg-white px-2 py-1 rounded text-sm">
                            {rate.toCurrency.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-center mb-3">
                          <p className="text-2xl font-bold text-blue-600">
                            {parseFloat(rate.rate).toFixed(6)}
                          </p>
                          <p className="text-xs text-slate-500">Rate per unit</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFromCurrency(rate.fromCurrency);
                            setToCurrency(rate.toCurrency);
                            setExchangeRate(rate.rate);
                          }}
                          className="w-full bg-white hover:bg-blue-50 border-blue-200 text-blue-600"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Edit Rate
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-slate-600 font-medium mb-2">No exchange rates configured</h4>
                    <p className="text-sm text-slate-400">Set up your first exchange rate using the form below</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rate Update Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200 p-6">
                <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center mr-3">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  Update Exchange Rate
                </h3>
                <p className="text-slate-600 mt-1">Changes apply immediately to all live calculations</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fromCurrency" className="text-sm font-medium text-slate-700">From Currency</Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="bg-slate-50 border-slate-300 focus:bg-white">
                        <SelectValue placeholder="Choose source currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{method.label}</span>
                              <span className="text-xs text-slate-500 uppercase">({method.value})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="toCurrency" className="text-sm font-medium text-slate-700">To Currency</Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="bg-slate-50 border-slate-300 focus:bg-white">
                        <SelectValue placeholder="Choose target currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{method.label}</span>
                              <span className="text-xs text-slate-500 uppercase">({method.value})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rate" className="text-sm font-medium text-slate-700">Exchange Rate</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="Enter rate (e.g., 0.950000)"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="bg-slate-50 border-slate-300 focus:bg-white"
                    />
                    <p className="text-xs text-slate-500">Precision: Up to 6 decimal places</p>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={handleRateUpdate} 
                      disabled={updateRateMutation.isPending || !fromCurrency || !toCurrency || !exchangeRate}
                      className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300"
                      size="lg"
                    >
                      {updateRateMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Update Rate</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Other tabs can be added here */}
          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle>Balance Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Balance management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallets">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Wallet settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contactMessages.map((message: ContactMessage) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="font-medium">{message.name}</div>
                      <div className="text-sm text-gray-600">{message.email}</div>
                      <div className="mt-2">{message.message}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}