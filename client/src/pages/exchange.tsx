import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowUpCircle, ArrowDownCircle, Send, Bell, BellOff } from "lucide-react";
import { useFormDataMemory } from "@/hooks/use-form-data-memory";
import { formatAmount } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";

interface ExchangeRateResponse {
  rate: number;
  from: string;
  to: string;
}

interface CurrencyLimitsResponse {
  minAmount: number;
  maxAmount: number;
  currency: string;
}

// Import currency logos
import zaadLogo from "@assets/zaad_1749853582330.png";
import evcLogo from "@assets/evc plus_1749853582322.png";
import edahabLogo from "@assets/edahab_1749853582320.png";
import golisLogo from "@assets/golis_1749853582323.png";
import premierLogo from "@assets/premier bank_1749853582326.png";
import trc20Logo from "@assets/trc20_1749853582327.png";
import peb20Logo from "@assets/peb20_1749853582325.png";
import trxLogo from "@assets/trx_1749853582329.png";
import moneygoLogo from "@assets/__moneygo_1_1749853748726.png";

const paymentMethods = [
  { value: "zaad", label: "Zaad", logo: zaadLogo },
  { value: "sahal", label: "Sahal", logo: golisLogo },
  { value: "evc", label: "EVC Plus", logo: evcLogo },
  { value: "edahab", label: "eDahab", logo: edahabLogo },
  { value: "premier", label: "Premier Bank", logo: premierLogo },
  { value: "moneygo", label: "MoneyGo", logo: moneygoLogo },
  { value: "trc20", label: "TRC20 (USDT)", logo: trc20Logo },
  { value: "peb20", label: "PEB20", logo: peb20Logo },
  { value: "trx", label: "TRX", logo: trxLogo },
  { value: "usdc", label: "USDC", logo: trc20Logo }
];

const specialExclusions: Record<string, string[]> = {
  sahal: ['sahal', 'evc'], // 'evc' is the value for EVC Plus
  evc: ['evc', 'sahal', 'zaad'],
  zaad: ['zaad', 'evc', 'sahal'],
};

const createExchangeFormSchema = (
  minSendAmount: number = 5,
  maxSendAmount: number = 10000,
  minReceiveAmount: number = 5,
  maxReceiveAmount: number = 10000,
  sendMethod: string = ""
) => z.object({
  sendMethod: z.string().min(1, "Please select a send method"),
  receiveMethod: z.string().min(1, "Please select a receive method"),
  sendAmount: z.string().refine(
    (val) => {
      if (!val || val === "") return false;
      const amount = parseFloat(val);
      return !isNaN(amount) && amount >= minSendAmount && amount <= maxSendAmount;
    },
    (val) => {
      if (!val || val === "") return { message: "Amount is required" };
      const amount = parseFloat(val);
      if (isNaN(amount)) return { message: "Please enter a valid number" };
      if (amount < minSendAmount) return { message: `Minimum send amount: $${minSendAmount.toFixed(2)}` };
      if (amount > maxSendAmount) return { message: `Maximum send amount: $${maxSendAmount.toLocaleString()}` };
      return { message: "Invalid amount" };
    }
  ),
  receiveAmount: z.string().refine(
    (val) => {
      if (!val || val === "") return false;
      const amount = parseFloat(val);
      return !isNaN(amount) && amount >= minReceiveAmount && amount <= maxReceiveAmount;
    },
    (val) => {
      if (!val || val === "") return { message: "Amount is required" };
      const amount = parseFloat(val);
      if (isNaN(amount)) return { message: "Please enter a valid number" };
      if (amount < minReceiveAmount) return { message: `Minimum receive amount: $${minReceiveAmount.toFixed(2)}` };
      if (amount > maxReceiveAmount) return { message: `Maximum receive amount: $${maxReceiveAmount.toLocaleString()}` };
      return { message: "Invalid amount" };
    }
  ),
  exchangeRate: z.string(),
  fullName: ['zaad', 'sahal', 'evc', 'edahab', 'premier'].includes(sendMethod) 
    ? z.string().min(1, "Full name is required") 
    : z.string().optional(),
  email: z.string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  senderAccount: ['zaad', 'sahal', 'evc', 'edahab', 'premier'].includes(sendMethod) 
    ? z.string().min(1, "Sender account is required") 
    : z.string().optional(),
  walletAddress: z.string().min(1, "Wallet address is required"),
  rememberDetails: z.boolean().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and privacy policy"),
});

type ExchangeFormData = z.infer<ReturnType<typeof createExchangeFormSchema>>;

// Utility functions for localStorage persistence
const EXCHANGE_PERSIST_KEY = 'exchange-persist';
function saveExchangePersist(data: { sendMethod: string, receiveMethod: string, sendAmount: string, receiveAmount: string }) {
  localStorage.setItem(EXCHANGE_PERSIST_KEY, JSON.stringify(data));
}
function loadExchangePersist() {
  try {
    const raw = localStorage.getItem(EXCHANGE_PERSIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function clearExchangePersist() {
  localStorage.removeItem(EXCHANGE_PERSIST_KEY);
}

// Utility functions for personal info persistence
const EXCHANGE_PERSONAL_KEY = 'exchange-personal';
function savePersonalInfo(data: { fullName?: string, email?: string, senderAccount?: string, walletAddress?: string }) {
  localStorage.setItem(EXCHANGE_PERSONAL_KEY, JSON.stringify(data));
}
function loadPersonalInfo() {
  try {
    const raw = localStorage.getItem(EXCHANGE_PERSONAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function clearPersonalInfo() {
  localStorage.removeItem(EXCHANGE_PERSONAL_KEY);
}

// Enhanced storage system for complete page state
const EXCHANGE_COMPLETE_STATE_KEY = 'exchange-complete-state';

function saveCompleteExchangeState(data: {
  sendMethod: string;
  receiveMethod: string;
  sendAmount: string;
  receiveAmount: string;
  fullName: string;
  email: string;
  senderAccount: string;
  walletAddress: string;
  exchangeRate: number;
  rateDisplay: string;
  dynamicLimits: {
    minSendAmount: number;
    maxSendAmount: number;
    minReceiveAmount: number;
    maxReceiveAmount: number;
  };
  timestamp: number;
}) {
  localStorage.setItem(EXCHANGE_COMPLETE_STATE_KEY, JSON.stringify(data));
}

function loadCompleteExchangeState() {
  try {
    const raw = localStorage.getItem(EXCHANGE_COMPLETE_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearCompleteExchangeState() {
  localStorage.removeItem(EXCHANGE_COMPLETE_STATE_KEY);
}

export default function Exchange() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    isReminded, 
    savedData, 
    toggleRemind, 
    updateSavedField,
    forceRemoveData,
    hasSavedData 
  } = useFormDataMemory('exchange');

  // Load complete state on page load
  const completeState = loadCompleteExchangeState();
  const persistedPersonal = loadPersonalInfo();
  const persisted = loadExchangePersist();

  // Use complete state if available, otherwise fall back to individual storage
  const [fullName, setFullName] = useState(completeState?.fullName || persistedPersonal?.fullName || "");
  const [email, setEmail] = useState(completeState?.email || persistedPersonal?.email || "");
  const [senderAccount, setSenderAccount] = useState(completeState?.senderAccount || persistedPersonal?.senderAccount || "");
  const [walletAddress, setWalletAddress] = useState(completeState?.walletAddress || persistedPersonal?.walletAddress || "");

  const [sendMethod, setSendMethod] = useState(completeState?.sendMethod || persisted?.sendMethod || "trc20");
  const [receiveMethod, setReceiveMethod] = useState(completeState?.receiveMethod || persisted?.receiveMethod || "moneygo");
  const [sendAmount, setSendAmount] = useState(completeState?.sendAmount || persisted?.sendAmount || "1");
  const [receiveAmount, setReceiveAmount] = useState(completeState?.receiveAmount || persisted?.receiveAmount || "");
  const [exchangeRate, setExchangeRate] = useState<number>(completeState?.exchangeRate || 0);
  const [rateDisplay, setRateDisplay] = useState(completeState?.rateDisplay || "1 USD = 1.05 EUR");
  const [dynamicLimits, setDynamicLimits] = useState(completeState?.dynamicLimits || {
    minSendAmount: 5,
    maxSendAmount: 10000,
    minReceiveAmount: 5,
    maxReceiveAmount: 10000,
  });

  // Save complete state whenever anything changes
  useEffect(() => {
    saveCompleteExchangeState({
      sendMethod,
      receiveMethod,
      sendAmount,
      receiveAmount,
      fullName,
      email,
      senderAccount,
      walletAddress,
      exchangeRate,
      rateDisplay,
      dynamicLimits,
      timestamp: Date.now()
    });
  }, [sendMethod, receiveMethod, sendAmount, receiveAmount, fullName, email, senderAccount, walletAddress, exchangeRate, rateDisplay, dynamicLimits]);

  // On page load, restore personal info if rememberDetails is true
  // Removed this useEffect as personal info is now saved globally

  // Use localStorage for currency/amount persistence
  // Removed this useEffect as currency/amount is now saved globally

  // Fetch exchange rate
  const { data: rateData, isLoading: rateLoading } = useQuery<ExchangeRateResponse>({
    queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`],
    enabled: !!(sendMethod && receiveMethod && sendMethod !== receiveMethod),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Fetch currency limits
  const { data: sendCurrencyLimits, isLoading: sendLimitsLoading } = useQuery<CurrencyLimitsResponse>({
    queryKey: [`/api/currency-limits/${sendMethod}`],
    enabled: !!sendMethod,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: receiveCurrencyLimits, isLoading: receiveLimitsLoading } = useQuery<CurrencyLimitsResponse>({
    queryKey: [`/api/currency-limits/${receiveMethod}`],
    enabled: !!receiveMethod,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Fetch wallet addresses
  const { data: walletAddresses } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/wallet-addresses"],
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch balances - use admin endpoint for real-time updates
  const { data: balances, isLoading: balancesLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/balances"],
    staleTime: 5000, // 5 seconds for more frequent updates
    refetchOnWindowFocus: false,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch system status
  const { data: systemStatus } = useQuery<{ status: 'on' | 'off' }>({
    queryKey: ["/api/admin/system-status"],
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const form = useForm<ExchangeFormData>({
    resolver: zodResolver(createExchangeFormSchema(
      dynamicLimits.minSendAmount, 
      dynamicLimits.maxSendAmount,
      dynamicLimits.minReceiveAmount,
      dynamicLimits.maxReceiveAmount,
      sendMethod
    )),
    mode: "onChange",
    defaultValues: {
      sendMethod: sendMethod,
      receiveMethod: receiveMethod,
      sendAmount: sendAmount,
      receiveAmount: receiveAmount,
      exchangeRate: exchangeRate.toString(),
      fullName: fullName,
      email: email,
      senderAccount: senderAccount,
      walletAddress: walletAddress,
      agreeToTerms: false,
    },
  });

  // Update exchange rate when data is fetched
  useEffect(() => {
    if (rateData?.rate && !rateLoading) {
      const rate = rateData.rate;
      console.log('Setting exchange rate:', rate, 'from', sendMethod, 'to', receiveMethod);
      setExchangeRate(rate);
      form.setValue("exchangeRate", rate.toString());
      setRateDisplay(`1 ${sendMethod.toUpperCase()} = ${rate} ${receiveMethod.toUpperCase()}`);
      
      if (sendAmount && parseFloat(sendAmount) > 0) {
        const amount = parseFloat(sendAmount);
        const converted = amount * rate;
        const convertedAmount = formatAmount(converted);
        setReceiveAmount(convertedAmount);
        form.setValue("receiveAmount", convertedAmount);
      }
    } else if (!rateData && !rateLoading) {
      console.log('No exchange rate data available for', sendMethod, 'to', receiveMethod);
      setExchangeRate(0);
      setRateDisplay("Rate not available");
    }
  }, [rateData, rateLoading, sendMethod, receiveMethod, sendAmount, form]);

  // Calculate dynamic limits with memoization
  const calculateDynamicLimits = useCallback(() => {
    if (!sendCurrencyLimits?.minAmount || !receiveCurrencyLimits?.minAmount || exchangeRate <= 0) {
      return;
    }

    let effectiveMinSend = sendCurrencyLimits.minAmount;
    let effectiveMaxSend = sendCurrencyLimits.maxAmount;
    let effectiveMaxReceive = receiveCurrencyLimits.maxAmount;

    // Calculate rate-based minimum
    const rateBasedMinSend = receiveCurrencyLimits.minAmount / exchangeRate;
    effectiveMinSend = Math.max(sendCurrencyLimits.minAmount, rateBasedMinSend);

    // Apply balance limits if available
    if (balances && typeof balances === 'object') {
      const currencyMapping: Record<string, string> = {
        'evc': 'EVCPLUS',
        'trc20': 'TRC20',
        'zaad': 'ZAAD',
        'sahal': 'SAHAL',
        'moneygo': 'MONEYGO',
        'premier': 'PREMIER',
        'edahab': 'EDAHAB',
        'trx': 'TRX',
        'peb20': 'PEB20'
      };
      
      const balanceKey = currencyMapping[receiveMethod.toLowerCase()] || receiveMethod.toUpperCase();
      const receiveBalance = balances[balanceKey] || 0;
      
      if (receiveBalance > 0) {
        const balanceBasedMaxSend = receiveBalance / exchangeRate;
        effectiveMaxSend = Math.min(sendCurrencyLimits.maxAmount, balanceBasedMaxSend);
        effectiveMaxReceive = Math.min(receiveCurrencyLimits.maxAmount, receiveBalance);
      }
    }

    setDynamicLimits({
      minSendAmount: effectiveMinSend,
      maxSendAmount: effectiveMaxSend,
      minReceiveAmount: receiveCurrencyLimits.minAmount,
      maxReceiveAmount: effectiveMaxReceive,
    });
  }, [sendCurrencyLimits, receiveCurrencyLimits, exchangeRate, balances, receiveMethod]);

  useEffect(() => {
    calculateDynamicLimits();
  }, [calculateDynamicLimits]);

  // Handle amount calculations
  const handleSendAmountChange = (value: string) => {
    setSendAmount(value);
    if (exchangeRate > 0 && value) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        const converted = amount * exchangeRate;
        const convertedAmount = formatAmount(converted);
        setReceiveAmount(convertedAmount);
        form.setValue("receiveAmount", convertedAmount);
      }
    }
  };

  const handleReceiveAmountChange = (value: string) => {
    setReceiveAmount(value);
    if (exchangeRate > 0 && value) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        const converted = amount / exchangeRate;
        const convertedAmount = formatAmount(converted);
        setSendAmount(convertedAmount);
        form.setValue("sendAmount", convertedAmount);
      }
    }
  };

  // Order creation mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: ExchangeFormData) => {
      const sendAmount = parseFloat(data.sendAmount);
      const receiveAmount = parseFloat(data.receiveAmount);
      
      if (sendAmount > dynamicLimits.maxSendAmount) {
        throw new Error(`Send amount cannot exceed $${dynamicLimits.maxSendAmount.toLocaleString()}`);
      }
      
      if (receiveAmount > dynamicLimits.maxReceiveAmount) {
        throw new Error(`Receive amount cannot exceed $${dynamicLimits.maxReceiveAmount.toLocaleString()}`);
      }
      
      if (sendAmount < dynamicLimits.minSendAmount) {
        throw new Error(`Send amount must be at least $${dynamicLimits.minSendAmount.toFixed(2)}`);
      }
      
      if (receiveAmount < dynamicLimits.minReceiveAmount) {
        throw new Error(`Receive amount must be at least $${dynamicLimits.minReceiveAmount.toFixed(2)}`);
      }

      const paymentWallet = walletAddresses?.[data.receiveMethod] || '';
      
      if (!paymentWallet) {
        throw new Error(`Payment wallet for ${data.receiveMethod.toUpperCase()} is not configured. Please contact support.`);
      }

      const response = await apiRequest("POST", "/api/orders", {
        ...(['zaad', 'sahal', 'evc', 'edahab', 'premier'].includes(data.sendMethod) && { fullName: data.fullName }),
        email: data.email,
        senderAccount: data.senderAccount,
        walletAddress: data.walletAddress,
        sendMethod: data.sendMethod,
        receiveMethod: data.receiveMethod,
        sendAmount: data.sendAmount,
        receiveAmount: data.receiveAmount,
        exchangeRate: data.exchangeRate,
        paymentWallet: paymentWallet,
      });
      return response.json();
    },
    onSuccess: (order) => {
      console.log('Order created successfully:', order);
      sessionStorage.setItem("currentOrder", JSON.stringify(order));
      console.log('Navigating to confirmation page...');
      
      // Show success message and navigate
      toast({
        title: "Order Created Successfully",
        description: `Order ${order.orderId} has been created. Check your email for confirmation.`,
      });
      
      // Navigate to confirmation page
      setLocation("/confirmation");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExchangeFormData) => {
    console.log('Form submission data:', data);
    console.log('Form errors:', form.formState.errors);
    
    // Check if system is closed - hidden
    // if (systemStatus?.status === 'off') {
    //   toast({
    //     title: "System Closed",
    //     description: "Exchange services are temporarily unavailable. Please try again later.",
    //     variant: "destructive",
    //   });
    //   return;
    // }
    
    if (sendMethod === receiveMethod) {
      toast({
        title: "Invalid Selection",
        description: "Send and receive methods cannot be the same",
        variant: "destructive",
      });
      return;
    }

    if (exchangeRate === 0) {
      toast({
        title: "Exchange Rate Not Available",
        description: "Please wait for the exchange rate to load before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    createOrderMutation.mutate(data);
  };

  useWebSocket(); // Establish WebSocket connection for real-time updates

  // Enhanced WebSocket listener for real-time balance updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Exchange page WebSocket connected for real-time balance updates');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle balance updates from admin dashboard
        if (message.type === 'balance_update') {
          console.log('Exchange page received balance update:', message.data);
          
          // Show toast notification for balance update
          toast({
            title: "Balance Updated",
            description: `${message.data.currency} balance has been updated to $${message.data.amount}`,
            duration: 3000,
          });
          
          // Force immediate cache invalidation and refetch
          queryClient.removeQueries({ queryKey: ["/api/admin/balances"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
          queryClient.refetchQueries({ queryKey: ["/api/admin/balances"] });
          
          // Also invalidate exchange rate and limits
          queryClient.invalidateQueries({ queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${sendMethod}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${receiveMethod}`] });
        }
        
        // Handle exchange rate updates
        if (message.type === 'exchange_rate_update') {
          const { fromCurrency, toCurrency } = message.data;
          if ((fromCurrency === sendMethod && toCurrency === receiveMethod) ||
              (fromCurrency === receiveMethod && toCurrency === sendMethod)) {
            queryClient.invalidateQueries({ queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`] });
          }
        }
        
        // Handle currency limit updates
        if (message.type === 'currency_limit_update') {
          queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${sendMethod}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${receiveMethod}`] });
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Exchange page WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Exchange page WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [queryClient, sendMethod, receiveMethod]);

  // Listen for admin updates and refetch exchange rate instantly
  useEffect(() => {
    const handleAdminUpdate = (event: CustomEvent) => {
      // Only refetch if the update is for exchange rates, currency limits, or balances
      if (
        event.detail?.type === 'exchange_rate_update' ||
        event.detail?.type === 'currency_limit_update' ||
        event.detail?.type === 'balance_update'
      ) {
        // Refetch exchange rate and limits
        queryClient.invalidateQueries({ queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${sendMethod}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${receiveMethod}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
      }
    };
    window.addEventListener('admin-update', handleAdminUpdate as EventListener);
    return () => {
      window.removeEventListener('admin-update', handleAdminUpdate as EventListener);
    };
  }, [queryClient, sendMethod, receiveMethod]);

  // Remove rememberDetails from form defaultValues and schema
  // Remove rememberDetails state and checkbox, always save details
  // Add a Clear button to clear saved info and reset form
  // In useEffect, always savePersonalInfo on info change (no rememberDetails check)
  // Removed this useEffect as personal info is now saved globally

  // Remove useEffect that clears info on rememberDetails change

  // Helper to get exclusions for a selected value
  function getExclusions(selected: string) {
    return specialExclusions[selected] || [selected];
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Currency Exchange</h1>
        <p className="text-lg text-gray-600">Complete your exchange in just a few steps</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Exchange Rate Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Current Rate:</span>
                  {rateLoading ? (
                    <span className="text-sm text-blue-600">Loading rate...</span>
                  ) : rateData?.rate ? (
                    <span className="text-lg font-bold text-blue-900">{rateDisplay}</span>
                  ) : (
                    <span className="text-sm text-red-600">Rate not available</span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs text-center">
                    <span className="text-blue-700 font-medium">Transaction Limits: </span>
                    {sendLimitsLoading || receiveLimitsLoading ? (
                      <span className="text-blue-600">Loading limits...</span>
                    ) : (
                      <span className="text-blue-600">${dynamicLimits.minSendAmount.toFixed(0)} - ${dynamicLimits.maxSendAmount.toLocaleString()} for all payment methods</span>
                    )}
                  </div>
                  {balancesLoading ? (
                    <div className="text-xs text-center mt-1 text-blue-600">Loading balances...</div>
                  ) : balances && (
                    <div className="text-xs text-center mt-1 text-green-600 flex items-center justify-center gap-2">
                      <span>
                        Available: ${(() => {
                          const currencyMapping: Record<string, string> = {
                            'evc': 'EVCPLUS',
                            'trc20': 'TRC20', 
                            'zaad': 'ZAAD',
                            'sahal': 'SAHAL',
                            'moneygo': 'MONEYGO',
                            'premier': 'PREMIER',
                            'edahab': 'EDAHAB',
                            'trx': 'TRX',
                            'peb20': 'PEB20'
                          };
                          const balanceKey = currencyMapping[receiveMethod.toLowerCase()] || receiveMethod.toUpperCase();
                          return (balances[balanceKey] || 0).toLocaleString();
                        })()} {receiveMethod.toUpperCase()}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-green-600 hover:text-green-800"
                        onClick={() => {
                          queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
                          queryClient.refetchQueries({ queryKey: ["/api/admin/balances"] });
                        }}
                        title="Refresh balance"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Send Method */}
              <FormField
                control={form.control}
                name="sendMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-700 flex items-center">
                      <ArrowUpCircle className="w-5 h-5 mr-2 text-red-600" />
                      You Send
                    </FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSendMethod(value);
                                if (isReminded) {
                                  updateSavedField('sendMethod', value);
                                }
                              }}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentMethods
                                  .filter(method => !getExclusions(receiveMethod).includes(method.value))
                                  .map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                      <div className="flex items-center">
                                        <img src={method.logo} alt={method.label} className="w-6 h-6 mr-2" />
                                        {method.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                      <FormField
                        control={form.control}
                        name="sendAmount"
                        render={({ field }) => (
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="h-12 text-lg"
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                handleSendAmountChange(e.target.value);
                                if (isReminded) {
                                  updateSavedField('sendAmount', e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Receive Method */}
              <FormField
                control={form.control}
                name="receiveMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-700 flex items-center">
                      <ArrowDownCircle className="w-5 h-5 mr-2 text-green-600" />
                      You Receive
                    </FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                setReceiveMethod(value);
                                if (isReminded) {
                                  updateSavedField('receiveMethod', value);
                                }
                              }}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentMethods
                                  .filter(method => !getExclusions(sendMethod).includes(method.value))
                                  .map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                      <div className="flex items-center">
                                        <img src={method.logo} alt={method.label} className="w-6 h-6 mr-2" />
                                        {method.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                      <FormField
                        control={form.control}
                        name="receiveAmount"
                        render={({ field }) => (
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="h-12 text-lg"
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                handleReceiveAmountChange(e.target.value);
                                if (isReminded) {
                                  updateSavedField('receiveAmount', e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Section 1: Full Name (when required) */}
              {['zaad', 'sahal', 'evc', 'edahab', 'premier'].includes(sendMethod) && (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your full name"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                if (isReminded) {
                                  updateSavedField('fullName', e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Section 2: Sender Account Information (when required) */}
              {['zaad', 'sahal', 'evc', 'edahab', 'premier'].includes(sendMethod) && (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sender Account Details</h3>
                    <FormField
                      control={form.control}
                      name="senderAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {['zaad', 'sahal', 'evc', 'edahab'].includes(sendMethod) 
                              ? `${sendMethod.charAt(0).toUpperCase() + sendMethod.slice(1)} Phone Number *`
                              : 'Premier Bank Account Number *'
                            }
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                ['zaad', 'sahal', 'evc', 'edahab'].includes(sendMethod)
                                  ? "252612345678"
                                  : "1234567890"
                              }
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                if (isReminded) {
                                  updateSavedField('senderAccount', e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Section 3: Contact and Payment Information */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Payment Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              if (isReminded) {
                                updateSavedField('email', e.target.value);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="text-xs text-blue-600 mt-1">
                          📧 Email notifications will be sent to this address
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {['zaad', 'sahal', 'evc', 'edahab'].includes(receiveMethod) 
                            ? `${receiveMethod.charAt(0).toUpperCase() + receiveMethod.slice(1)} Phone Number *`
                            : receiveMethod === 'premier'
                            ? 'Premier Bank Account Number *'
                            : receiveMethod === 'moneygo'
                            ? 'MoneyGo Phone Number *'
                            : `${receiveMethod.toUpperCase()} Wallet Address *`
                          }
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              ['zaad', 'sahal', 'evc', 'edahab', 'moneygo'].includes(receiveMethod)
                                ? "252612345678"
                                : receiveMethod === 'premier'
                                ? "1234567890"
                                : receiveMethod === 'trc20' || receiveMethod === 'peb20'
                                ? "TRC20 wallet address (e.g., T...)"
                                : receiveMethod === 'trx'
                                ? "TRX wallet address"
                                : receiveMethod === 'usdc'
                                ? "USDC wallet address"
                                : "Enter your wallet address or account number"
                            }
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              if (isReminded) {
                                updateSavedField('walletAddress', e.target.value);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Remember Details and Terms */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-2">
                        I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> *
                      </label>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 mt-2">
                  <Button
                    type="submit"
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    disabled={createOrderMutation.isPending || exchangeRate === 0 || systemStatus?.status === 'off' || !form.watch('agreeToTerms')}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    {createOrderMutation.isPending ? "Processing..." : "Submit Exchange Request"}
                  </Button>
                  <Button
                    type="button"
                    className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg mt-4"
                    onClick={() => {
                      // Clear complete state and reset to defaults
                      clearCompleteExchangeState();
                      clearExchangePersist();
                      setSendMethod("trc20");
                      setReceiveMethod("moneygo");
                      setSendAmount("1");
                      setReceiveAmount("");
                      setExchangeRate(0);
                      setRateDisplay("1 USD = 1.05 EUR");
                      setDynamicLimits({
                        minSendAmount: 5,
                        maxSendAmount: 10000,
                        minReceiveAmount: 5,
                        maxReceiveAmount: 10000,
                      });
                      // Keep personal info saved separately
                    }}
                  >
                    Clear all exchange data (keep personal info)
                  </Button>
                </div>

                {/* Separate button for clearing personal info only */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full md:w-auto border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-1 px-3 rounded text-sm mt-2"
                  onClick={() => {
                    clearPersonalInfo();
                    setFullName("");
                    setEmail("");
                    setSenderAccount("");
                    setWalletAddress("");
                  }}
                >
                  Clear personal information only
                </Button>

                {/* Button to clear everything */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full md:w-auto border-red-300 text-red-600 hover:bg-red-50 font-medium py-1 px-3 rounded text-sm mt-2"
                  onClick={() => {
                    clearCompleteExchangeState();
                    clearPersonalInfo();
                    clearExchangePersist();
                    setFullName("");
                    setEmail("");
                    setSenderAccount("");
                    setWalletAddress("");
                    setSendMethod("trc20");
                    setReceiveMethod("moneygo");
                    setSendAmount("1");
                    setReceiveAmount("");
                    setExchangeRate(0);
                    setRateDisplay("1 USD = 1.05 EUR");
                    setDynamicLimits({
                      minSendAmount: 5,
                      maxSendAmount: 10000,
                      minReceiveAmount: 5,
                      maxReceiveAmount: 10000,
                    });
                    form.reset();
                  }}
                >
                  Clear everything (complete reset)
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}