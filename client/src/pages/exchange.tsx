import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowUpCircle, ArrowDownCircle, User, Send, Bell, BellOff } from "lucide-react";
import { useFormDataMemory } from "@/hooks/use-form-data-memory";
import { formatAmount } from "@/lib/utils";

interface ExchangeRateResponse {
  rate: number;
  from: string;
  to: string;
}

interface CurrencyLimitsResponse {
  minAmount: number;
  maxAmount: number;
  from: string;
  to: string;
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
  { value: "trx", label: "TRX", logo: trxLogo },
  { value: "trc20", label: "TRC20", logo: trc20Logo },
  { value: "peb20", label: "PEB20", logo: peb20Logo },
];

const createExchangeFormSchema = (
  minSendAmount: number = 25, 
  maxSendAmount: number = 7500,
  minReceiveAmount: number = 24.50,
  maxReceiveAmount: number = 7350
) => z.object({
  sendMethod: z.string().min(1, "Please select a send method"),
  receiveMethod: z.string().min(1, "Please select a receive method"),
  sendAmount: z.string().refine(
    (val) => {
      if (!val || val === "") return true; // Allow empty during typing
      const amount = parseFloat(val);
      if (isNaN(amount)) return false;
      return amount >= minSendAmount && amount <= maxSendAmount;
    },
    (val) => {
      if (!val || val === "") return { message: "Amount is required" };
      const amount = parseFloat(val);
      if (isNaN(amount)) return { message: "Please enter a valid number" };
      if (amount < minSendAmount) return { message: `Minimum send amount is $${minSendAmount.toFixed(2)}.` };
      if (amount > maxSendAmount) return { message: `Maximum send amount is $${maxSendAmount.toLocaleString()}.` };
      return { message: "Invalid amount" };
    }
  ),
  receiveAmount: z.string().refine(
    (val) => {
      if (!val || val === "") return true; // Allow empty during typing
      const amount = parseFloat(val);
      if (isNaN(amount)) return false;
      return amount >= minReceiveAmount && amount <= maxReceiveAmount;
    },
    (val) => {
      if (!val || val === "") return { message: "Amount is required" };
      const amount = parseFloat(val);
      if (isNaN(amount)) return { message: "Please enter a valid number" };
      if (amount < minReceiveAmount) return { message: `Minimum receive amount is $${minReceiveAmount.toFixed(2)}.` };
      if (amount > maxReceiveAmount) return { message: `Maximum receive amount is $${maxReceiveAmount.toLocaleString()}.` };
      return { message: "Invalid amount" };
    }
  ),
  exchangeRate: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  rememberDetails: z.boolean().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and privacy policy"),
});

type ExchangeFormData = z.infer<ReturnType<typeof createExchangeFormSchema>>;

export default function Exchange() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [rateDisplay, setRateDisplay] = useState("1 USD = 1.05 EUR");
  // Load persisted exchange state from localStorage
  const loadPersistedExchangeState = () => {
    try {
      const saved = localStorage.getItem('exchangeFormState');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          sendMethod: parsed.sendMethod || "trc20",
          receiveMethod: parsed.receiveMethod || "moneygo",
          sendAmount: parsed.sendAmount || "1",
          receiveAmount: parsed.receiveAmount || ""
        };
      }
    } catch (error) {
      console.warn('Failed to load persisted exchange state:', error);
    }
    return {
      sendMethod: "trc20",
      receiveMethod: "moneygo", 
      sendAmount: "1",
      receiveAmount: ""
    };
  };

  const persistedState = loadPersistedExchangeState();
  const [sendMethod, setSendMethod] = useState(persistedState.sendMethod);
  const [receiveMethod, setReceiveMethod] = useState(persistedState.receiveMethod);
  const [sendAmount, setSendAmount] = useState(persistedState.sendAmount);
  const [receiveAmount, setReceiveAmount] = useState(persistedState.receiveAmount);

  // Save exchange state to localStorage whenever values change
  const saveExchangeState = (updates: Partial<{
    sendMethod: string;
    receiveMethod: string;
    sendAmount: string;
    receiveAmount: string;
  }>) => {
    try {
      const currentState = {
        sendMethod,
        receiveMethod,
        sendAmount,
        receiveAmount,
        ...updates
      };
      localStorage.setItem('exchangeFormState', JSON.stringify(currentState));
    } catch (error) {
      console.warn('Failed to save exchange state:', error);
    }
  };
  const [formKey, setFormKey] = useState(0);
  const [calculatingFromSend, setCalculatingFromSend] = useState(false);
  const [calculatingFromReceive, setCalculatingFromReceive] = useState(false);
  const [dynamicLimits, setDynamicLimits] = useState({
    minSendAmount: 25,
    maxSendAmount: 7500,
    minReceiveAmount: 24.50,
    maxReceiveAmount: 7350,
  });

  // Initialize form data memory for auto-save functionality
  const { 
    isReminded, 
    savedData, 
    toggleRemind, 
    updateSavedField,
    forceRemoveData,
    hasSavedData 
  } = useFormDataMemory('exchange');

  // Fetch admin-configured limits for the send currency
  const { data: sendCurrencyLimits } = useQuery<{ minAmount: number; maxAmount: number; currency: string }>({
    queryKey: [`/api/currency-limits/${sendMethod}`],
    enabled: !!sendMethod,
    refetchInterval: 1000, // Refresh every 1 second for immediate admin updates
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch admin-configured limits for the receive currency
  const { data: receiveCurrencyLimits } = useQuery<{ minAmount: number; maxAmount: number; currency: string }>({
    queryKey: [`/api/currency-limits/${receiveMethod}`],
    enabled: !!receiveMethod,
    refetchInterval: 1000, // Refresh every 1 second for immediate admin updates
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch live wallet addresses from admin dashboard
  const { data: walletAddresses } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/wallet-addresses"],
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch current balances to enforce balance-based limits
  const { data: balances } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/balances"],
    refetchInterval: 1000, // Refresh every 1 second for immediate updates
    staleTime: 0,
    gcTime: 0,
  });

  // Create a dynamic form resolver that always uses current limits
  const getDynamicResolver = useCallback(() => {
    return zodResolver(createExchangeFormSchema(
      dynamicLimits.minSendAmount, 
      dynamicLimits.maxSendAmount,
      dynamicLimits.minReceiveAmount,
      dynamicLimits.maxReceiveAmount
    ));
  }, [dynamicLimits]);

  const form = useForm<ExchangeFormData>({
    resolver: getDynamicResolver(),
    mode: "onChange",
    defaultValues: {
      sendMethod: sendMethod,
      receiveMethod: receiveMethod,
      sendAmount: sendAmount,
      receiveAmount: receiveAmount,
      exchangeRate: exchangeRate.toString(),
      fullName: savedData.fullName || "",
      phoneNumber: savedData.phoneNumber || "",
      walletAddress: savedData.walletAddress || "",
      rememberDetails: isReminded,
      agreeToTerms: false,
    },
  });

  // Calculate dynamic limits when exchange rate, currency limits, or balances change
  useEffect(() => {
    if (sendCurrencyLimits && receiveCurrencyLimits && exchangeRate > 0 && balances) {
      // Get admin-configured limits for send currency
      const adminMinSend = sendCurrencyLimits.minAmount;
      const adminMaxSend = sendCurrencyLimits.maxAmount;
      
      // Get admin-configured limits for receive currency
      const adminMinReceive = receiveCurrencyLimits.minAmount;
      const adminMaxReceive = receiveCurrencyLimits.maxAmount;
      
      // Get available balance for receive currency to limit max outgoing amount
      const receiveBalance = balances[receiveMethod?.toUpperCase()] || 0;
      
      // Calculate balance-constrained max receive amount (cannot exceed available balance)
      const balanceConstrainedMaxReceive = Math.min(adminMaxReceive, receiveBalance);
      
      // Dynamic Max Send Calculation: Max Send = Max Receive / Exchange Rate
      // Priority: Use the calculated value from max receive and rate, not static admin send limit
      const dynamicMaxSendFromAdminReceive = adminMaxReceive / exchangeRate;
      const dynamicMaxSendFromBalance = balanceConstrainedMaxReceive / exchangeRate;
      
      // Use the dynamic calculation as primary limit (Max Receive ÷ Rate)
      // Only constrain by balance if it's lower than the calculated value
      const effectiveMaxSend = Math.min(
        dynamicMaxSendFromAdminReceive,  // Primary: Max Receive ÷ Rate  
        dynamicMaxSendFromBalance        // Secondary: Balance constraint
      );
      // Note: Removed adminMaxSend constraint to allow dynamic calculation to take precedence
      
      const effectiveMinSend = adminMinSend; // Always enforce admin minimum
      
      // Calculate receive limits - use admin max receive as primary limit  
      const effectiveMinReceive = adminMinReceive;
      const effectiveMaxReceive = Math.min(adminMaxReceive, balanceConstrainedMaxReceive);
      
      const newLimits = {
        minSendAmount: effectiveMinSend,
        maxSendAmount: Math.max(effectiveMinSend, effectiveMaxSend), // Ensure max >= min
        minReceiveAmount: effectiveMinReceive,
        maxReceiveAmount: Math.max(effectiveMinReceive, effectiveMaxReceive), // Ensure max >= min
      };

      console.log(`Dynamic limits recalculated: Max Send = ${newLimits.maxSendAmount.toFixed(2)} (${adminMaxReceive} ÷ ${exchangeRate})`);
      
      setDynamicLimits(newLimits);
      setFormKey(prev => prev + 1); // Force form re-render with new limits
      
      // Force re-validation with updated resolver
      const currentSendAmount = form.getValues('sendAmount');
      const currentReceiveAmount = form.getValues('receiveAmount');
      
      // Clear existing errors and prepare for re-validation
      form.clearErrors();
      
      // Re-validate current amounts against new limits
      setTimeout(() => {
        if (currentSendAmount) {
          const amount = parseFloat(currentSendAmount);
          if (amount > newLimits.maxSendAmount) {
            form.setError('sendAmount', {
              type: 'manual',
              message: `Maximum send amount is $${newLimits.maxSendAmount.toLocaleString()}.`
            });
          }
        }
        
        if (currentReceiveAmount) {
          const amount = parseFloat(currentReceiveAmount);
          if (amount > newLimits.maxReceiveAmount) {
            form.setError('receiveAmount', {
              type: 'manual',
              message: `Maximum receive amount is $${newLimits.maxReceiveAmount.toLocaleString()}.`
            });
          }
        }
        
        form.trigger(['sendAmount', 'receiveAmount']);
      }, 100);
    }
  }, [sendCurrencyLimits, receiveCurrencyLimits, exchangeRate, balances, receiveMethod, form, formKey]);

  // Update form values when state changes
  useEffect(() => {
    form.setValue("sendMethod", sendMethod);
    form.setValue("receiveMethod", receiveMethod);
    form.setValue("sendAmount", sendAmount);
    form.setValue("receiveAmount", receiveAmount);
  }, [sendMethod, receiveMethod, sendAmount, receiveAmount, form]);

  // Save state whenever any exchange value changes
  useEffect(() => {
    saveExchangeState({
      sendMethod,
      receiveMethod,
      sendAmount,
      receiveAmount
    });
  }, [sendMethod, receiveMethod, sendAmount, receiveAmount]);

  // Restore saved data when component mounts or saved data changes
  useEffect(() => {
    if (isReminded && hasSavedData) {
      form.setValue("fullName", savedData.fullName || "");
      form.setValue("phoneNumber", savedData.phoneNumber || "");
      form.setValue("walletAddress", savedData.walletAddress || "");
      form.setValue("rememberDetails", true);
    }
  }, [isReminded, savedData, hasSavedData, form]);

  // Fetch exchange rate when methods change with frequent refresh for admin updates
  const { data: rateData, refetch: refetchRate } = useQuery<ExchangeRateResponse>({
    queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`],
    enabled: !!(sendMethod && receiveMethod && sendMethod !== receiveMethod),
    refetchInterval: 1000, // Refresh every 1 second for immediate admin rate updates
    staleTime: 0, // Always consider data stale to get latest rates
    gcTime: 0, // Don't cache for garbage collection
  });

  // Update exchange rate and calculate initial receive amount
  useEffect(() => {
    if (rateData) {
      const rate = rateData.rate;
      setExchangeRate(rate);
      form.setValue("exchangeRate", rate.toString());
      setRateDisplay(`1 ${sendMethod.toUpperCase()} = ${rate} ${receiveMethod.toUpperCase()}`);
      
      // Force recalculation of receive amount whenever rate changes
      if (sendAmount && parseFloat(sendAmount) > 0) {
        const amount = parseFloat(sendAmount);
        const converted = amount * rate;
        const convertedAmount = formatAmount(converted);
        setReceiveAmount(convertedAmount);
        form.setValue("receiveAmount", convertedAmount);
        saveExchangeState({ sendAmount, receiveAmount: convertedAmount });
      }
      
      // Trigger validation to update max amount limits based on new rate
      setTimeout(() => {
        form.trigger(['sendAmount', 'receiveAmount']);
      }, 100);
    }
  }, [rateData, sendMethod, receiveMethod, form, sendAmount]);

  // Force refresh exchange rate when methods change
  useEffect(() => {
    if (sendMethod && receiveMethod && sendMethod !== receiveMethod) {
      refetchRate();
    }
  }, [sendMethod, receiveMethod, refetchRate]);

  // WebSocket connection for real-time admin updates
  useEffect(() => {
    if (!sendMethod || !receiveMethod) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected for real-time updates');
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle exchange rate updates from admin dashboard
        if (message.type === 'exchange_rate_update') {
          const { fromCurrency, toCurrency, rate } = message.data;
          
          // Check if this rate update affects current currency pair
          if ((fromCurrency === sendMethod && toCurrency === receiveMethod) ||
              (fromCurrency === receiveMethod && toCurrency === sendMethod)) {
            
            console.log(`Exchange rate updated from WebSocket: ${rate} for ${fromCurrency}/${toCurrency}`);
            console.log(`Recalculating with new rate: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
            
            // Force immediate refresh of all related data
            queryClient.invalidateQueries({ 
              queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`] 
            });
            queryClient.invalidateQueries({ 
              queryKey: [`/api/currency-limits/${sendMethod}`] 
            });
            queryClient.invalidateQueries({ 
              queryKey: [`/api/currency-limits/${receiveMethod}`] 
            });
            queryClient.invalidateQueries({ 
              queryKey: [`/api/admin/balances`] 
            });
            
            // Force form key increment to trigger complete recalculation
            setFormKey(prev => prev + 1);
            
            // Refetch rate data immediately
            refetchRate();
          }
        }
        
        // Handle currency limit updates
        if (message.type === 'currency_limit_update') {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/currency-limits/${sendMethod}`] 
          });
          queryClient.invalidateQueries({ 
            queryKey: [`/api/currency-limits/${receiveMethod}`] 
          });
          // Force form recalculation
          setFormKey(prev => prev + 1);
        }
        
        // Handle balance updates
        if (message.type === 'balance_update') {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/admin/balances`] 
          });
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket connection error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [sendMethod, receiveMethod, refetchRate, form]);

  // Handle amount calculations with prevention of loops
  const handleSendAmountChange = (value: string) => {
    setSendAmount(value);
    saveExchangeState({ sendAmount: value });
    
    // Auto-calculate receive amount when send amount changes
    if (!calculatingFromReceive && exchangeRate > 0) {
      setCalculatingFromSend(true);
      
      if (value && value !== "") {
        const amount = parseFloat(value) || 0;
        if (amount >= 0) {
          const converted = amount * exchangeRate;
          const convertedAmount = formatAmount(converted);
          setReceiveAmount(convertedAmount);
          form.setValue("receiveAmount", convertedAmount);
          saveExchangeState({ sendAmount: value, receiveAmount: convertedAmount });
        }
      } else {
        // Clear receive amount when send amount is empty
        setReceiveAmount("");
        form.setValue("receiveAmount", "");
        saveExchangeState({ sendAmount: value, receiveAmount: "" });
      }
      
      setTimeout(() => setCalculatingFromSend(false), 10);
    }
  };

  const handleReceiveAmountChange = (value: string) => {
    setReceiveAmount(value);
    saveExchangeState({ receiveAmount: value });
    
    // Auto-calculate send amount when receive amount changes
    if (!calculatingFromSend && exchangeRate > 0) {
      setCalculatingFromReceive(true);
      
      if (value && value !== "") {
        const amount = parseFloat(value) || 0;
        if (amount >= 0) {
          const converted = amount / exchangeRate;
          const convertedAmount = formatAmount(converted);
          setSendAmount(convertedAmount);
          form.setValue("sendAmount", convertedAmount);
          saveExchangeState({ receiveAmount: value, sendAmount: convertedAmount });
        }
      } else {
        // Clear send amount when receive amount is empty
        setSendAmount("");
        form.setValue("sendAmount", "");
        saveExchangeState({ receiveAmount: value, sendAmount: "" });
      }
      
      setTimeout(() => setCalculatingFromReceive(false), 10);
    }
  };

  // Handle form field changes and auto-save when remind is enabled
  const handleFieldChange = (field: string, value: any) => {
    if (isReminded) {
      updateSavedField(field, value);
    }
  };

  // Toggle remind functionality with complete form control
  const handleToggleRemind = () => {
    const currentFormData = form.getValues();
    const dataToSave = {
      fullName: currentFormData.fullName,
      phoneNumber: currentFormData.phoneNumber,
      walletAddress: currentFormData.walletAddress,
    };
    
    const newRemindStatus = toggleRemind(dataToSave);
    form.setValue("rememberDetails", newRemindStatus);
    
    if (newRemindStatus) {
      // When turning ON - save current data
      toast({
        title: "Data Saved",
        description: "Your personal details will be remembered for future exchanges.",
        variant: "default",
      });
    } else {
      // When turning OFF - clear form fields immediately
      form.setValue("fullName", "");
      form.setValue("phoneNumber", "");
      form.setValue("walletAddress", "");
      
      toast({
        title: "Data Cleared",
        description: "Your saved personal details have been removed.",
        variant: "default",
      });
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: ExchangeFormData) => {
      // Final client-side validation with current dynamic limits
      const sendAmount = parseFloat(data.sendAmount);
      const receiveAmount = parseFloat(data.receiveAmount);
      
      // Enforce dynamic max limits at submission time to prevent bypass
      if (sendAmount > dynamicLimits.maxSendAmount) {
        throw new Error(`Send amount cannot exceed $${dynamicLimits.maxSendAmount.toLocaleString()}. Current max is calculated as: Max Receive ($${dynamicLimits.maxReceiveAmount.toLocaleString()}) ÷ Exchange Rate (${exchangeRate}) = $${dynamicLimits.maxSendAmount.toLocaleString()}`);
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

      // Get the live payment wallet address from admin dashboard
      const paymentWallet = walletAddresses?.[data.receiveMethod] || '';
      
      if (!paymentWallet) {
        throw new Error(`Payment wallet for ${data.receiveMethod.toUpperCase()} is not configured. Please contact support.`);
      }

      const response = await apiRequest("POST", "/api/orders", {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        walletAddress: data.walletAddress,
        sendMethod: data.sendMethod,
        receiveMethod: data.receiveMethod,
        sendAmount: data.sendAmount,
        receiveAmount: data.receiveAmount,
        exchangeRate: data.exchangeRate,
        paymentWallet: paymentWallet, // Use live wallet address from admin dashboard
      });
      return response.json();
    },
    onSuccess: (order) => {
      // Store order data in sessionStorage for confirmation page
      sessionStorage.setItem("currentOrder", JSON.stringify(order));
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
    if (sendMethod === receiveMethod) {
      toast({
        title: "Invalid Selection",
        description: "Send and receive methods cannot be the same",
        variant: "destructive",
      });
      return;
    }
    
    // Final validation against dynamic limits before submission
    const sendAmount = parseFloat(data.sendAmount);
    const receiveAmount = parseFloat(data.receiveAmount);
    
    // Check against current dynamic max limits
    if (sendAmount > dynamicLimits.maxSendAmount) {
      toast({
        title: "Amount Exceeds Limit",
        description: `Send amount cannot exceed $${dynamicLimits.maxSendAmount.toLocaleString()}. This limit is calculated as: Max Receive ($${dynamicLimits.maxReceiveAmount.toLocaleString()}) ÷ Exchange Rate (${exchangeRate})`,
        variant: "destructive",
      });
      form.setError('sendAmount', {
        type: 'manual',
        message: `Maximum send amount is $${dynamicLimits.maxSendAmount.toLocaleString()}.`
      });
      return;
    }
    
    if (receiveAmount > dynamicLimits.maxReceiveAmount) {
      toast({
        title: "Amount Exceeds Limit",
        description: `Receive amount cannot exceed $${dynamicLimits.maxReceiveAmount.toLocaleString()}`,
        variant: "destructive",
      });
      form.setError('receiveAmount', {
        type: 'manual',
        message: `Maximum receive amount is $${dynamicLimits.maxReceiveAmount.toLocaleString()}.`
      });
      return;
    }
    
    createOrderMutation.mutate(data);
  };

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
                  <span className="text-lg font-bold text-blue-900">{rateDisplay}</span>
                </div>
                {sendCurrencyLimits && receiveCurrencyLimits && exchangeRate > 0 && balances && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                      <div>
                        <span className="text-blue-700 font-medium">Send Limits:</span>
                        <div className="text-blue-600">
                          ${dynamicLimits.minSendAmount.toFixed(2)} - ${dynamicLimits.maxSendAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-500 mt-1">
                          Max = ${dynamicLimits.maxReceiveAmount.toLocaleString()} ÷ {exchangeRate}
                        </div>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Receive Limits:</span>
                        <div className="text-blue-600">
                          ${dynamicLimits.minReceiveAmount.toFixed(2)} - ${dynamicLimits.maxReceiveAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-500 mt-1">
                          Admin configured max
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-blue-200">
                      <div>
                        <span className="text-blue-700 font-medium">Available Balance:</span>
                        <div className="text-blue-600">
                          {receiveMethod?.toUpperCase()}: ${balances[receiveMethod?.toUpperCase()]?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Admin Limits:</span>
                        <div className="text-blue-600">
                          Send: ${sendCurrencyLimits.minAmount}-${sendCurrencyLimits.maxAmount.toLocaleString()} | Receive: ${receiveCurrencyLimits.minAmount}-${receiveCurrencyLimits.maxAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Send Section */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <ArrowUpCircle className="w-5 h-5 mr-2 text-primary" />
                    You Send
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sendMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Send Method</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            setSendMethod(value);
                            saveExchangeState({ sendMethod: value });
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  <div className="flex items-center space-x-2">
                                    {method.logo && (
                                      <img 
                                        src={method.logo} 
                                        alt={method.label} 
                                        className="w-5 h-5 object-contain"
                                      />
                                    )}
                                    <span>{method.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sendAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              min="5"
                              max="10000"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleSendAmountChange(e.target.value);
                              }}
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Min: ${dynamicLimits.minSendAmount.toFixed(2)}</span>
                            <span>Max: ${dynamicLimits.maxSendAmount.toLocaleString()}</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Receive Section */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <ArrowDownCircle className="w-5 h-5 mr-2 text-green-600" />
                    You Receive
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="receiveMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receive Method</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            setReceiveMethod(value);
                            saveExchangeState({ receiveMethod: value });
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  <div className="flex items-center space-x-2">
                                    {method.logo && (
                                      <img 
                                        src={method.logo} 
                                        alt={method.label} 
                                        className="w-5 h-5 object-contain"
                                      />
                                    )}
                                    <span>{method.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="receiveAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              step="0.01"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleReceiveAmountChange(e.target.value);
                              }}
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Min: ${dynamicLimits.minReceiveAmount.toFixed(2)}</span>
                            <span>Max: ${dynamicLimits.maxReceiveAmount.toLocaleString()}</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg font-semibold">
                    <div className="flex items-center">
                      <User className="w-5 h-5 mr-2 text-gray-600" />
                      Customer Information
                    </div>
                    <Button
                      type="button"
                      variant={isReminded ? "default" : "outline"}
                      size="sm"
                      onClick={handleToggleRemind}
                      className={`flex items-center space-x-2 transition-all ${
                        isReminded 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "border-blue-600 text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {isReminded ? (
                        <>
                          <Bell className="w-4 h-4" />
                          <span>ON</span>
                        </>
                      ) : (
                        <>
                          <BellOff className="w-4 h-4" />
                          <span>Remind Me</span>
                        </>
                      )}
                    </Button>
                  </CardTitle>
                  {isReminded && (
                    <p className="text-sm text-blue-600 mt-2">
                      Your personal details are being automatically saved and will be remembered for future exchanges.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                field.onChange(e);
                                handleFieldChange('fullName', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+252 XX XXX XXXX" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldChange('phoneNumber', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Address / Account Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter wallet address or account number" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              handleFieldChange('walletAddress', e.target.value);
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">Enter the destination wallet address or account number</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Terms and Options */}
              <Card className="border-2">
                <CardContent className="pt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="rememberDetails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            Remember my details for future transactions
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I agree to the{" "}
                            <a href="/terms" className="text-primary hover:underline">
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="/privacy" className="text-primary hover:underline">
                              Privacy Policy
                            </a>{" "}
                            *
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full py-3 text-lg font-semibold h-auto"
                  disabled={createOrderMutation.isPending}
                >
                  <Send className="w-5 h-5 mr-2" />
                  {createOrderMutation.isPending ? "Processing..." : "Submit Exchange Request"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
