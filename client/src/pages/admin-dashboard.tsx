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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
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
  XCircle,
  CheckCircle,
  Clock3,
  AlertCircle,
  UserCheck,
  Send,
  Bell,
  X,
} from "lucide-react";
import type { Order, ContactMessage, Transaction } from "@shared/schema";

// Schema for message response form
const responseSchema = z.object({
  response: z.string().min(5, "Response must be at least 5 characters"),
});

type ResponseFormData = z.infer<typeof responseSchema>;

// Component for message response card
function MessageResponseCard({ message, onResponseSent }: { message: ContactMessage; onResponseSent: () => void }) {
  const { toast } = useToast();
  const [isResponding, setIsResponding] = useState(false);
  
  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: "",
    },
  });

  const responseMutation = useMutation({
    mutationFn: async (data: ResponseFormData) => {
      return await apiRequest("PATCH", `/api/contact/${message.id}/response`, data);
    },
    onSuccess: () => {
      toast({
        title: "Response sent successfully",
        description: "Customer will see your response on the contact page",
      });
      form.reset();
      setIsResponding(false);
      onResponseSent();
    },
    onError: () => {
      toast({
        title: "Failed to send response",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResponseFormData) => {
    responseMutation.mutate(data);
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold">{message.name}</h4>
            <p className="text-sm text-gray-600">{message.email}</p>
          </div>
          <Badge variant="outline">{message.subject}</Badge>
        </div>
        <p className="text-gray-700 mb-2">{message.message}</p>
        <p className="text-xs text-gray-500 mb-3">{message.createdAt ? formatDate(message.createdAt) : 'Recently'}</p>
        
        {/* Admin Response Section */}
        {message.adminResponse ? (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center mb-2">
              <UserCheck className="w-4 h-4 text-green-600 mr-2" />
              <span className="font-medium text-green-800">Your Response</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-gray-700">{message.adminResponse}</p>
              {message.responseDate && (
                <p className="text-xs text-green-600 mt-2">
                  Sent on {message.responseDate ? formatDate(message.responseDate) : 'Recently'}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {!isResponding ? (
              <Button 
                onClick={() => setIsResponding(true)}
                size="sm"
                className="flex items-center"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Response
              </Button>
            ) : (
              <div className="space-y-3">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <FormField
                      control={form.control}
                      name="response"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Response</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type your response to the customer..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={responseMutation.isPending}
                      >
                        {responseMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Response
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setIsResponding(false);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
  
  // Check admin authentication
  useEffect(() => {
    const adminToken = sessionStorage.getItem("adminToken");
    if (!adminToken) {
      toast({
        title: "Access Denied",
        description: "Please log in as admin to access this page",
        variant: "destructive",
      });
      setLocation("/admin/login");
      return;
    }
    
    // Verify admin session with backend
    fetch("/api/admin/check-auth", {
      credentials: "include"
    })
      .then(response => response.json())
      .then(data => {
        if (!data.authenticated) {
          sessionStorage.removeItem("adminToken");
          toast({
            title: "Session Expired",
            description: "Please log in again",
            variant: "destructive",
          });
          setLocation("/admin/login");
        }
      })
      .catch(() => {
        sessionStorage.removeItem("adminToken");
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
        setLocation("/admin/login");
      });
  }, [toast, setLocation]);
  
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
        credentials: "include",
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
        credentials: "include",
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
  
  // Enhanced wallet data fetching with better error handling
  const { data: walletData, error: walletError, isLoading: walletLoading } = useQuery({
    queryKey: ["/api/admin/wallet-addresses"],
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Enhanced wallet data processing
  useEffect(() => {
    if (walletError) {
      console.error('❌ Wallet data fetch error:', walletError);
      toast({
        title: "Wallet Data Error",
        description: "Failed to load wallet addresses. Please refresh the page.",
        variant: "destructive",
      });
    }
    
    if (walletData && typeof walletData === 'object') {
      console.log('✅ Wallet data loaded:', walletData);
      setWalletAddresses(walletData as Record<string, string>);
    }
  }, [walletData, walletError]);

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

  // WebSocket connection for real-time order updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Admin dashboard WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle order updates (including customer cancellations)
        if (message.type === 'order_update') {
          console.log('Admin dashboard received order update:', message.data);
          
          // Show toast notification for customer cancellations
          if (message.data.status === 'cancelled') {
            toast({
              title: "Order Cancelled by Customer",
              description: `Order ${message.data.orderId} has been cancelled by the customer`,
              variant: "destructive",
            });
          }
          
          // Force complete refresh of orders list with cache clearing
          queryClient.removeQueries({ queryKey: ['/api/orders'] });
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          queryClient.refetchQueries({ queryKey: ['/api/orders'] });
        }
        
        // Handle new orders
        if (message.type === 'new_order') {
          console.log('Admin dashboard received new order:', message.data);
          
          // Refresh orders list to show new order
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          queryClient.refetchQueries({ queryKey: ['/api/orders'] });
        }
      } catch (error) {
        console.error('Error parsing admin WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Admin dashboard WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);



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

  const handleRateUpdate = async () => {
    if (!fromCurrency || !toCurrency || !exchangeRate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate exchange rate value
    const rateValue = parseFloat(exchangeRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({
        title: "Error",
        description: "Exchange rate must be a positive number",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation that min/max limits will be preserved
    toast({
      title: "Updating Exchange Rate",
      description: `Setting ${fromCurrency.toUpperCase()} → ${toCurrency.toUpperCase()} = ${exchangeRate}. All minimum and maximum limits will be preserved.`,
    });

    updateRateMutation.mutate({ fromCurrency, toCurrency, rate: exchangeRate });
  };

  // Enhanced wallet update mutation
  const updateWalletMutation = useMutation({
    mutationFn: async ({ method, address }: { method: string; address: string }) => {
      console.log('🔧 Sending wallet update request:', { method, address });
      const response = await apiRequest('POST', '/api/admin/wallet-addresses', { method, address });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Wallet update response:', data);
      return data;
    },
    onSuccess: (data: any, variables: { method: string; address: string }) => {
      console.log('✅ Wallet update successful:', data, variables);
      
      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wallet-addresses'] });
      
      // Update timestamp
      setLastUpdated(data?.lastUpdated || new Date().toISOString());
      
      // Set recently updated for visual feedback
      setRecentlyUpdated(variables.method);
      setTimeout(() => setRecentlyUpdated(''), 3000);
      
      // Update local state immediately for responsive UI
      setWalletAddresses(prev => ({
        ...prev,
        [variables.method]: variables.address
      }));
      
      // Show success notification
      toast({
        title: "✓ Wallet Updated Successfully",
        description: `${variables.method.toUpperCase()}: ${variables.address.substring(0, 20)}${variables.address.length > 20 ? '...' : ''}`,
        duration: 4000,
      });
    },
    onError: (error: any) => {
      console.error('❌ Wallet update failed:', error);
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



  // Filter orders with precise Order ID matching (hide cancelled orders by default)
  const filteredOrders = orders.filter(order => {
    // Hide cancelled orders from main dashboard view
    if (order.status === 'cancelled') {
      return false;
    }
    
    // Apply search filter
    let matchesSearch = true;
    if (searchTerm !== "") {
      const searchLower = searchTerm.toLowerCase().trim();
      const orderIdLower = order.orderId.toLowerCase();
      
      // If search looks like an Order ID (contains DGL- pattern), prioritize exact Order ID matches
      if (searchTerm.toUpperCase().includes('DGL-')) {
        matchesSearch = orderIdLower.includes(searchLower);
      } else {
        // Search in all fields for non-Order ID searches
        matchesSearch = orderIdLower.includes(searchLower) ||
                      order.fullName.toLowerCase().includes(searchLower) ||
                      order.phoneNumber.includes(searchTerm);
      }
    }
    
    // Apply status filter
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    // Apply date filter
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
        order.createdAt ? formatDate(order.createdAt) : 'Recently'
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

  // State for manual credit/debit inputs
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
  const [manualReasons, setManualReasons] = useState<Record<string, string>>({});

  const [systemStatus, setSystemStatus] = useState<'on' | 'off'>('on');
  const [loadingStatus, setLoadingStatus] = useState(false);
  
  // Notification system state
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'order' | 'message' | 'system' | 'balance' | 'rate';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
  }>>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Generate notifications based on data
  useEffect(() => {
    const newNotifications: Array<{
      id: string;
      type: 'order' | 'message' | 'system' | 'balance' | 'rate';
      title: string;
      message: string;
      timestamp: Date;
      read: boolean;
      priority: 'low' | 'medium' | 'high';
      actionUrl?: string;
    }> = [];

    // Order notifications
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const processingOrders = orders.filter(order => order.status === 'processing');
    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      return orderDate >= oneHourAgo;
    });

    if (pendingOrders.length > 0) {
      newNotifications.push({
        id: 'pending-orders',
        type: 'order',
        title: 'Pending Orders',
        message: `${pendingOrders.length} orders waiting for payment confirmation`,
        timestamp: new Date(),
        read: false,
        priority: 'high',
        actionUrl: '#orders'
      });
    }

    if (processingOrders.length > 0) {
      newNotifications.push({
        id: 'processing-orders',
        type: 'order',
        title: 'Orders in Progress',
        message: `${processingOrders.length} orders currently being processed`,
        timestamp: new Date(),
        read: false,
        priority: 'medium',
        actionUrl: '#orders'
      });
    }

    if (recentOrders.length > 0) {
      newNotifications.push({
        id: 'recent-activity',
        type: 'order',
        title: 'Recent Activity',
        message: `${recentOrders.length} new orders in the last hour`,
        timestamp: new Date(),
        read: false,
        priority: 'low',
        actionUrl: '#orders'
      });
    }

    // Message notifications
    // Fix 1: Use 'adminResponse' instead of 'response' for unread messages
    const unreadMessages = messages.filter(message => !message.adminResponse);
    const recentMessages = messages.filter(message => {
      const messageDate = new Date(message.createdAt);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return messageDate >= oneDayAgo;
    });

    if (unreadMessages.length > 0) {
      newNotifications.push({
        id: 'unread-messages',
        type: 'message',
        title: 'Unread Messages',
        message: `${unreadMessages.length} customer messages need responses`,
        timestamp: new Date(),
        read: false,
        priority: 'high',
        actionUrl: '#messages'
      });
    }

    if (recentMessages.length > 0) {
      newNotifications.push({
        id: 'recent-messages',
        type: 'message',
        title: 'Recent Messages',
        message: `${recentMessages.length} messages received in the last 24 hours`,
        timestamp: new Date(),
        read: false,
        priority: 'medium',
        actionUrl: '#messages'
      });
    }

    // System notifications
    if (systemStatus === 'off') {
      newNotifications.push({
        id: 'system-closed',
        type: 'system',
        title: 'System Closed',
        message: 'System is currently closed for business',
        timestamp: new Date(),
        read: false,
        priority: 'high'
      });
    }

    // Balance notifications
    const lowBalances = Object.entries(balances).filter(([currency, amount]) => amount < 100);
    if (lowBalances.length > 0) {
      newNotifications.push({
        id: 'low-balances',
        type: 'balance',
        title: 'Low Balances',
        message: `${lowBalances.length} currencies have low balances (< $100)`,
        timestamp: new Date(),
        read: false,
        priority: 'medium',
        actionUrl: '#management'
      });
    }

    setNotifications(newNotifications);
  }, [orders, messages, systemStatus, balances]);

  // Fetch system status on mount
  useEffect(() => {
    console.log('Fetching system status...');
    fetch('/api/admin/system-status', {
      credentials: "include"
    })
      .then(res => {
        console.log('System status response:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('System status data:', data);
        setSystemStatus(data.status);
      })
      .catch(error => {
        console.error('Error fetching system status:', error);
        // Set default to 'on' if there's an error
        setSystemStatus('on');
      });
  }, []);

  const handleToggleSystem = async () => {
    setLoadingStatus(true);
    const newStatus = systemStatus === 'on' ? 'off' : 'on';
    await fetch('/api/admin/system-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
      credentials: "include"
    });
    setSystemStatus(newStatus);
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
    setLoadingStatus(false);
  };

  // Notification helper functions
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-panel') && !target.closest('.notification-bell')) {
        setIsNotificationPanelOpen(false);
      }
    };

    if (isNotificationPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationPanelOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Enhanced Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Manage orders, exchange rates, and transaction limits
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Real-time sync active
              </div>
              
              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  sessionStorage.removeItem("adminToken");
                  fetch("/api/admin/logout", { 
                    method: "POST",
                    credentials: "include"
                  });
                  setLocation("/admin/login");
                  toast({
                    title: "Logged Out",
                    description: "You have been successfully logged out",
                  });
                }}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Logout
              </Button>
              
              {/* Notification Bell */}
              <div className="relative notification-bell">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
                  className="relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>

                {/* Notification Panel */}
                {isNotificationPanelOpen && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 notification-panel">
                    <Card className="border-0 shadow-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Bell className="w-5 h-5 mr-2" />
                            Notifications
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsNotificationPanelOpen(false)}
                            className="h-6 w-6"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-96 overflow-y-auto">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-3 border-l-4 ${getPriorityColor(notification.priority)} ${
                                  notification.read ? 'opacity-60' : ''
                                } hover:bg-gray-50 transition-colors`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      {getPriorityIcon(notification.priority)}
                                      <h4 className="font-medium text-sm">{notification.title}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        {notification.type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                    <p className="text-xs text-gray-500">{formatDate(notification.timestamp)}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {!notification.read && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markNotificationAsRead(notification.id)}
                                        className="h-6 px-2 text-xs"
                                      >
                                        Mark read
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => dismissNotification(notification.id)}
                                      className="h-6 w-6"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Status Control - More Prominent */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">System Status Control</h3>
              <p className="text-sm text-gray-600">Toggle system availability for all users</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Current Status:</div>
                <div className={`font-bold ${systemStatus === 'on' ? 'text-green-600' : 'text-red-600'}`}>
                  {systemStatus === 'on' ? '🟢 OPEN' : '🔴 CLOSED'}
                </div>
              </div>
              <button
                onClick={handleToggleSystem}
                disabled={loadingStatus}
                className={`px-6 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 ${
                  systemStatus === 'on' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } ${loadingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loadingStatus ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  systemStatus === 'on' ? '🔄 Close System' : '🔄 Open System'
                )}
              </button>
            </div>
          </div>
        </div>
        {systemStatus === 'off' && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-6 text-center font-semibold">
            System is currently <b>CLOSED</b> for business. All balances are hidden.
          </div>
        )}

        <Tabs defaultValue="orders" className="space-y-4 sm:space-y-6">
          {/* Main Navigation Tabs - Horizontal Layout */}
          <div className="flex flex-col space-y-4">
            {/* Primary Navigation Row - Management grouped */}
            <div className="flex justify-center">
              <TabsList className="flex w-full max-w-4xl h-auto p-1 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm">
                <TabsTrigger value="orders" className="flex-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white text-sm py-3 px-4 rounded-lg transition-all duration-200 font-medium">
                  Orders
                </TabsTrigger>
                <TabsTrigger value="management" className="flex-1 data-[state=active]:bg-gray-700 data-[state=active]:text-white text-sm py-3 px-4 rounded-lg transition-all duration-200 font-medium">
                  Management
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Secondary Navigation Row - Additional Tabs */}
            <div className="flex justify-center">
              <TabsList className="flex w-full max-w-4xl h-auto p-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 rounded-xl shadow-sm">
                <TabsTrigger value="transactions" className="flex-1 data-[state=active]:bg-green-500 data-[state=active]:text-white text-xs py-2 px-3 rounded-lg transition-all duration-200">
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex-1 data-[state=active]:bg-pink-500 data-[state=active]:text-white text-xs py-2 px-3 rounded-lg transition-all duration-200">
                  Messages
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1 data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-xs py-2 px-3 rounded-lg transition-all duration-200">
                  Analytics
                </TabsTrigger>
                {/* Optionally keep Exchange Rates as a top-level tab if needed */}
                {/* <TabsTrigger value="exchange-rates" className="flex-1 data-[state=active]:bg-red-500 data-[state=active]:text-white text-xs py-2 px-3 rounded-lg transition-all duration-200">
                  Exchange Rates
                </TabsTrigger> */}
              </TabsList>
            </div>
          </div>

          {/* Orders Management */}
          <TabsContent value="orders" className="space-y-4 sm:space-y-6">
            {/* Order Status Update Card */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                    <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Update Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Order ID</Label>
                    <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                      <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl h-11">
                        <SelectValue placeholder="Select order" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-xl">
                        {orders.map((order) => (
                          <SelectItem key={order.orderId} value={order.orderId} className="rounded-lg">
                            <div className="flex flex-col">
                              <span className="font-medium">{order.orderId}</span>
                              <span className="text-xs text-gray-500">{order.fullName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">New Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl h-11">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-xl">
                        <SelectItem value="pending" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Pending
                          </div>
                        </SelectItem>
                        <SelectItem value="processing" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock3 className="w-4 h-4 text-blue-500" />
                            Processing
                          </div>
                        </SelectItem>
                        <SelectItem value="completed" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelled" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            Cancelled
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end sm:col-span-2 lg:col-span-1">
                    <Button 
                      onClick={handleStatusUpdate} 
                      disabled={updateStatusMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-xl h-11 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {updateStatusMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Updating...
                        </div>
                      ) : (
                        "Update Status"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Management Table */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div>
                    <CardTitle className="flex items-center text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      Order Management
                    </CardTitle>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="mb-2">Accept orders to mark as completed or cancel pending/paid orders. Completed and cancelled orders cannot be modified.</p>
                      <Link href="/cancelled">
                        <Button variant="outline" size="sm" className="text-xs">
                          <XCircle className="w-3 h-3 mr-1" />
                          View Cancelled Orders
                        </Button>
                      </Link>
                    </div>
                    {statusFilter !== "all" && (
                      <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                        <Filter className="w-3 h-3" />
                        Showing {statusFilter} orders ({orders.filter(order => order.status === statusFilter).length} found)
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile-responsive controls */}
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
                          className="pl-10 w-full sm:w-48 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl h-10 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filter:</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl h-10">
                          <SelectValue placeholder="All Orders" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-0 shadow-xl">
                          <SelectItem value="all" className="rounded-lg">All Orders</SelectItem>
                          <SelectItem value="pending" className="rounded-lg">Pending</SelectItem>
                          <SelectItem value="paid" className="rounded-lg">Paid</SelectItem>
                          <SelectItem value="processing" className="rounded-lg">Processing</SelectItem>
                          <SelectItem value="completed" className="rounded-lg">Completed</SelectItem>
                          <SelectItem value="cancelled" className="rounded-lg">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
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
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                      <span className="text-gray-600 dark:text-gray-400">Loading orders...</span>
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
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Date</TableHead>
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Use the proper filteredOrders that includes search functionality
                          if (filteredOrders.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                      <Search className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                      {searchTerm ? `No orders found for "${searchTerm}"` : 
                                       statusFilter === "all" ? "No orders found" : `No ${statusFilter} orders found`}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          return filteredOrders.map((order) => (
                            <TableRow key={order.orderId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                              <TableCell className="font-medium text-blue-600 dark:text-blue-400">{order.orderId}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{order.fullName}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{order.phoneNumber}</span>
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
                                <Badge className={getStatusColor(order.status)}>
                                  <div className="flex items-center">
                                    {getStatusIcon(order.status)}
                                    <span className="ml-1 capitalize">{order.status}</span>
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell>{order.createdAt ? formatDate(order.createdAt) : 'Recently'}</TableCell>
                              <TableCell>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  {order.status === "pending" || order.status === "paid" ? (
                                    <>
                                      {/* Regular Accept Order Button */}
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            disabled={acceptOrderMutation.isPending}
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs"
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
                                                <p><strong>Phone:</strong> {order.phoneNumber}</p>
                                                <p><strong>Sender Account:</strong> {order.senderAccount || 'Not provided'}</p>
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

                                      {/* Duplicate Accept Deposit Button - Only shows when customer makes deposit */}
                                      {order.status === "paid" && (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              size="sm"
                                              disabled={acceptOrderMutation.isPending}
                                              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs"
                                            >
                                              <CheckCircle className="w-3 h-3 mr-1" />
                                              Accept Deposit
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Accept Deposit Confirmation</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Customer has made a deposit for order {order.orderId}. Confirm to complete the order.
                                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                                  <div className="flex items-center mb-2">
                                                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                                                    <span className="font-medium text-blue-800">Deposit Received</span>
                                                  </div>
                                                  <p><strong>Customer:</strong> {order.fullName}</p>
                                                  <p><strong>Phone:</strong> {order.phoneNumber}</p>
                                                  <p><strong>Sender Account:</strong> {order.senderAccount || 'Not provided'}</p>
                                                  <p><strong>Deposit Amount:</strong> {formatCurrency(order.sendAmount, order.sendMethod)}</p>
                                                  <p><strong>To Send:</strong> {formatCurrency(order.receiveAmount, order.receiveMethod)}</p>
                                                </div>
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => acceptOrderMutation.mutate(order.orderId)}
                                                className="bg-blue-600 hover:bg-blue-700"
                                              >
                                                Accept Deposit & Complete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}

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
                                                <p><strong>Phone:</strong> {order.phoneNumber}</p>
                                                <p><strong>Sender Account:</strong> {order.senderAccount || 'Not provided'}</p>
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

          {/* Management Section with Sub-Tabs */}
            <TabsContent value="management" className="space-y-6">
              <Tabs defaultValue="rates" className="space-y-4">
                <TabsList className="flex w-full max-w-2xl mx-auto h-auto p-1 bg-gray-100 dark:bg-gray-800/70 border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm mb-6">
                  <TabsTrigger value="rates" className="flex-1 data-[state=active]:bg-purple-500 data-[state=active]:text-white text-sm py-2 px-4 rounded-lg transition-all duration-200 font-medium">
                    Rates
                  </TabsTrigger>
                  <TabsTrigger value="limits" className="flex-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-sm py-2 px-4 rounded-lg transition-all duration-200 font-medium">
                    Balance
                  </TabsTrigger>
                  <TabsTrigger value="wallets" className="flex-1 data-[state=active]:bg-teal-500 data-[state=active]:text-white text-sm py-2 px-4 rounded-lg transition-all duration-200 font-medium">
                    Wallets
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex-1 data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-sm py-2 px-4 rounded-lg transition-all duration-200 font-medium">
                    Contact
                  </TabsTrigger>
                </TabsList>
                {/* Sub-tab contents (moved from main TabsContent) */}
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
                          {paymentMethods.map((method) => {
                            const displayBalance = systemStatus === 'off' ? 0 : balances[method.value.toUpperCase()] || 0;
                            return (
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
                                        value={displayBalance}
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
                                            const balance = displayBalance;
                                            const response = await apiRequest("POST", "/api/admin/balances", {
                                              currency: method.value,
                                              amount: balance,
                                            });
                                            
                                            if (response.ok) {
                                              // Force complete cache invalidation for instant synchronization
                                              queryClient.removeQueries({ 
                                                predicate: (query) => {
                                                  const key = query.queryKey[0];
                                                  return typeof key === 'string' && (
                                                    key.includes('/api/admin/balances') ||
                                                    key.includes('/api/currency-limits/') ||
                                                    key.includes('/api/exchange-rate/')
                                                  );
                                                }
                                              });
                                              
                                              // Force complete cache reset for exchange form updates
                                              queryClient.clear();
                                              
                                              // Force immediate refetch of all balance-related data
                                              setTimeout(() => {
                                                queryClient.invalidateQueries();
                                              }, 100);
                                              
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
                                  {/* Manual Credit/Debit Controls */}
                                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex flex-col sm:flex-row gap-2 items-end">
                                      <div className="flex-1">
                                        <Label htmlFor={`manual-amount-${method.value}`}>Manual Adjustment Amount</Label>
                                        <Input
                                          id={`manual-amount-${method.value}`}
                                          type="number"
                                          min="0.01"
                                          step="0.01"
                                          placeholder="0.00"
                                          value={manualAmounts?.[method.value] || ''}
                                          onChange={e => setManualAmounts(prev => ({ ...prev, [method.value]: e.target.value }))}
                                          className="mb-2"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <Label htmlFor={`manual-reason-${method.value}`}>Reason (optional)</Label>
                                        <Input
                                          id={`manual-reason-${method.value}`}
                                          type="text"
                                          placeholder="Reason for adjustment"
                                          value={manualReasons?.[method.value] || ''}
                                          onChange={e => setManualReasons(prev => ({ ...prev, [method.value]: e.target.value }))}
                                        />
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                                        onClick={async () => {
                                          const amt = parseFloat(manualAmounts?.[method.value] || '0');
                                          if (!amt || amt <= 0) {
                                            toast({ title: 'Enter a valid amount', variant: 'destructive' });
                                            return;
                                          }
                                          try {
                                            const res = await apiRequest('POST', '/api/admin/balances/credit', {
                                              currency: method.value,
                                              amount: amt,
                                              reason: manualReasons?.[method.value] || undefined,
                                            });
                                            if (res.ok) {
                                              await queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
                                              const updated = await res.json();
                                              toast({ title: `Credited $${amt} to ${method.label}. New balance: $${updated.balance?.amount}` });
                                              setManualAmounts(prev => ({ ...prev, [method.value]: '' }));
                                              setManualReasons(prev => ({ ...prev, [method.value]: '' }));
                                            } else {
                                              throw new Error('Failed to credit balance');
                                            }
                                          } catch (err) {
                                            toast({ title: 'Credit failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
                                          }
                                        }}
                                      >
                                        Credit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                                        onClick={async () => {
                                          const amt = parseFloat(manualAmounts?.[method.value] || '0');
                                          if (!amt || amt <= 0) {
                                            toast({ title: 'Enter a valid amount', variant: 'destructive' });
                                            return;
                                          }
                                          try {
                                            const res = await apiRequest('POST', '/api/admin/balances/debit', {
                                              currency: method.value,
                                              amount: amt,
                                              reason: manualReasons?.[method.value] || undefined,
                                            });
                                            if (res.ok) {
                                              await queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
                                              const updated = await res.json();
                                              toast({ title: `Debited $${amt} from ${method.label}. New balance: $${updated.balance?.amount}` });
                                              setManualAmounts(prev => ({ ...prev, [method.value]: '' }));
                                              setManualReasons(prev => ({ ...prev, [method.value]: '' }));
                                            } else {
                                              throw new Error('Failed to debit balance');
                                            }
                                          } catch (err) {
                                            toast({ title: 'Debit failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
                                          }
                                        }}
                                      >
                                        Debit
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
                                          try {
                                            const minAmount = currencyMinimums[method.value];
                                            
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
                                          try {
                                            const maxAmount = Math.min(currencyMaximums[method.value] || 10000, 10000); // Enforce $10,000 maximum
                                            
                                            // Use the new $10,000 enforcement endpoint that preserves exchange rates
                                            const response = await apiRequest("POST", `/api/admin/currency-limits/${method.value}`, {
                                              minAmount: currencyMinimums[method.value] || 5,
                                              maxAmount: maxAmount
                                            });
                                            
                                            if (response.ok) {
                                              const result = await response.json();
                                              
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
                                              
                                              // Update local state to reflect the enforced maximum
                                              setCurrencyMaximums(prev => ({
                                                ...prev,
                                                [method.value]: result.maxAmount || 10000
                                              }));
                                              
                                              toast({
                                                title: "Maximum Updated - $10,000 Enforced",
                                                description: `${method.label}: $${(result.maxAmount || 10000).toLocaleString()} (exchange rates preserved)`,
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
                                        Set Max ($10K)
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
                            );
                          })}
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
              </Tabs>
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
                      <MessageResponseCard 
                        key={message.id} 
                        message={message} 
                        onResponseSent={() => {
                          queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
                        }} 
                      />
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

          {/* Exchange Rates Tab */}
          <TabsContent value="exchange-rates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Exchange Rate Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Advanced exchange rate management with history tracking
                  </p>
                  <Link href="/admin-exchange-rates">
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                      <History className="w-4 h-4 mr-2" />
                      Open Exchange Rate Manager
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}