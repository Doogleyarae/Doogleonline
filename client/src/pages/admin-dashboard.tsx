import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { Order, ContactMessage, Transaction } from "@shared/schema";

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
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Authentication check
  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin/login");
      return;
    }
  }, [setLocation]);

  // Logout function
  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    setLocation("/admin/login");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };
  
  // State for order management
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  
  // State for universal transaction limits
  const [universalLimits, setUniversalLimits] = useState({
    min: 5,
    max: 10000
  });

  // State for individual currency minimums and maximums
  const [currencyMinimums, setCurrencyMinimums] = useState<Record<string, number>>({});
  const [currencyMaximums, setCurrencyMaximums] = useState<Record<string, number>>({});
  
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
  
  // Fetch all current exchange rates for display
  const { data: allExchangeRates = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/exchange-rates"],
    refetchInterval: 3000, // Refresh every 3 seconds to show latest rates
  });
  
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
  
  // State for admin contact information
  const [adminContact, setAdminContact] = useState({
    email: "dadayare3@gmail.com",
    whatsapp: "252611681818", 
    telegram: "@doogle143"
  });
  
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

  // Fetch admin contact information
  const { data: contactData } = useQuery({
    queryKey: ["/api/admin/contact-info"],
  });

  // Update contact info state when data is loaded
  useEffect(() => {
    if (contactData && typeof contactData === 'object') {
      const data = contactData as any;
      setAdminContact({
        email: data.email || "dadayare3@gmail.com",
        whatsapp: data.whatsapp || "252611681818", 
        telegram: data.telegram || "@doogle143"
      });
    }
  }, [contactData]);



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

  // Fetch all transactions for wallet balance workflow monitoring
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
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

  // Update exchange rate mutation with real-time cache invalidation
  const updateRateMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; rate: string }) => {
      const response = await apiRequest("POST", "/api/admin/exchange-rates", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Force complete cache removal for immediate fresh data
      queryClient.removeQueries({ 
        queryKey: [`/api/exchange-rate/${variables.fromCurrency}/${variables.toCurrency}`] 
      });
      queryClient.removeQueries({ 
        queryKey: [`/api/exchange-rate/${variables.toCurrency}/${variables.fromCurrency}`] 
      });
      
      // Remove all exchange rate queries from cache entirely
      queryClient.removeQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.includes('/api/exchange-rate/');
        }
      });
      
      // Force immediate refetch of all exchange rate data
      queryClient.refetchQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.includes('/api/exchange-rate/');
        }
      });
      
      // Also invalidate currency limits since max amounts depend on rates
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.includes('/api/currency-limits/');
        }
      });
      
      // Invalidate balances to ensure all calculations are updated
      queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
      
      // Show detailed preservation confirmation
      const preservedInfo = data.preservedLimits ? 
        `\nPreserved: ${variables.fromCurrency.toUpperCase()} ($${data.preservedLimits.fromCurrency.min}-$${data.preservedLimits.fromCurrency.max}), ${variables.toCurrency.toUpperCase()} ($${data.preservedLimits.toCurrency.min}-$${data.preservedLimits.toCurrency.max})` : 
        '';
      
      toast({
        title: "✓ NEW DATA PERSISTED - Old Data Replaced",
        description: `${variables.fromCurrency.toUpperCase()} → ${variables.toCurrency.toUpperCase()} = ${variables.rate} (NEW DATA KEPT)${preservedInfo}`,
        duration: 6000,
      });
      
      // Keep form data for easy editing - don't clear fields
      // setFromCurrency("");
      // setToCurrency("");
      // setExchangeRate("");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update exchange rate",
        variant: "destructive",
      });
    },
  });



  const handleStatusUpdate = () => {
    // Enhanced validation with specific error messages
    if (!selectedOrderId) {
      toast({
        title: "Validation Error",
        description: "Please select an order from the dropdown",
        variant: "destructive",
      });
      return;
    }
    
    if (!newStatus) {
      toast({
        title: "Validation Error", 
        description: "Please select a new status for the order",
        variant: "destructive",
      });
      return;
    }
    
    updateStatusMutation.mutate({ orderId: selectedOrderId, status: newStatus });
  };

  const handleRateUpdate = () => {
    // Enhanced validation with specific error messages
    if (!fromCurrency) {
      toast({
        title: "Validation Error",
        description: "Please select a 'From' currency",
        variant: "destructive",
      });
      return;
    }
    
    if (!toCurrency) {
      toast({
        title: "Validation Error",
        description: "Please select a 'To' currency",
        variant: "destructive",
      });
      return;
    }
    
    if (!exchangeRate) {
      toast({
        title: "Validation Error",
        description: "Please enter an exchange rate",
        variant: "destructive",
      });
      return;
    }
    
    // Validate exchange rate is a positive number
    const rate = parseFloat(exchangeRate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: "Validation Error",
        description: "Exchange rate must be a positive number greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    if (rate > 10000) {
      toast({
        title: "Validation Error",
        description: "Exchange rate seems too high. Please verify the value",
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
        title: "✓ NEW BALANCE PERSISTED - Old Data Replaced",
        description: `${data.currency.toUpperCase()}: $${data.amount.toLocaleString()} (NEW DATA KEPT)`,
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

  // Admin contact information update mutation
  const updateContactMutation = useMutation({
    mutationFn: async (contactInfo: { email: string; whatsapp: string; telegram: string }) => {
      const response = await apiRequest("POST", "/api/admin/contact-info", contactInfo);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-info"] });
      toast({
        title: "✓ NEW CONTACT INFO PERSISTED - Old Data Replaced",
        description: "Contact information updated successfully (NEW DATA KEPT)",
      });
    },
    onError: (error: any) => {
      console.error('Contact update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update contact information",
        variant: "destructive",
      });
    },
  });

  // Universal limits update mutation
  const updateLimitsMutation = useMutation({
    mutationFn: async ({ min, max }: { min: number; max: number }) => {
      const response = await apiRequest("POST", "/api/admin/universal-limits", { min, max });
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

  const updateUniversalLimits = () => {
    if (universalLimits.min >= universalLimits.max) {
      toast({
        title: "Invalid Range",
        description: "Minimum amount must be less than maximum amount",
        variant: "destructive",
      });
      return;
    }
    updateLimitsMutation.mutate(universalLimits);
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="px-2"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage orders, exchange rates, and transaction limits</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:px-8 lg:py-6">
        {/* Current Exchange Rates Section */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <TrendingUp className="w-5 h-5 mr-2" />
              Current Exchange Rates
            </CardTitle>
            <p className="text-sm text-blue-700">Live rates affecting all transaction calculations</p>
          </CardHeader>
          <CardContent>
            {Array.isArray(allExchangeRates) && allExchangeRates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allExchangeRates.slice(0, 6).map((rate: any, index: number) => (
                  <div key={`current-rate-${rate.id || index}-${rate.fromCurrency}-${rate.toCurrency}`} className="bg-white border border-blue-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm text-gray-800">
                          {rate.fromCurrency.toUpperCase()} → {rate.toCurrency.toUpperCase()}
                        </p>
                        <p className="text-xl font-bold text-blue-900">
                          {parseFloat(rate.rate).toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Updated: {formatDate(rate.updatedAt)}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFromCurrency(rate.fromCurrency);
                            setToCurrency(rate.toCurrency);
                            setExchangeRate(rate.rate);
                            // Automatically switch to rates tab
                            const ratesTab = document.querySelector('[value="rates"]') as HTMLElement;
                            if (ratesTab) ratesTab.click();
                          }}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs"
                        >
                          Quick Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-blue-600">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 text-blue-400" />
                <p className="font-medium">No exchange rates configured</p>
                <p className="text-sm text-blue-500">Configure rates in the Exchange Rates tab</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Exchange Rate Section */}
        <Card className="mb-8 bg-white border-gray-200 shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center text-gray-900 text-2xl">
              <Settings className="w-6 h-6 mr-3" />
              Update Exchange Rate
            </CardTitle>
            <p className="text-gray-600 mt-2">Changes apply immediately to all live calculations</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="main-from-currency" className="text-base font-medium text-gray-700 mb-3 block">From Currency</Label>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="h-12 text-base">
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
                <Label htmlFor="main-to-currency" className="text-base font-medium text-gray-700 mb-3 block">To Currency</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="h-12 text-base">
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
                <Label htmlFor="main-rate" className="text-base font-medium text-gray-700 mb-3 block">Exchange Rate</Label>
                <Input
                  id="main-rate"
                  type="number"
                  step="0.000001"
                  placeholder="0.000000"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              
              <Button 
                onClick={handleRateUpdate} 
                disabled={updateRateMutation.isPending || !fromCurrency || !toCurrency || !exchangeRate}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
              >
                {updateRateMutation.isPending ? "Updating..." : "Update Rate"}
              </Button>
            </div>
            
            {fromCurrency && toCurrency && exchangeRate && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-800">
                  <strong>Preview:</strong> 1 {fromCurrency.toUpperCase()} = {exchangeRate} {toCurrency.toUpperCase()}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This rate will immediately affect all live calculations and new transactions
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="orders" className="space-y-4 lg:space-y-6">
          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-white rounded-lg shadow-lg border p-3 mb-4">
              <TabsList className="grid grid-cols-2 gap-2 h-auto bg-transparent">
                <TabsTrigger 
                  value="orders" 
                  className="flex flex-col items-center justify-center h-14 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Clock className="w-4 h-4 mb-1" />
                  Orders
                </TabsTrigger>
                <TabsTrigger 
                  value="transactions" 
                  className="flex flex-col items-center justify-center h-14 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <History className="w-4 h-4 mb-1" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger 
                  value="rates" 
                  className="flex flex-col items-center justify-center h-14 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <TrendingUp className="w-4 h-4 mb-1" />
                  Rates
                </TabsTrigger>
                <TabsTrigger 
                  value="limits" 
                  className="flex flex-col items-center justify-center h-14 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <DollarSign className="w-4 h-4 mb-1" />
                  Balance
                </TabsTrigger>
                <TabsTrigger 
                  value="wallets" 
                  className="flex flex-col items-center justify-center h-14 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 mb-1" />
                  Wallets
                </TabsTrigger>
                <TabsTrigger 
                  value="contact" 
                  className="flex flex-col items-center justify-center h-14 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MessageSquare className="w-4 h-4 mb-1" />
                  Contact
                </TabsTrigger>
                <TabsTrigger 
                  value="messages" 
                  className="flex flex-col items-center justify-center h-14 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Users className="w-4 h-4 mb-1" />
                  Messages
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex flex-col items-center justify-center h-14 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <TrendingUp className="w-4 h-4 mb-1" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <TabsList className="grid w-full grid-cols-8 h-11">
              <TabsTrigger value="orders" className="text-sm">Orders</TabsTrigger>
              <TabsTrigger value="transactions" className="text-sm">Transactions</TabsTrigger>
              <TabsTrigger value="rates" className="text-sm">Exchange Rates</TabsTrigger>
              <TabsTrigger value="limits" className="text-sm">Balance Management</TabsTrigger>
              <TabsTrigger value="wallets" className="text-sm">Wallet Settings</TabsTrigger>
              <TabsTrigger value="contact" className="text-sm">Contact Info</TabsTrigger>
              <TabsTrigger value="messages" className="text-sm">Messages</TabsTrigger>
              <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
            </TabsList>
          </div>

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
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-gray-600">Loading orders...</span>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
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

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-4">
                      {(() => {
                        const filteredOrders = orders.filter((order) => statusFilter === "all" || order.status === statusFilter);
                        
                        if (filteredOrders.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              {statusFilter === "all" 
                                ? "No orders found" 
                                : `No ${statusFilter} orders found`
                              }
                            </div>
                          );
                        }
                        
                        return filteredOrders.map((order) => (
                          <Card key={order.orderId} className="bg-white border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-sm text-gray-900">{order.orderId}</h3>
                                  <p className="text-sm text-gray-600">{order.fullName}</p>
                                </div>
                                <Badge className={getStatusColor(order.status)}>
                                  <div className="flex items-center">
                                    {getStatusIcon(order.status)}
                                    <span className="ml-1 capitalize text-xs">{order.status}</span>
                                  </div>
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                <div>
                                  <p className="text-gray-500">Send</p>
                                  <p className="font-medium">{formatCurrency(order.sendAmount, order.sendMethod)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Receive</p>
                                  <p className="font-medium">{formatCurrency(order.receiveAmount, order.receiveMethod)}</p>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500 mb-3">
                                {formatDate(order.createdAt)}
                              </div>
                              
                              <div className="flex space-x-2">
                                {order.status === "pending" || order.status === "paid" ? (
                                  <>
                                    {/* Mobile Accept Dialog */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          disabled={acceptOrderMutation.isPending}
                                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Accept
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="mx-4">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Accept Order</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Accept order {order.orderId}? This will mark as completed and cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="mt-3 p-3 bg-gray-50 rounded">
                                          <p><strong>Customer:</strong> {order.fullName}</p>
                                          <p><strong>Amount:</strong> {formatCurrency(order.sendAmount, order.sendMethod)} → {formatCurrency(order.receiveAmount, order.receiveMethod)}</p>
                                        </div>
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

                                    {/* Mobile Cancel Dialog */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          disabled={cancelOrderMutation.isPending}
                                          className="flex-1"
                                        >
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Cancel
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="mx-4">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Cancel order {order.orderId}? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="mt-3 p-3 bg-gray-50 rounded">
                                          <p><strong>Customer:</strong> {order.fullName}</p>
                                          <p><strong>Amount:</strong> {formatCurrency(order.sendAmount, order.sendMethod)} → {formatCurrency(order.receiveAmount, order.receiveMethod)}</p>
                                        </div>
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
                                  <div className="text-center text-gray-500 text-sm py-2 flex-1">
                                    No actions available
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ));
                      })()}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Log - Wallet Balance Workflow */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Transaction Log - Wallet Balance Workflow
                </CardTitle>
                <p className="text-sm text-gray-600">Monitor HOLD, RELEASE, and PAYOUT transactions for order status changes</p>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <p>Loading transactions...</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>From Wallet</TableHead>
                            <TableHead>To Wallet</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-mono text-sm">
                                {transaction.orderId}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    transaction.type === 'HOLD' ? 'secondary' :
                                    transaction.type === 'RELEASE' ? 'outline' :
                                    transaction.type === 'PAYOUT' ? 'default' : 'destructive'
                                  }
                                  className={
                                    transaction.type === 'HOLD' ? 'bg-yellow-100 text-yellow-800' :
                                    transaction.type === 'RELEASE' ? 'bg-orange-100 text-orange-800' :
                                    transaction.type === 'PAYOUT' ? 'bg-green-100 text-green-800' : ''
                                  }
                                >
                                  {transaction.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(transaction.amount, transaction.currency)}
                              </TableCell>
                              <TableCell>
                                <span className={
                                  transaction.fromWallet === 'exchange_wallet' ? 'text-blue-600' :
                                  transaction.fromWallet === 'hold' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }>
                                  {transaction.fromWallet.replace('_', ' ').toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={
                                  transaction.toWallet === 'exchange_wallet' ? 'text-blue-600' :
                                  transaction.toWallet === 'customer_wallet' ? 'text-green-600' :
                                  transaction.toWallet === 'hold' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }>
                                  {transaction.toWallet.replace('_', ' ').toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                                {transaction.description}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {formatDate(transaction.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No transactions yet</p>
                        <p className="text-sm">Transactions will appear here when orders change status</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">HOLD Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {transactions.filter(t => t.type === 'HOLD').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                      <XCircle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">RELEASE Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {transactions.filter(t => t.type === 'RELEASE').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">PAYOUT Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {transactions.filter(t => t.type === 'PAYOUT').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Exchange Rates Management */}
          <TabsContent value="rates" className="space-y-6">
            {/* Current Exchange Rates Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Current Exchange Rates
                </CardTitle>
                <p className="text-sm text-gray-600">Live rates affecting all transaction calculations</p>
              </CardHeader>
              <CardContent>
                {Array.isArray(allExchangeRates) && allExchangeRates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allExchangeRates.map((rate: any) => (
                      <div key={`${rate.fromCurrency}-${rate.toCurrency}`} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-sm">
                              {rate.fromCurrency.toUpperCase()} → {rate.toCurrency.toUpperCase()}
                            </p>
                            <p className="text-lg font-bold text-blue-900">
                              {parseFloat(rate.rate).toFixed(6)}
                            </p>
                            <p className="text-xs text-gray-600">
                              Updated: {new Date(rate.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFromCurrency(rate.fromCurrency);
                              setToCurrency(rate.toCurrency);
                              setExchangeRate(rate.rate);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No exchange rates configured</p>
                    <p className="text-sm">Use the form below to set your first rate</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rate Update Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Update Exchange Rate
                </CardTitle>
                <p className="text-sm text-gray-600">Changes apply immediately to all live calculations</p>
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
                
                {fromCurrency && toCurrency && exchangeRate && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>Preview:</strong> 1 {fromCurrency.toUpperCase()} = {exchangeRate} {toCurrency.toUpperCase()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      This rate will immediately affect max amount calculations and all new transactions
                    </p>
                  </div>
                )}
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
                          {/* Available Balance */}
                          <div>
                            <Label htmlFor={`balance-${method.value}`}>Available Balance ($)</Label>
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
                                      // Force immediate cache removal for instant updates
                                      queryClient.removeQueries({ queryKey: ["/api/admin/balances"] });
                                      queryClient.refetchQueries({ queryKey: ["/api/admin/balances"] });
                                      
                                      setRecentlyUpdatedBalance(method.value);
                                      setTimeout(() => setRecentlyUpdatedBalance(''), 3000);
                                      
                                      toast({
                                        title: "✓ NEW BALANCE PERSISTED - Old Data Replaced",
                                        description: `${method.label}: $${balance.toLocaleString()} (NEW DATA KEPT, affects limits immediately)`,
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
                          
                          {/* Minimum Amount Override */}
                          <div>
                            <Label htmlFor={`min-${method.value}`}>Minimum Amount Override ($)</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id={`min-${method.value}`}
                                type="number"
                                value={currencyMinimums[method.value] || 5}
                                onChange={(e) => setCurrencyMinimums(prev => ({
                                  ...prev,
                                  [method.value]: parseFloat(e.target.value) || 5
                                }))}
                                placeholder="5.00"
                                min="0"
                                step="0.01"
                                className="flex-1"
                              />
                              <Button
                                onClick={async () => {
                                  const minAmount = currencyMinimums[method.value];
                                  
                                  // Enhanced validation
                                  if (!minAmount || minAmount <= 0) {
                                    toast({
                                      title: "Validation Error",
                                      description: "Minimum amount must be greater than 0",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  if (minAmount > 1000) {
                                    toast({
                                      title: "Validation Warning",
                                      description: "Minimum amount seems high. Please verify the value",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  try {
                                    // Use the new coordinated endpoint that preserves exchange rates
                                    const response = await apiRequest("POST", `/api/admin/currency-limits/${method.value}`, {
                                      minAmount: minAmount,
                                      maxAmount: 10000 // Keep standard maximum
                                    });
                                    
                                    if (response.ok) {
                                      // Force immediate cache removal for instant updates
                                      queryClient.removeQueries({ 
                                        predicate: (query) => {
                                          const key = query.queryKey[0];
                                          return typeof key === 'string' && (
                                            key.includes('/api/currency-limits/') ||
                                            key.includes('/api/exchange-rate/')
                                          );
                                        }
                                      });
                                      
                                      // Force complete cache reset for exchange form updates
                                      queryClient.clear();
                                      
                                      // Force immediate refetch of all currency limits
                                      setTimeout(() => {
                                        queryClient.invalidateQueries();
                                      }, 100);
                                      
                                      toast({
                                        title: "Minimum Updated with Rate Coordination",
                                        description: `${method.label} minimum: $${minAmount} (exchange rates preserved)`,
                                        duration: 4000,
                                      });
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "Update Failed",
                                      description: "Failed to update minimum amount",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                size="sm"
                                variant="outline"
                              >
                                Set Min
                              </Button>
                            </div>
                          </div>

                          {/* Maximum Amount Override */}
                          <div>
                            <Label htmlFor={`max-${method.value}`}>Maximum Amount Override ($)</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id={`max-${method.value}`}
                                type="number"
                                value={currencyMaximums[method.value]}
                                onChange={(e) => setCurrencyMaximums(prev => ({
                                  ...prev,
                                  [method.value]: parseFloat(e.target.value)
                                }))}
                                placeholder="50000.00"
                                min="0"
                                step="0.01"
                                className="flex-1"
                              />
                              <Button
                                onClick={async () => {
                                  const maxAmount = currencyMaximums[method.value];
                                  const minAmount = currencyMinimums[method.value];
                                  
                                  // Enhanced validation for maximum amounts
                                  if (!maxAmount || maxAmount <= 0) {
                                    toast({
                                      title: "Validation Error",
                                      description: "Maximum amount must be greater than 0",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  if (maxAmount < minAmount) {
                                    toast({
                                      title: "Validation Error",
                                      description: `Maximum amount ($${maxAmount}) cannot be less than minimum amount ($${minAmount})`,
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  if (maxAmount > 1000000) {
                                    toast({
                                      title: "Validation Warning",
                                      description: "Maximum amount seems very high. Please verify the value",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  try {
                                    // Use the new coordinated endpoint that preserves exchange rates
                                    const response = await apiRequest("POST", `/api/admin/currency-limits/${method.value}`, {
                                      minAmount: currencyMinimums[method.value], // Use admin-configured minimum
                                      maxAmount: maxAmount
                                    });
                                    
                                    if (response.ok) {
                                      // Force immediate cache removal for instant updates
                                      queryClient.removeQueries({ 
                                        predicate: (query) => {
                                          const key = query.queryKey[0];
                                          return typeof key === 'string' && (
                                            key.includes('/api/currency-limits/') ||
                                            key.includes('/api/exchange-rate/')
                                          );
                                        }
                                      });
                                      
                                      toast({
                                        title: "Maximum Updated with Rate Coordination",
                                        description: `${method.label} maximum: $${maxAmount.toLocaleString()} (protects exchange rates)`,
                                        duration: 4000,
                                      });
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "Update Failed",
                                      description: "Failed to update maximum amount",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                size="sm"
                                variant="outline"
                              >
                                Set Max
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <p><strong>Balance:</strong> Controls maximum outgoing amounts</p>
                            <p><strong>Limits:</strong> Override balance calculations when needed</p>
                            <p><strong>Exchange Rate Protection:</strong> All limits respect current rates</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction Limits Management */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Universal Transaction Limits</h3>
                  <p className="text-blue-700 mb-6">Configure minimum and maximum order amounts for all payment methods</p>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="universal-min">Minimum Order Amount ($)</Label>
                        <Input
                          id="universal-min"
                          type="number"
                          value={universalLimits.min}
                          onChange={(e) => setUniversalLimits(prev => ({
                            ...prev,
                            min: parseFloat(e.target.value) || 0
                          }))}
                          placeholder="5"
                          min="1"
                          step="0.01"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="universal-max">Maximum Order Amount ($)</Label>
                        <Input
                          id="universal-max"
                          type="number"
                          value={universalLimits.max}
                          onChange={(e) => setUniversalLimits(prev => ({
                            ...prev,
                            max: parseFloat(e.target.value) || 0
                          }))}
                          placeholder="10000"
                          min="1"
                          step="0.01"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Current Range: <span className="font-semibold">${universalLimits.min} - ${universalLimits.max.toLocaleString()}</span>
                      </div>
                      <Button 
                        onClick={updateUniversalLimits}
                        disabled={updateLimitsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {updateLimitsMutation.isPending ? "Updating..." : "Update Limits"}
                      </Button>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">
                        <strong>Applies to:</strong> {paymentMethods.map(m => m.label).join(', ')}
                      </p>
                    </div>
                  </div>
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

          {/* Contact Information Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Admin Contact Information
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Manage your business contact details for customer support
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Email Configuration */}
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-sm font-semibold flex items-center gap-2">
                      Email Address
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminContact.email}
                      onChange={(e) => setAdminContact(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your-email@example.com"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Primary email for customer inquiries and notifications
                    </p>
                  </div>

                  {/* WhatsApp Configuration */}
                  <div className="space-y-2">
                    <Label htmlFor="admin-whatsapp" className="text-sm font-semibold flex items-center gap-2">
                      WhatsApp Number
                    </Label>
                    <Input
                      id="admin-whatsapp"
                      type="text"
                      value={adminContact.whatsapp}
                      onChange={(e) => setAdminContact(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="252611681818"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      WhatsApp number for instant customer support
                    </p>
                  </div>

                  {/* Telegram Configuration */}
                  <div className="space-y-2">
                    <Label htmlFor="admin-telegram" className="text-sm font-semibold flex items-center gap-2">
                      Telegram Username
                    </Label>
                    <Input
                      id="admin-telegram"
                      type="text"
                      value={adminContact.telegram}
                      onChange={(e) => setAdminContact(prev => ({ ...prev, telegram: e.target.value }))}
                      placeholder="@doogle143"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Telegram username for secure communications
                    </p>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => updateContactMutation.mutate(adminContact)}
                    disabled={updateContactMutation.isPending}
                    className="px-6"
                  >
                    {updateContactMutation.isPending ? "Updating..." : "Update Contact Information"}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Leave fields empty to hide that contact method on the Contact page
                  </p>
                </div>

                {/* Current Contact Overview */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Current Contact Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-semibold text-gray-800 mb-2">Email Support</h4>
                        <p className="text-sm text-gray-600 break-all">{adminContact.email}</p>
                        <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                          Primary Contact
                        </Badge>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-semibold text-gray-800 mb-2">WhatsApp</h4>
                        <p className="text-sm text-gray-600 font-mono">{adminContact.whatsapp}</p>
                        <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                          Instant Messaging
                        </Badge>
                      </div>
                      <div className="p-4 bg-white rounded-lg border">
                        <h4 className="font-semibold text-gray-800 mb-2">Telegram</h4>
                        <p className="text-sm text-gray-600 font-mono">{adminContact.telegram}</p>
                        <Badge variant="outline" className="mt-2 bg-purple-50 text-purple-700 border-purple-200">
                          Secure Chat
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Guidelines */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Management Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">Best Practices</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Use business email addresses for professional communication</li>
                          <li>• Keep WhatsApp number active for instant support</li>
                          <li>• Verify Telegram username is correct and accessible</li>
                          <li>• Update contact info immediately if any details change</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">Customer Experience</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>• Customers see these details on exchange forms</li>
                          <li>• Contact information appears in email notifications</li>
                          <li>• Multiple channels provide support flexibility</li>
                          <li>• Clear contact options build customer trust</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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