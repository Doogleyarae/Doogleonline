import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Settings, Users } from "lucide-react";
import type { Order, ContactMessage, Transaction } from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("orders");

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}`);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Force immediate cache invalidation for real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contact'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exchange-rates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/balance-limits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/balances'] });
      
      toast({
        title: "Real-time Update",
        description: "Data refreshed with latest changes"
      });
    };

    return () => ws.close();
  }, [toast]);

  // Fetch data with forced cache removal for immediate updates
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders', Date.now()],
    staleTime: 0,
    refetchInterval: 2000
  });

  const { data: contactMessages = [] } = useQuery({
    queryKey: ['/api/contact', Date.now()],
    staleTime: 0
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', Date.now()],
    staleTime: 0
  });

  const { data: balances = {} } = useQuery({
    queryKey: ['/api/admin/balances', Date.now()],
    staleTime: 0
  });

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['/api/admin/exchange-rates', Date.now()],
    staleTime: 0
  });

  // Update order status with immediate persistence
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      // Force immediate cache removal and refetch
      queryClient.removeQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Success",
        description: "Order status updated and saved permanently"
      });
    }
  });

  // Update exchange rate with immediate persistence
  const updateRateMutation = useMutation({
    mutationFn: async ({ from, to, rate }: { from: string; to: string; rate: number }) => {
      const response = await apiRequest("POST", "/api/admin/exchange-rates", {
        fromCurrency: from,
        toCurrency: to,
        rate
      });
      return response.json();
    },
    onSuccess: () => {
      // Force immediate cache removal for instant updates
      queryClient.removeQueries({ queryKey: ['/api/admin/exchange-rates'] });
      queryClient.removeQueries({ queryKey: ['/api/exchange-rate'] });
      toast({
        title: "Success",
        description: "Exchange rate updated and applied instantly"
      });
    }
  });

  // Update balance with immediate persistence
  const updateBalanceMutation = useMutation({
    mutationFn: async ({ currency, amount }: { currency: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/admin/balances", {
        currency,
        amount
      });
      return response.json();
    },
    onSuccess: () => {
      // Force immediate cache removal
      queryClient.removeQueries({ queryKey: ['/api/admin/balances'] });
      toast({
        title: "Success",
        description: "Balance updated and saved permanently"
      });
    }
  });

  const pendingOrders = orders.filter((order: Order) => order.status === 'pending');
  const paidOrders = orders.filter((order: Order) => order.status === 'paid');
  const completedOrders = orders.filter((order: Order) => order.status === 'completed');

  const totalVolume = orders.reduce((sum: number, order: Order) => {
    return sum + parseFloat(order.sendAmount || '0');
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage orders, rates, and platform settings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold">{pendingOrders.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Paid Orders</p>
                  <p className="text-2xl font-bold">{paidOrders.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{completedOrders.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold">${totalVolume.toFixed(0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.slice(0, 10).map((order: Order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            {order.orderId}
                          </TableCell>
                          <TableCell>{order.fullName}</TableCell>
                          <TableCell>
                            ${order.sendAmount} → ${order.receiveAmount}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              order.status === 'completed' ? 'default' :
                              order.status === 'paid' ? 'secondary' :
                              order.status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {order.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderMutation.mutate({
                                    orderId: order.orderId,
                                    status: 'paid'
                                  })}
                                  disabled={updateOrderMutation.isPending}
                                >
                                  Mark Paid
                                </Button>
                              )}
                              {order.status === 'paid' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderMutation.mutate({
                                    orderId: order.orderId,
                                    status: 'completed'
                                  })}
                                  disabled={updateOrderMutation.isPending}
                                >
                                  Complete
                                </Button>
                              )}
                              {order.status !== 'completed' && order.status !== 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateOrderMutation.mutate({
                                    orderId: order.orderId,
                                    status: 'cancelled'
                                  })}
                                  disabled={updateOrderMutation.isPending}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exchange Rates Tab */}
          <TabsContent value="rates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exchange Rates Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input placeholder="From Currency" id="from-currency" />
                    <Input placeholder="To Currency" id="to-currency" />
                    <Input placeholder="Rate" type="number" step="0.01" id="rate-input" />
                  </div>
                  <Button 
                    onClick={() => {
                      const from = (document.getElementById('from-currency') as HTMLInputElement)?.value;
                      const to = (document.getElementById('to-currency') as HTMLInputElement)?.value;
                      const rate = parseFloat((document.getElementById('rate-input') as HTMLInputElement)?.value || '0');
                      
                      if (from && to && rate > 0) {
                        updateRateMutation.mutate({ from, to, rate });
                        // Clear inputs
                        (document.getElementById('from-currency') as HTMLInputElement).value = '';
                        (document.getElementById('to-currency') as HTMLInputElement).value = '';
                        (document.getElementById('rate-input') as HTMLInputElement).value = '';
                      }
                    }}
                    disabled={updateRateMutation.isPending}
                  >
                    Update Rate (Saves Immediately)
                  </Button>
                </div>
                
                <div className="mt-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exchangeRates.map((rate: any) => (
                        <TableRow key={`${rate.fromCurrency}-${rate.toCurrency}`}>
                          <TableCell className="uppercase">{rate.fromCurrency}</TableCell>
                          <TableCell className="uppercase">{rate.toCurrency}</TableCell>
                          <TableCell>{rate.rate}</TableCell>
                          <TableCell>{formatDate(rate.updatedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balances Tab */}
          <TabsContent value="balances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Balances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(balances).map(([currency, balance]) => (
                    <Card key={currency}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium uppercase">{currency}</span>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold">${balance}</p>
                        <div className="flex gap-2 mt-3">
                          <Input 
                            placeholder="New amount" 
                            type="number" 
                            id={`balance-${currency}`}
                            className="text-sm"
                          />
                          <Button 
                            size="sm"
                            onClick={() => {
                              const amount = parseFloat((document.getElementById(`balance-${currency}`) as HTMLInputElement)?.value || '0');
                              if (amount > 0) {
                                updateBalanceMutation.mutate({ currency, amount });
                                (document.getElementById(`balance-${currency}`) as HTMLInputElement).value = '';
                              }
                            }}
                            disabled={updateBalanceMutation.isPending}
                          >
                            Update
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contactMessages.map((message: ContactMessage) => (
                    <Card key={message.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{message.name}</p>
                            <p className="text-sm text-gray-600">{message.email}</p>
                          </div>
                          <Badge variant="outline">
                            {formatDate(message.createdAt)}
                          </Badge>
                        </div>
                        <p className="text-gray-800 mb-3">{message.message}</p>
                        {message.response && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">Admin Response:</p>
                            <p className="text-blue-800">{message.response}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}