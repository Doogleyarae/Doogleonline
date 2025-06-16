import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { XCircle, Search, ArrowLeft, Calendar, User, Phone, CreditCard, Download, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { Link } from "wouter";
// Type definition for Order
interface Order {
  id: number;
  orderId: string;
  fullName: string;
  phoneNumber: string;
  senderAccount?: string;
  sendAmount: string;
  sendMethod: string;
  receiveAmount: string;
  receiveMethod: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function CancelledOrders() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all orders and filter for cancelled ones
  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Filter for cancelled orders only
  const cancelledOrders = Array.isArray(allOrders) ? allOrders.filter((order: any) => order.status === "cancelled") : [];

  // Apply search filter
  const filteredOrders = cancelledOrders.filter((order: Order) => {
    if (searchTerm === "") return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const orderIdLower = order.orderId.toLowerCase();
    
    // If search looks like an Order ID (contains DGL- pattern), prioritize exact Order ID matches
    if (searchTerm.toUpperCase().includes('DGL-')) {
      return orderIdLower.includes(searchLower);
    } else {
      // Search in all fields for non-Order ID searches
      return orderIdLower.includes(searchLower) ||
             order.fullName.toLowerCase().includes(searchLower) ||
             order.phoneNumber.includes(searchTerm);
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Sender Account', 'Send Amount', 'Send Method', 'Receive Amount', 'Receive Method', 'Cancelled Date'];
    const csvData = filteredOrders.map((order: any) => [
      order.orderId,
      order.fullName,
      order.phoneNumber,
      order.senderAccount || 'Not provided',
      order.sendAmount,
      order.sendMethod,
      order.receiveAmount,
      order.receiveMethod,
      formatDate(order.updatedAt || order.createdAt)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map((field: any) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cancelled-orders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            Cancelled Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage all cancelled orders. These orders were terminated and any held amounts were released back to exchange wallets.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                Total Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {cancelledOrders.length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Orders cancelled
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
                <CreditCard className="w-5 h-5 text-blue-500 mr-2" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ${cancelledOrders.reduce((sum: number, order: Order) => sum + parseFloat(order.sendAmount), 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total cancelled amount
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
                <Filter className="w-5 h-5 text-purple-500 mr-2" />
                Filtered Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {filteredOrders.length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {searchTerm ? `Matching "${searchTerm}"` : 'All cancelled orders'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cancelled Orders Table */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <CardTitle className="flex items-center text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  Cancelled Orders History
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete history of cancelled orders with customer details and cancellation information.
                </p>
              </div>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                {/* Search Input */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="search-orders" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Search:</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search-orders"
                      type="text"
                      placeholder="Order ID, name, phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-48 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl h-10 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Export Button */}
                <Button 
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                  <span className="text-gray-600 dark:text-gray-400">Loading cancelled orders...</span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50/70 dark:hover:bg-gray-800/70">
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Order ID</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Customer</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">From</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">To</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Cancelled Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                              <Search className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {searchTerm ? `No cancelled orders found for "${searchTerm}"` : 
                               cancelledOrders.length === 0 ? "No cancelled orders found" : "No orders match your search"}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order: Order) => (
                        <TableRow key={order.orderId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <TableCell className="font-medium text-red-600 dark:text-red-400">{order.orderId}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {order.fullName}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {order.phoneNumber}
                              </span>
                              {order.senderAccount && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Account: {order.senderAccount}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{formatCurrency(order.sendAmount, order.sendMethod)}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{order.sendMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{formatCurrency(order.receiveAmount, order.receiveMethod)}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{order.receiveMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50">
                              <div className="flex items-center">
                                <XCircle className="w-3 h-3 mr-1" />
                                <span className="capitalize">Cancelled</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(order.updatedAt || order.createdAt)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}