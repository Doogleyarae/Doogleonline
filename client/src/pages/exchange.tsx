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
      if (!val || val === "") return true; // Allow empty during typing
      const amount = parseFloat(val);
      if (isNaN(amount)) return false;
      return amount >= minSendAmount && amount <= maxSendAmount;
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
      if (!val || val === "") return true; // Allow empty during typing
      const amount = parseFloat(val);
      if (isNaN(amount)) return false;
      return amount >= minReceiveAmount && amount <= maxReceiveAmount;
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
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phoneNumber: z.string().min(8, "Phone number must be at least 8 digits"),
  senderAccount: z.string().optional(),
  walletAddress: z.string().min(5, "Wallet address must be at least 5 characters"),
  rememberDetails: z.boolean().default(false),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

type ExchangeFormData = z.infer<ReturnType<typeof createExchangeFormSchema>>;

export default function Exchange() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [rateDisplay, setRateDisplay] = useState("Exchange rate loading...");
  
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

  const [calculatingFromSend, setCalculatingFromSend] = useState(false);
  const [calculatingFromReceive, setCalculatingFromReceive] = useState(false);
  const [dynamicLimits, setDynamicLimits] = useState({
    minSendAmount: 5,
    maxSendAmount: 10000,
    minReceiveAmount: 5,
    maxReceiveAmount: 10000,
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

  // Fetch admin-configured limits with NO CACHING - always use latest limits
  const { data: sendCurrencyLimits } = useQuery<{ minAmount: number; maxAmount: number; currency: string }>({
    queryKey: [`/api/currency-limits/${sendMethod}`],
    enabled: !!sendMethod,
    staleTime: 0, // No stale time - always fetch fresh
    gcTime: 0, // No garbage collection time - don't cache
    refetchOnWindowFocus: true, // Always refetch when user focuses
    refetchOnReconnect: true, // Always refetch on reconnect
    refetchInterval: 1000, // Refetch every 1 second for immediate Balance Management updates
  });

  // Fetch admin-configured limits with NO CACHING - always use latest limits
  const { data: receiveCurrencyLimits } = useQuery<{ minAmount: number; maxAmount: number; currency: string }>({
    queryKey: [`/api/currency-limits/${receiveMethod}`],
    enabled: !!receiveMethod,
    staleTime: 0, // No stale time - always fetch fresh
    gcTime: 0, // No garbage collection time - don't cache
    refetchOnWindowFocus: true, // Always refetch when user focuses
    refetchOnReconnect: true, // Always refetch on reconnect
    refetchInterval: 1000, // Refetch every 1 second for immediate Balance Management updates
  });

  // Fetch live wallet addresses from admin dashboard
  const { data: walletAddresses } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/wallet-addresses"],
    staleTime: 30 * 60 * 1000, // 30 minutes - much longer caching
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false, // Disable automatic refetching
    refetchOnReconnect: false,
  });

  // Fetch current balances with NO CACHING - always use latest balance data
  const { data: balances } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/balances"],
    staleTime: 0, // No stale time - always fetch fresh
    gcTime: 0, // No garbage collection time - don't cache
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for real-time balance updates
    refetchOnWindowFocus: true, // Refetch when user focuses window
    refetchOnReconnect: true,
  });

  // Create a dynamic form resolver that always uses current limits
  const getDynamicResolver = useCallback(() => {
    return zodResolver(createExchangeFormSchema(
      dynamicLimits.minSendAmount, 
      dynamicLimits.maxSendAmount,
      dynamicLimits.minReceiveAmount,
      dynamicLimits.maxReceiveAmount,
      sendMethod
    ));
  }, [dynamicLimits, sendMethod]);

  const form = useForm<ExchangeFormData>({
    resolver: getDynamicResolver(),
    mode: "onChange",
    defaultValues: {
      sendMethod: sendMethod,
      receiveMethod: receiveMethod,
      sendAmount: sendAmount,
      receiveAmount: receiveAmount,
      exchangeRate: exchangeRate.toString(),
      fullName: savedData.fullName || user?.displayName || "",
      phoneNumber: savedData.phoneNumber || "",
      senderAccount: savedData.senderAccount || "",
      walletAddress: savedData.walletAddress || "",
      rememberDetails: isReminded,
      agreeToTerms: false,
    },
  });

  // Update form resolver when dynamic limits change
  useEffect(() => {
    const newResolver = getDynamicResolver();
    form.trigger(); // Re-validate all fields with new limits
  }, [dynamicLimits, form, getDynamicResolver]);

  // Fetch exchange rate with NO CACHING - always use latest rates
  const { data: rateData, refetch: refetchRate, error: rateError } = useQuery<ExchangeRateResponse>({
    queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`],
    enabled: !!(sendMethod && receiveMethod && sendMethod !== receiveMethod),
    staleTime: 0, // No stale time - always fetch fresh
    gcTime: 0, // No garbage collection time - don't cache
    refetchOnWindowFocus: true, // Always refetch when user focuses
    refetchOnReconnect: true, // Always refetch on reconnect
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    retry: false, // Don't retry on 404 errors
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
    } else if (rateError && sendMethod && receiveMethod && sendMethod !== receiveMethod) {
      // Handle case when no exchange rate is configured
      setExchangeRate(0);
      setRateDisplay(`Exchange rate not configured for ${sendMethod.toUpperCase()} to ${receiveMethod.toUpperCase()}`);
      form.setValue("exchangeRate", "0");
    }
  }, [rateData, rateError, sendMethod, receiveMethod, form, sendAmount]);

  // Calculate dynamic limits using wallet balances and admin settings
  useEffect(() => {
    console.log('Checking balance calculation conditions:', {
      sendCurrencyLimits: !!sendCurrencyLimits,
      receiveCurrencyLimits: !!receiveCurrencyLimits,
      exchangeRate,
      balances,
      receiveMethod
    });

    console.log('CHECKING RATE CONDITIONS:', {
      sendLimits: !!sendCurrencyLimits,
      receiveLimits: !!receiveCurrencyLimits,
      exchangeRate: exchangeRate,
      conditionMet: !!(sendCurrencyLimits && receiveCurrencyLimits && exchangeRate > 0)
    });

    // Ensure we have minimum data for rate-based calculation
    if (sendCurrencyLimits && receiveCurrencyLimits && exchangeRate > 0) {
      // Calculate rate-based minimum first (works with or without balance data)
      const rateBasedMinSend = receiveCurrencyLimits.minAmount / exchangeRate;
      const effectiveMinSend = Math.max(sendCurrencyLimits.minAmount, rateBasedMinSend);
      
      console.log('RATE CALCULATION DEBUG:', {
        receiveMin: receiveCurrencyLimits.minAmount,
        exchangeRate: exchangeRate,
        rateBasedMinSend: rateBasedMinSend.toFixed(2),
        adminSendMin: sendCurrencyLimits.minAmount,
        effectiveMinSend: effectiveMinSend.toFixed(2),
        expectedResult: `${receiveCurrencyLimits.minAmount} ÷ ${exchangeRate} = ${(receiveCurrencyLimits.minAmount / exchangeRate).toFixed(2)}`,
        willUseRateBased: rateBasedMinSend > sendCurrencyLimits.minAmount
      });

      // Handle balance-based maximum calculations only if balance data available
      let effectiveMaxSend = sendCurrencyLimits.maxAmount;
      let effectiveMaxReceive = receiveCurrencyLimits.maxAmount;
      
      if (balances) {
        const currencyMapping: Record<string, string> = {
          'evc': 'EVCPLUS',
          'evcplus': 'EVCPLUS',
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
        
        // Calculate maximum send amount based on available balance and exchange rate
        const balanceBasedMaxSend = receiveBalance / exchangeRate;
        
        // Use the smaller of admin limit or balance-based limit for maximum
        effectiveMaxSend = Math.min(sendCurrencyLimits.maxAmount, balanceBasedMaxSend);
        effectiveMaxReceive = Math.min(receiveCurrencyLimits.maxAmount, receiveBalance);
      }

      const newLimits = {
        minSendAmount: effectiveMinSend,
        maxSendAmount: effectiveMaxSend,
        minReceiveAmount: receiveCurrencyLimits.minAmount,
        maxReceiveAmount: effectiveMaxReceive,
      };

      setDynamicLimits(newLimits);
      console.log(`Rate-based limits applied: Send $${newLimits.minSendAmount.toFixed(2)}-$${newLimits.maxSendAmount.toFixed(2)}, Receive $${newLimits.minReceiveAmount.toFixed(2)}-$${newLimits.maxReceiveAmount.toFixed(2)}`);
      console.log(`APPLYING NEW LIMITS: minSend=${effectiveMinSend.toFixed(2)}, calculated from ${receiveCurrencyLimits.minAmount} ÷ ${exchangeRate} = ${rateBasedMinSend.toFixed(2)}`);
      
      if (balances) {
        const currencyMapping: Record<string, string> = {
          'evc': 'EVCPLUS',
          'evcplus': 'EVCPLUS',
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
        console.log(`Available ${receiveMethod.toUpperCase()} balance: $${receiveBalance}, Rate: ${exchangeRate}`);
        console.log(`RATE CALCULATION: ${receiveCurrencyLimits.minAmount} ÷ ${exchangeRate} = ${rateBasedMinSend.toFixed(2)}, using max(${sendCurrencyLimits.minAmount}, ${rateBasedMinSend.toFixed(2)}) = ${effectiveMinSend.toFixed(2)}`);
      }
    } else {
      // Use admin-configured limits when balance data not available
      if (sendCurrencyLimits && receiveCurrencyLimits && exchangeRate > 0) {
        // Always calculate rate-based minimum send amount using admin settings
        const rateBasedMinSend = receiveCurrencyLimits.minAmount / exchangeRate;
        const effectiveMinSend = Math.max(sendCurrencyLimits.minAmount, rateBasedMinSend);
        
        const adminConfiguredLimits = {
          minSendAmount: effectiveMinSend,
          maxSendAmount: sendCurrencyLimits.maxAmount,
          minReceiveAmount: receiveCurrencyLimits.minAmount,
          maxReceiveAmount: receiveCurrencyLimits.maxAmount,
        };
        setDynamicLimits(adminConfiguredLimits);
        console.log(`Rate-based limits applied (admin-only): Send $${adminConfiguredLimits.minSendAmount.toFixed(2)}-$${adminConfiguredLimits.maxSendAmount.toFixed(2)}, Receive $${adminConfiguredLimits.minReceiveAmount.toFixed(2)}-$${adminConfiguredLimits.maxReceiveAmount.toFixed(2)}`);
      }
    }
  }, [sendCurrencyLimits, receiveCurrencyLimits, exchangeRate, balances, receiveMethod]);

  // Save state whenever any exchange value changes
  useEffect(() => {
    saveExchangeState({
      sendMethod,
      receiveMethod,
      sendAmount,
      receiveAmount
    });
  }, [sendMethod, receiveMethod, sendAmount, receiveAmount]);

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

  // Handle checkbox change for auto-save functionality
  const handleRememberDetailsChange = (checked: boolean) => {
    if (checked && !isReminded) {
      updateSavedField('fullName', form.getValues('fullName'));
      updateSavedField('phoneNumber', form.getValues('phoneNumber'));
      updateSavedField('senderAccount', form.getValues('senderAccount'));
      updateSavedField('walletAddress', form.getValues('walletAddress'));
    }
    
    // Call the toggle function which manages the reminded state
    toggleRemind(form.getValues());
    form.setValue('rememberDetails', checked);
    
    if (checked) {
      toast({
        title: "Details will be remembered",
        description: "Your information will be saved for future exchanges",
      });
    } else {
      toast({
        title: "Details cleared",
        description: "Your saved information has been removed",
      });
    }
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: ExchangeFormData) => {
      const orderData = {
        ...data,
        sendAmount: parseFloat(data.sendAmount),
        receiveAmount: parseFloat(data.receiveAmount),
        exchangeRate: parseFloat(data.exchangeRate),
      };
      
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (order) => {
      setLocation(`/confirmation?orderId=${order.orderId}`);
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
    // Validate exchange rate is configured
    if (!exchangeRate || exchangeRate <= 0) {
      toast({
        title: "Exchange Rate Required",
        description: `No exchange rate configured between ${sendMethod.toUpperCase()} and ${receiveMethod.toUpperCase()}. Please contact admin.`,
        variant: "destructive",
      });
      return;
    }

    // Validate amounts are within limits
    const sendAmountNum = parseFloat(data.sendAmount);
    const receiveAmountNum = parseFloat(data.receiveAmount);

    if (sendAmountNum < dynamicLimits.minSendAmount || sendAmountNum > dynamicLimits.maxSendAmount) {
      toast({
        title: "Invalid Send Amount",
        description: `Send amount must be between $${dynamicLimits.minSendAmount.toFixed(2)} and $${dynamicLimits.maxSendAmount.toLocaleString()}`,
        variant: "destructive",
      });
      form.setFocus("sendAmount");
      return;
    }

    if (receiveAmountNum < dynamicLimits.minReceiveAmount || receiveAmountNum > dynamicLimits.maxReceiveAmount) {
      toast({
        title: "Invalid Receive Amount", 
        description: `Receive amount must be between $${dynamicLimits.minReceiveAmount.toFixed(2)} and $${dynamicLimits.maxReceiveAmount.toLocaleString()}`,
        variant: "destructive",
      });
      form.setFocus("receiveAmount");
      return;
    }

    if (receiveAmountNum < dynamicLimits.minReceiveAmount || receiveAmountNum > dynamicLimits.maxReceiveAmount) {
      toast({
        title: "Invalid Receive Amount",
        description: `Receive amount must be between $${dynamicLimits.minReceiveAmount.toFixed(2)} and $${dynamicLimits.maxReceiveAmount.toLocaleString()}`,
        variant: "destructive",
      });
      form.setFocus("receiveAmount");
      return;
    }

    if (receiveAmountNum < dynamicLimits.minReceiveAmount || receiveAmountNum > dynamicLimits.maxReceiveAmount) {
      toast({
        title: "Invalid Receive Amount",
        description: `Receive amount must be between $${dynamicLimits.minReceiveAmount.toFixed(2)} and $${dynamicLimits.maxReceiveAmount.toLocaleString()}`,
        variant: "destructive",
      });
      form.setFocus("receiveAmount");
      return;
    }

    // Find wallet address for receive method
    const walletKey = receiveMethod.toUpperCase();
    
    if (!walletAddresses || !walletAddresses[walletKey]) {
      toast({
        title: "Wallet Address Missing",
        description: `No wallet address configured for ${receiveMethod.toUpperCase()}. Please contact admin.`,
        variant: "destructive",
      });
      return;
    }
    
    createOrderMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-gray-900">
            Currency Exchange
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            Exchange between multiple payment methods securely and quickly
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Exchange Rate Display */}
              <div className="text-center py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
                <div className="text-lg font-semibold">{rateDisplay}</div>
                {exchangeRate === 0 && (
                  <div className="text-sm opacity-90 mt-1">
                    Contact admin to configure exchange rate
                  </div>
                )}
              </div>

              {/* Send Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowUpCircle className="w-5 h-5 text-red-500" />
                    <Label className="text-lg font-semibold">You Send</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sendMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select 
                            value={sendMethod} 
                            onValueChange={(value) => {
                              setSendMethod(value);
                              field.onChange(value);
                              form.setValue("sendMethod", value);
                              saveExchangeState({ sendMethod: value });
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  <div className="flex items-center gap-2">
                                    <img 
                                      src={method.logo} 
                                      alt={method.label}
                                      className="w-6 h-6 object-contain"
                                    />
                                    {method.label}
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
                          <FormLabel>Amount (USD)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Enter amount"
                              value={sendAmount}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleSendAmountChange(value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Sender Account Field (conditional) */}
                  {["zaad", "sahal", "evc", "edahab", "premier"].includes(sendMethod) && (
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="senderAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {sendMethod === "premier" ? "Premier Bank Account Number" : `${sendMethod.charAt(0).toUpperCase() + sendMethod.slice(1)} Phone Number`}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={sendMethod === "premier" ? "Enter your account number" : "Enter your phone number"}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
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
                  )}
                </CardContent>
              </Card>

              {/* Receive Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowDownCircle className="w-5 h-5 text-green-500" />
                    <Label className="text-lg font-semibold">You Receive</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="receiveMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select 
                            value={receiveMethod} 
                            onValueChange={(value) => {
                              setReceiveMethod(value);
                              field.onChange(value);
                              form.setValue("receiveMethod", value);
                              saveExchangeState({ receiveMethod: value });
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  <div className="flex items-center gap-2">
                                    <img 
                                      src={method.logo} 
                                      alt={method.label}
                                      className="w-6 h-6 object-contain"
                                    />
                                    {method.label}
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
                          <FormLabel>Amount (USD)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Calculated amount"
                              value={receiveAmount}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleReceiveAmountChange(value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-blue-500" />
                    <Label className="text-lg font-semibold">Personal Information</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your full name"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
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

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your phone number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (isReminded) {
                                  updateSavedField('phoneNumber', e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="walletAddress"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Wallet Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your wallet address"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
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

                  {/* Auto-save Checkbox */}
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="rememberDetails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={handleRememberDetailsChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-2">
                              {isReminded ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                              Remember my details for future exchanges
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              {isReminded 
                                ? "Your details will be saved and auto-filled for 7 days" 
                                : "Check this to save your information for future use"}
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mt-4">
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
                          <FormLabel className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            I agree to the terms and conditions
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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