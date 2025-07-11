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
import { ArrowUpCircle, ArrowDownCircle, User, Send, Bell, BellOff, CheckCircle, Save } from "lucide-react";
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
  fullName: z.string().min(1, "Full name is required"),
  email: z.string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  senderAccount: ['zaad', 'sahal', 'evc', 'edahab', 'premier'].includes(sendMethod) 
    ? z.string().min(1, "Sender account is required") 
    : z.string().optional(),
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

  // Fetch admin-configured limits
  const { data: sendCurrencyLimits } = useQuery<{ minAmount: number; maxAmount: number; currency: string }>({
    queryKey: [`/api/currency-limits/${sendMethod}`],
    enabled: !!sendMethod,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Fetch admin-configured limits
  const { data: receiveCurrencyLimits } = useQuery<{ minAmount: number; maxAmount: number; currency: string }>({
    queryKey: [`/api/currency-limits/${receiveMethod}`],
    enabled: !!receiveMethod,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Fetch live wallet addresses from admin dashboard
  const { data: walletAddresses } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/wallet-addresses"],
    staleTime: 30 * 60 * 1000, // 30 minutes - much longer caching
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false, // Disable automatic refetching
    refetchOnReconnect: false,
  });

  // Fetch current balances
  const { data: balances } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/balances"],
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
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
      fullName: savedData.fullName || "",
      email: savedData.email || "",
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

  // Set up WebSocket listeners for real-time admin updates (EVC Plus synchronization)
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}`);

      ws.onopen = () => {
        console.log('WebSocket connected for real-time updates');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle balance updates from admin dashboard
          if (message.type === 'balance_update') {
            console.log('Real-time balance update received:', message.data);
            
            // Force complete cache invalidation for immediate updates
            if (message.data.forceRefresh) {
              queryClient.clear();
              setTimeout(() => {
                queryClient.invalidateQueries();
                queryClient.refetchQueries({ queryKey: ["/api/admin/balances"] });
              }, 100);
            } else {
              // Standard balance update handling
              queryClient.removeQueries({ queryKey: ["/api/admin/balances"] });
              queryClient.refetchQueries({ queryKey: ["/api/admin/balances"] });
            }
          }
          
          // Handle exchange rate updates from admin dashboard  
          if (message.type === 'exchange_rate_update') {
            console.log('Real-time exchange rate update received:', message.data);
            
            // Force complete cache invalidation for immediate new data application
            if (message.data.forceRefresh) {
              queryClient.clear();
              setTimeout(() => {
                queryClient.invalidateQueries();
                // Force immediate refetch of exchange rate data
                queryClient.refetchQueries({ 
                  predicate: (query) => {
                    const key = query.queryKey[0];
                    return typeof key === 'string' && key.includes('/api/exchange-rate');
                  }
                });
              }, 100);
            } else {
              // Standard rate update handling
              queryClient.removeQueries({ 
                predicate: (query) => {
                  const key = query.queryKey[0];
                  return typeof key === 'string' && key.includes('/api/exchange-rate');
                }
              });
            }
          }
          
          // Handle currency limit updates from admin dashboard
          if (message.type === 'currency_limit_update') {
            console.log('Real-time currency limit update received:', message.data);
            
            // Force complete cache invalidation for immediate new data application
            if (message.data.forceRefresh) {
              queryClient.clear();
              setTimeout(() => {
                queryClient.invalidateQueries();
                // Force immediate refetch of currency limit data
                queryClient.refetchQueries({ 
                  predicate: (query) => {
                    const key = query.queryKey[0];
                    return typeof key === 'string' && key.includes('/api/currency-limits');
                  }
                });
              }, 100);
            } else {
              // Standard limit update handling
              queryClient.removeQueries({ 
                predicate: (query) => {
                  const key = query.queryKey[0];
                  return typeof key === 'string' && key.includes('/api/currency-limits');
                }
              });
            }
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      ws.onclose = () => {
        // Reduce reconnection frequency to prevent spam
        setTimeout(connectWebSocket, 10000);
      };

      ws.onerror = () => {
        // Silent error handling to reduce console spam
      };

      return ws;
    };

    const ws = connectWebSocket();
    return () => ws.close();
  }, [queryClient]);

  // Fetch exchange rate
  const { data: rateData, refetch: refetchRate } = useQuery<ExchangeRateResponse>({
    queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`],
    enabled: !!(sendMethod && receiveMethod && sendMethod !== receiveMethod),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Update exchange rate and calculate initial receive amount
  useEffect(() => {
    if (rateData && rateData.rate) {
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
    } else if (sendMethod && receiveMethod && sendMethod !== receiveMethod) {
      // If no rate data but methods are set, trigger a refetch
      refetchRate();
    }
  }, [rateData, sendMethod, receiveMethod, sendAmount, form, refetchRate]);

  // Calculate dynamic limits based on exchange rate and balances
  useEffect(() => {
    if (sendCurrencyLimits && receiveCurrencyLimits && exchangeRate > 0) {
      if (balances) {
        // Map currency names to match admin dashboard balance keys
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
        const balanceBasedMaxSend = receiveBalance / exchangeRate;
        const effectiveMaxSend = Math.min(sendCurrencyLimits.maxAmount, balanceBasedMaxSend);
        const effectiveMaxReceive = Math.min(receiveCurrencyLimits.maxAmount, receiveBalance);

        // Calculate rate-based minimum send amount
        const rateBasedMinSend = receiveCurrencyLimits.minAmount / exchangeRate;
        // Use the higher of admin minimum or rate-based minimum to ensure both requirements are met
        const effectiveMinSend = Math.max(sendCurrencyLimits.minAmount, rateBasedMinSend);

        const newLimits = {
          minSendAmount: effectiveMinSend,
          maxSendAmount: effectiveMaxSend,
          minReceiveAmount: receiveCurrencyLimits.minAmount,
          maxReceiveAmount: effectiveMaxReceive,
        };

        setDynamicLimits(newLimits);
      } else {
        // Use admin-configured limits when balance data not available
        const rateBasedMinSend = receiveCurrencyLimits.minAmount / exchangeRate;
        const effectiveMinSend = Math.max(sendCurrencyLimits.minAmount, rateBasedMinSend);
        
        const adminConfiguredLimits = {
          minSendAmount: effectiveMinSend,
          maxSendAmount: sendCurrencyLimits.maxAmount,
          minReceiveAmount: receiveCurrencyLimits.minAmount,
          maxReceiveAmount: receiveCurrencyLimits.maxAmount,
        };
        setDynamicLimits(adminConfiguredLimits);
      }
    }
  }, [sendCurrencyLimits, receiveCurrencyLimits, exchangeRate, balances, receiveMethod]);

  // Force refresh exchange rate when methods change (once per change)
  useEffect(() => {
    if (sendMethod && receiveMethod && sendMethod !== receiveMethod) {
      refetchRate();
    }
  }, [sendMethod, receiveMethod]);

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
          const { fromCurrency, toCurrency } = message.data;
          
          // Check if this rate update affects current currency pair
          if ((fromCurrency === sendMethod && toCurrency === receiveMethod) ||
              (fromCurrency === receiveMethod && toCurrency === sendMethod)) {
            
            // Force immediate refresh of exchange rate data
            queryClient.invalidateQueries({ 
              queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`] 
            });
            refetchRate();
            
            // Force recalculation of dynamic limits
            setTimeout(() => {
              form.trigger(['sendAmount', 'receiveAmount']);
            }, 200);
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

  // Enhanced toggle remind functionality with complete customer data management
  const handleToggleRemind = () => {
    const currentFormData = form.getValues();
    const dataToSave = {
      fullName: currentFormData.fullName,
      email: currentFormData.email,
      phoneNumber: currentFormData.phoneNumber,
      walletAddress: currentFormData.walletAddress,
      senderAccount: currentFormData.senderAccount,
      sendMethod: sendMethod,
      receiveMethod: receiveMethod,
      sendAmount: sendAmount,
      receiveAmount: receiveAmount,
    };
    
    const newRemindStatus = toggleRemind(dataToSave);
    form.setValue("rememberDetails", newRemindStatus);
    
    if (newRemindStatus) {
      // When turning ON - save ALL customer data and show success message
      toast({
        title: "✅ Data Saved Successfully",
        description: "Your personal details, wallet information, and exchange preferences will be automatically remembered for all future transactions.",
        variant: "default",
      });
    } else {
      // When turning OFF - clear ALL form fields immediately and show confirmation
      form.setValue("fullName", "");
      form.setValue("email", "");
      form.setValue("phoneNumber", "");
      form.setValue("walletAddress", "");
      form.setValue("senderAccount", "");
      
      toast({
        title: "🗑️ Data Cleared",
        description: "All your saved personal details and wallet information have been completely removed from this device.",
        variant: "default",
      });
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: ExchangeFormData) => {
      // Use admin-configured limits for validation
      const sendAmount = parseFloat(data.sendAmount);
      const receiveAmount = parseFloat(data.receiveAmount);
      
      // Validate against current dynamic limits
      if (sendAmount > dynamicLimits.maxSendAmount) {
        throw new Error(`Send amount cannot exceed $${dynamicLimits.maxSendAmount.toLocaleString()}. Please enter an amount less than or equal to $${dynamicLimits.maxSendAmount.toLocaleString()}.`);
      }
      
      if (receiveAmount > dynamicLimits.maxReceiveAmount) {
        throw new Error(`Receive amount cannot exceed $${dynamicLimits.maxReceiveAmount.toLocaleString()}. Please enter an amount less than or equal to $${dynamicLimits.maxReceiveAmount.toLocaleString()}.`);
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
        email: data.email,
        phoneNumber: data.phoneNumber,
        senderAccount: data.senderAccount,
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
    
    // Final validation with admin-configured limits
    const sendAmount = parseFloat(data.sendAmount);
    const receiveAmount = parseFloat(data.receiveAmount);
    
    // Use dynamic limits from admin configuration
    if (sendAmount > dynamicLimits.maxSendAmount) {
      toast({
        title: "Amount Exceeds Limit",
        description: `You can place an order up to $${dynamicLimits.maxSendAmount.toLocaleString()} only. Please enter an amount less than or equal to $${dynamicLimits.maxSendAmount.toLocaleString()}.`,
        variant: "destructive",
      });
      form.setError('sendAmount', {
        type: 'manual',
        message: `Maximum send amount: $${dynamicLimits.maxSendAmount.toLocaleString()}`
      });
      return;
    }
    
    if (receiveAmount > dynamicLimits.maxReceiveAmount) {
      toast({
        title: "Amount Exceeds Limit", 
        description: `You can place an order up to $${dynamicLimits.maxReceiveAmount.toLocaleString()} only. Please enter an amount less than or equal to $${dynamicLimits.maxReceiveAmount.toLocaleString()}.`,
        variant: "destructive",
      });
      form.setError('receiveAmount', {
        type: 'manual',
        message: `Maximum receive amount: $${dynamicLimits.maxReceiveAmount.toLocaleString()}`
      });
      return;
    }
    
    if (sendAmount < dynamicLimits.minSendAmount) {
      toast({
        title: "Amount Below Minimum",
        description: `Minimum send amount is $${dynamicLimits.minSendAmount.toFixed(2)}.`,
        variant: "destructive",
      });
      form.setError('sendAmount', {
        type: 'manual',
        message: `Minimum send amount: $${dynamicLimits.minSendAmount.toFixed(2)}`
      });
      return;
    }
    
    if (receiveAmount < dynamicLimits.minReceiveAmount) {
      toast({
        title: "Amount Below Minimum",
        description: `Minimum receive amount is $${dynamicLimits.minReceiveAmount.toFixed(2)}.`,
        variant: "destructive",
      });
      form.setError('receiveAmount', {
        type: 'manual',
        message: `Minimum receive amount: $${dynamicLimits.minReceiveAmount.toFixed(2)}`
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
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-xs text-center">
                    <span className="text-blue-700 font-medium">Transaction Limits: </span>
                    <span className="text-blue-600">${dynamicLimits.minSendAmount.toFixed(0)} - ${dynamicLimits.maxSendAmount.toLocaleString()} for all payment methods</span>
                  </div>
                </div>
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
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleSendAmountChange(e.target.value);
                              }}
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Minimum: ${dynamicLimits.minSendAmount.toFixed(2)}</span>
                            <span>Maximum: ${dynamicLimits.maxSendAmount.toLocaleString()}</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Sender Account Field - Only for specific payment methods */}
                  {['zaad', 'sahal', 'evc', 'edahab', 'premier'].includes(sendMethod) && (
                    <FormField
                      control={form.control}
                      name="senderAccount"
                      render={({ field }) => {
                        const getSenderAccountLabel = () => {
                          switch (sendMethod) {
                            case 'zaad':
                              return 'Zaad Phone Number *';
                            case 'sahal':
                              return 'Sahal Phone Number *';
                            case 'evc':
                              return 'EVC Plus Phone Number *';
                            case 'edahab':
                              return 'eDahab Phone Number *';
                            case 'premier':
                              return 'Premier Bank Account Number *';
                            default:
                              return 'Sender Account Number *';
                          }
                        };

                        const getSenderAccountPlaceholder = () => {
                          switch (sendMethod) {
                            case 'zaad':
                              return 'Enter your Zaad phone number';
                            case 'sahal':
                              return 'Enter your Sahal phone number';
                            case 'evc':
                              return 'Enter your EVC Plus phone number';
                            case 'edahab':
                              return 'Enter your eDahab phone number';
                            case 'premier':
                              return 'Enter your Premier Bank account number';
                            default:
                              return 'Enter your account number';
                          }
                        };

                        return (
                          <FormItem>
                            <FormLabel>{getSenderAccountLabel()}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={getSenderAccountPlaceholder()}
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleFieldChange('senderAccount', e.target.value);
                                }}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">
                              {sendMethod === 'premier' 
                                ? 'Enter the bank account number you are sending from'
                                : 'Enter the phone number you are sending from'
                              }
                            </p>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}
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
                            <span>Minimum receive amount: ${dynamicLimits.minReceiveAmount.toFixed(2)}</span>
                            <span>Maximum: ${dynamicLimits.maxReceiveAmount.toLocaleString()}</span>
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
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-lg" 
                          : "border-blue-600 text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {isReminded ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Auto-Save ON</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Remember My Details</span>
                        </>
                      )}
                    </Button>
                  </CardTitle>
                  {isReminded && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <p className="text-sm text-green-700 font-medium">
                          Auto-save enabled! Your personal details, wallet information, and exchange preferences will be automatically remembered for all future transactions.
                        </p>
                      </div>
                    </div>
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="example@email.com" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              handleFieldChange('email', e.target.value);
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-blue-600">📧 Email notifications will be sent to this address</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Address / Account Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., TXtU9bwJhg... or account number (NOT email address)" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              handleFieldChange('walletAddress', e.target.value);
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-red-600">⚠️ This is for crypto wallet addresses or account numbers only - NOT your email address</p>
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
                          <FormLabel className="text-sm font-medium text-gray-700">
                            ✅ Remember my details for future transactions
                          </FormLabel>
                          <p className="text-xs text-gray-500">
                            Automatically save your personal information, wallet addresses, and exchange preferences
                          </p>
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
