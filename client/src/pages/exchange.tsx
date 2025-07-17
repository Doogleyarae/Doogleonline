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
import { ArrowUpCircle, ArrowDownCircle, Send, Bell, BellOff, Eye, EyeOff, DollarSign } from "lucide-react";
import { useFormDataMemory } from "@/hooks/use-form-data-memory";
import { useAutoSave } from "@/hooks/use-auto-save";
import { formatAmount } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { useLanguage } from "@/contexts/language-context";

// Import logo files
import zaadLogo from "../assets/zaad.png";
import golisLogo from "../assets/golis.png";
import evcLogo from "../assets/evc.png";
import edahabLogo from "../assets/edahab.png";
import premierLogo from "../assets/premier.png";
import moneygoLogo from "../assets/moneygo.png";
import trc20Logo from "../assets/trc20.png";
import peb20Logo from "../assets/peb20.png";
import trxLogo from "../assets/trx.png";
import usdcLogo from "../assets/usdc.png";

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

const paymentMethods = [
  { value: "zaad", label: "Zaad", logo: zaadLogo },
  { value: "sahal", label: "Golis", logo: golisLogo },
  { value: "evc", label: "EVC Plus", logo: evcLogo },
  { value: "edahab", label: "eDahab", logo: edahabLogo },
  { value: "premier", label: "Premier Bank", logo: premierLogo },
  { value: "moneygo", label: "MoneyGo", logo: moneygoLogo },
  { value: "trc20", label: "TRC20 (USDT)", logo: trc20Logo },
  { value: "peb20", label: "PEB20", logo: peb20Logo },
  { value: "trx", label: "TRX", logo: trxLogo },
  { value: "usdc", label: "USDC", logo: usdcLogo }
];

const specialExclusions: Record<string, string[]> = {
  sahal: ['sahal', 'evc'], // 'evc' is the value for EVC Plus
  evc: ['evc', 'sahal', 'zaad'],
  zaad: ['zaad', 'evc', 'sahal'],
};

const createExchangeFormSchema = (
  minSendAmount: number = 5,
  maxSendAmount: number = 10000,
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
      if (amount < minSendAmount) return { message: `Minimum allowed amount is $${minSendAmount.toFixed(2)}` };
      if (amount > maxSendAmount) return { message: `Maximum allowed amount is $${maxSendAmount.toLocaleString()}` };
      return { message: "Invalid amount" };
    }
  ),
  receiveAmount: z.string().refine(
    (val) => {
      if (!val || val === "") return false;
      const amount = parseFloat(val);
      return !isNaN(amount) && amount > 0;
    },
    (val) => {
      if (!val || val === "") return { message: "Amount is required" };
      const amount = parseFloat(val);
      if (isNaN(amount)) return { message: "Please enter a valid number" };
      if (amount <= 0) return { message: "Amount must be greater than 0" };
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
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and privacy policy"),
});

type ExchangeFormData = z.infer<ReturnType<typeof createExchangeFormSchema>>;

// Enhanced storage system for complete page state
const EXCHANGE_COMPLETE_STATE_KEY = 'exchange-complete-state';

// Legacy functions for backward compatibility (deprecated - use auto-save system instead)
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
  try {
  localStorage.setItem(EXCHANGE_COMPLETE_STATE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save legacy exchange state:', error);
  }
}

function loadCompleteExchangeState() {
  try {
    const raw = localStorage.getItem(EXCHANGE_COMPLETE_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load legacy exchange state:', error);
    return null;
  }
}

function clearCompleteExchangeState() {
  try {
  localStorage.removeItem(EXCHANGE_COMPLETE_STATE_KEY);
  } catch (error) {
    console.warn('Failed to clear legacy exchange state:', error);
  }
}

export default function Exchange() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setLanguage } = useLanguage();

  useEffect(() => {
    setLanguage('en');
  }, [setLanguage]);

  // Enhanced auto-save system
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [sendMethod, setSendMethod] = useState("trc20");
  const [receiveMethod, setReceiveMethod] = useState("moneygo");
  const [sendAmount, setSendAmount] = useState("1");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [rateDisplay, setRateDisplay] = useState("1 USD = 1.05 EUR");

  // Field clearing state for bidirectional calculation
  const [isClearingFields, setIsClearingFields] = useState(false);

  const [dynamicLimits, setDynamicLimits] = useState({
    minSendAmount: 5,
    maxSendAmount: 10000,
    minReceiveAmount: 5,
    maxReceiveAmount: 10000,
  });

  // Create form data object for auto-save
  const formData = {
      fullName,
      email,
      senderAccount,
      walletAddress,
    sendMethod,
    receiveMethod,
    sendAmount,
    receiveAmount,
      exchangeRate,
      rateDisplay,
      dynamicLimits,
  };

  // Use enhanced auto-save hook
  const { 
    isReminded, 
    isLoaded,
    hasSavedData,
    savedData,
    saveField,
    saveImmediately,
    restoreAll,
    clearAll
  } = useAutoSave(formData, {
    formKey: 'exchange',
    debounceMs: 200, // Faster auto-save
    saveOnChange: true,
    saveOnBlur: true,
    restoreOnMount: true
  });

  // Load saved data when it becomes available (for cross-page persistence)
  useEffect(() => {
    if (isLoaded && hasSavedData && savedData) {
      try {
        console.log('🔄 Loading saved data from auto-save system:', savedData);
        
        // Restore all saved data to form state with safe fallbacks
        // EXCLUDE amount fields to prevent auto-restoration
        if (savedData.fullName && typeof savedData.fullName === 'string') setFullName(savedData.fullName);
        if (savedData.email && typeof savedData.email === 'string') setEmail(savedData.email);
        if (savedData.senderAccount && typeof savedData.senderAccount === 'string') setSenderAccount(savedData.senderAccount);
        if (savedData.walletAddress && typeof savedData.walletAddress === 'string') setWalletAddress(savedData.walletAddress);
        if (savedData.sendMethod && typeof savedData.sendMethod === 'string') setSendMethod(savedData.sendMethod);
        if (savedData.receiveMethod && typeof savedData.receiveMethod === 'string') setReceiveMethod(savedData.receiveMethod);
        // DO NOT restore sendAmount and receiveAmount to prevent auto-restoration
        if (savedData.exchangeRate && typeof savedData.exchangeRate === 'number') setExchangeRate(savedData.exchangeRate);
        if (savedData.rateDisplay && typeof savedData.rateDisplay === 'string') setRateDisplay(savedData.rateDisplay);
        if (savedData.dynamicLimits && typeof savedData.dynamicLimits === 'object') setDynamicLimits(savedData.dynamicLimits);
      } catch (error) {
        console.error('Error loading saved data:', error);
        // Clear corrupted data
        clearAll();
      }
    }
  }, [isLoaded, hasSavedData, savedData, clearAll]);



  // Enhanced save function for immediate saving using new auto-save system
  const saveFormDataImmediately = useCallback((field: string, value: any) => {
    try {
      // Don't save empty amount fields to prevent auto-restoration
      if ((field === 'sendAmount' || field === 'receiveAmount') && (!value || value.trim() === "")) {
        console.log(`🚫 Not saving empty ${field} to prevent auto-restoration`);
        return;
      }
      
      console.log(`💾 Immediately saving ${field}:`, value);
      saveField(field as keyof typeof formData, value);
    } catch (error) {
      console.error(`Error saving field ${field}:`, error);
    }
  }, [saveField]);





  // Fetch exchange rate
  const { data: rateData, isLoading: rateLoading } = useQuery<ExchangeRateResponse>({
    queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`],
    enabled: !!(sendMethod && receiveMethod && sendMethod !== receiveMethod),
    staleTime: 0, // Always fetch fresh data when currency changes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Fetch currency limits
  const { data: sendCurrencyLimits, isLoading: sendLimitsLoading } = useQuery<CurrencyLimitsResponse>({
    queryKey: [`/api/currency-limits/${sendMethod}`],
    enabled: !!sendMethod,
    staleTime: 0, // Always fetch fresh data when currency changes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const { data: receiveCurrencyLimits, isLoading: receiveLimitsLoading } = useQuery<CurrencyLimitsResponse>({
    queryKey: [`/api/currency-limits/${receiveMethod}`],
    enabled: !!receiveMethod,
    staleTime: 0, // Always fetch fresh data when currency changes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Fetch wallet addresses
  const { data: walletAddressesData } = useQuery<{ wallets: Record<string, string> }>({
    queryKey: ["/api/wallet-addresses"],
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const walletAddresses = walletAddressesData?.wallets || {};

  // State for balance management
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const adminToken = sessionStorage.getItem("adminToken");
    setIsAdmin(!!adminToken);
  }, []);

  // Fetch balances
  const { data: balanceData, refetch: refetchBalances } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/balances"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/balances", {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          const safeData: Record<string, number> = {};
          Object.entries(data).forEach(([k, v]) => {
            const num = typeof v === 'number' ? v : Number(v);
            safeData[k] = isNaN(num) ? 0 : num;
          });
          setBalances(safeData);
          setEditAmounts(Object.fromEntries(Object.entries(safeData).map(([k, v]) => [k, v.toString()])));
          return safeData;
        }
        return {};
      } catch (error) {
        console.error("Failed to fetch balances:", error);
        return {};
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    enabled: isAdmin, // Only fetch if admin
  });

  // Handle balance edit
  const handleEditAmount = (currency: string, value: string) => {
    setEditAmounts((prev) => ({ ...prev, [currency]: value }));
  };

  // Handle balance save
  const handleSaveBalance = async (currency: string) => {
    setSaving((prev) => ({ ...prev, [currency]: true }));
    try {
      const response = await fetch("/api/admin/balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currency, amount: editAmounts[currency] })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalances((prev) => ({ ...prev, [currency]: data.amount }));
        setEditAmounts((prev) => ({ ...prev, [currency]: data.amount.toString() }));
        toast({
          title: "Balance Updated",
          description: `${currency.toUpperCase()} balance updated to $${data.amount}`,
        });
        refetchBalances();
      } else {
        throw new Error("Failed to update balance");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to update ${currency} balance`,
        variant: "destructive",
      });
    } finally {
      setSaving((prev) => ({ ...prev, [currency]: false }));
    }
  };

  // Fetch system status
  const { data: systemStatus } = useQuery<{ status: 'on' | 'off' }>({
    queryKey: ["/api/admin/system-status"],
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Fetch public balances for user display
  const { data: publicBalanceData, isLoading: publicBalanceLoading, refetch: refetchPublicBalances } = useQuery<{ balances: Record<string, number>; status: string; systemStatus: string }>({
    queryKey: ["/api/balances"],
    refetchInterval: 3000, // Refresh every 3 seconds for immediate updates
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Invalidate and refetch data when currency selections change
  useEffect(() => {
    if (sendMethod && receiveMethod) {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/balances"] });
      queryClient.invalidateQueries({ queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${sendMethod}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${receiveMethod}`] });
      
      // Refetch public balances immediately
      refetchPublicBalances();
    }
  }, [sendMethod, receiveMethod, queryClient, refetchPublicBalances]);

  // Trigger initial data fetch on mount
  useEffect(() => {
    // Force initial fetch of all data when component mounts
    if (sendMethod && receiveMethod) {
      queryClient.invalidateQueries({ queryKey: ["/api/balances"] });
      queryClient.invalidateQueries({ queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${sendMethod}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${receiveMethod}`] });
    }
  }, []); // Empty dependency array - only run on mount

  const form = useForm<ExchangeFormData>({
    resolver: zodResolver(createExchangeFormSchema(
      dynamicLimits.minSendAmount, 
      dynamicLimits.maxSendAmount,
      sendMethod
    )),
    mode: "onChange",
    defaultValues: {
      sendMethod: "trc20",
      receiveMethod: "moneygo",
      sendAmount: "",
      receiveAmount: "",
      exchangeRate: "0",
      fullName: "",
      email: "",
      senderAccount: "",
      walletAddress: "",
      agreeToTerms: false,
    },
  });

  // Only restore saved data on first mount - ONCE ONLY
  useEffect(() => {
    if (isLoaded && hasSavedData && savedData) {
      try {
        // Only restore if fields are completely empty (user hasn't typed yet)
        const currentValues = form.getValues();
        
        if (savedData.fullName && !currentValues.fullName) {
          form.setValue("fullName", savedData.fullName);
        }
        if (savedData.email && !currentValues.email) {
          form.setValue("email", savedData.email);
        }
        if (savedData.senderAccount && !currentValues.senderAccount) {
          form.setValue("senderAccount", savedData.senderAccount);
        }
        if (savedData.walletAddress && !currentValues.walletAddress) {
          form.setValue("walletAddress", savedData.walletAddress);
        }
        if (savedData.sendMethod && !currentValues.sendMethod) {
          form.setValue("sendMethod", savedData.sendMethod);
        }
        if (savedData.receiveMethod && !currentValues.receiveMethod) {
          form.setValue("receiveMethod", savedData.receiveMethod);
        }
        // NEVER restore amount fields automatically
      } catch (error) {
        console.error('Error restoring saved data:', error);
        clearAll();
      }
    }
    // Only run on mount - no dependencies that could cause re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update form schema when limits change - but don't reset form values
  useEffect(() => {
    if (isClearingFields) {
      return;
    }
    form.clearErrors();
    form.trigger();
  }, [dynamicLimits.minSendAmount, dynamicLimits.maxSendAmount, sendMethod, form, isClearingFields]);

  // REMOVED: The problematic useEffect that was updating form values from state
  // This was causing the jumping/bouncing behavior

  // Update exchange rate when data is fetched - but don't interfere with user input
  useEffect(() => {
    if (rateData?.rate && !rateLoading) {
      const rate = rateData.rate;
      setExchangeRate(rate);
      form.setValue("exchangeRate", rate.toString());
      setRateDisplay(`1 ${sendMethod.toUpperCase()} = ${rate} ${receiveMethod.toUpperCase()}`);
      
      // Only provide initial calculation if both fields are empty and not clearing
      if (!isClearingFields) {
        const currentSendAmount = form.getValues("sendAmount");
        const currentReceiveAmount = form.getValues("receiveAmount");
        
        if (currentSendAmount && parseFloat(currentSendAmount) > 0 && (!currentReceiveAmount || currentReceiveAmount === "")) {
          const amount = parseFloat(currentSendAmount);
        const converted = amount * rate;
        const convertedAmount = formatAmount(converted);
        setReceiveAmount(convertedAmount);
        form.setValue("receiveAmount", convertedAmount);
        }
      }
    } else if (!rateData && !rateLoading) {
      setExchangeRate(0);
      setRateDisplay("Rate not available");
    }
  }, [rateData, rateLoading, sendMethod, receiveMethod, form, isClearingFields]);

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

    // Apply balance limits if available and system is ON
    if (balances && typeof balances === 'object' && systemStatus?.status === 'on') {
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
  }, [sendCurrencyLimits, receiveCurrencyLimits, exchangeRate, balances, receiveMethod, systemStatus]);

  useEffect(() => {
    calculateDynamicLimits();
  }, [calculateDynamicLimits]);

  // Exchange rate changes no longer trigger automatic recalculation
  // Users can manually enter any amount they want

  // Handle amount calculations - Bidirectional auto-calculation with debouncing
  const [sendAmountTimeout, setSendAmountTimeout] = useState<NodeJS.Timeout | null>(null);
  const [receiveAmountTimeout, setReceiveAmountTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSendAmountChange = (value: string) => {
    setSendAmount(value);
    
    // Clear existing timeout
    if (sendAmountTimeout) {
      clearTimeout(sendAmountTimeout);
    }
    
    // If the field is being cleared, immediately clear the other field and stop
    if (!value || value.trim() === "") {
      setIsClearingFields(true);
      setReceiveAmount("");
      form.setValue("receiveAmount", "");
      // Clear auto-save data for amount fields to prevent restoration
      try {
        saveField('sendAmount', "");
        saveField('receiveAmount', "");
      } catch (error) {
        console.error('Error clearing auto-save data:', error);
      }
      setIsClearingFields(false);
      return;
    }
    
    // Set new timeout for debounced calculation
    const timeoutId = setTimeout(() => {
      // Don't calculate if we're currently clearing fields
      if (isClearingFields) {
        return;
      }
      
      // Get the current send amount value (not the captured one)
      const currentSendAmount = form.getValues("sendAmount");
      
      // Only calculate if the field still has a value and is not empty
      if (exchangeRate > 0 && currentSendAmount && currentSendAmount.trim() !== "") {
        const amount = parseFloat(currentSendAmount);
        if (!isNaN(amount) && amount > 0) {
        const converted = amount * exchangeRate;
        const convertedAmount = formatAmount(converted);
        setReceiveAmount(convertedAmount);
        form.setValue("receiveAmount", convertedAmount);
        } else {
          // Clear receive amount if send amount is invalid
          setReceiveAmount("");
          form.setValue("receiveAmount", "");
      }
      } else {
        // Clear receive amount if send amount is empty
        setReceiveAmount("");
        form.setValue("receiveAmount", "");
      }
      
      // Trigger form validation
      form.trigger(["sendAmount", "receiveAmount"]);
    }, 300); // 300ms delay for smooth typing experience
    
    setSendAmountTimeout(timeoutId);
  };

  const handleReceiveAmountChange = (value: string) => {
    setReceiveAmount(value);
    
    // Clear existing timeout
    if (receiveAmountTimeout) {
      clearTimeout(receiveAmountTimeout);
    }
    
    // If the field is being cleared, immediately clear the other field and stop
    if (!value || value.trim() === "") {
      setIsClearingFields(true);
      setSendAmount("");
      form.setValue("sendAmount", "");
      // Clear auto-save data for amount fields to prevent restoration
      try {
        saveField('sendAmount', "");
        saveField('receiveAmount', "");
      } catch (error) {
        console.error('Error clearing auto-save data:', error);
      }
      setIsClearingFields(false);
      return;
    }
    
    // Set new timeout for debounced calculation
    const timeoutId = setTimeout(() => {
      // Don't calculate if we're currently clearing fields
      if (isClearingFields) {
        return;
      }
      
      // Get the current receive amount value (not the captured one)
      const currentReceiveAmount = form.getValues("receiveAmount");
      
      // Only calculate if the field still has a value and is not empty
      if (exchangeRate > 0 && currentReceiveAmount && currentReceiveAmount.trim() !== "") {
        const amount = parseFloat(currentReceiveAmount);
        if (!isNaN(amount) && amount > 0) {
        const converted = amount / exchangeRate;
        const convertedAmount = formatAmount(converted);
        setSendAmount(convertedAmount);
        form.setValue("sendAmount", convertedAmount);
        } else {
          // Clear send amount if receive amount is invalid
          setSendAmount("");
          form.setValue("sendAmount", "");
    }
      } else {
        // Clear send amount if receive amount is empty
        setSendAmount("");
        form.setValue("sendAmount", "");
      }
      
      // Trigger form validation
      form.trigger(["sendAmount", "receiveAmount"]);
    }, 300); // 300ms delay for smooth typing experience
    
    setReceiveAmountTimeout(timeoutId);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (sendAmountTimeout) clearTimeout(sendAmountTimeout);
      if (receiveAmountTimeout) clearTimeout(receiveAmountTimeout);
    };
  }, [sendAmountTimeout, receiveAmountTimeout]);

  // Order creation mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: ExchangeFormData) => {
      const sendAmount = parseFloat(data.sendAmount);
      const receiveAmount = parseFloat(data.receiveAmount);
      
      if (sendAmount > dynamicLimits.maxSendAmount) {
        throw new Error(`Send amount cannot exceed $${dynamicLimits.maxSendAmount.toLocaleString()}`);
      }
      
      if (sendAmount < dynamicLimits.minSendAmount) {
        throw new Error(`Send amount must be at least $${dynamicLimits.minSendAmount.toFixed(2)}`);
      }
      
      // Receive amount validation removed - flexible input allowed

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
      sessionStorage.setItem("currentOrder", JSON.stringify(order));
      
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
    
    // Check if system is closed
    if (systemStatus?.status === 'off') {
      toast({
        title: "System Closed",
        description: "Exchange services are temporarily unavailable. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
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
      // WebSocket connected
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle balance updates from admin dashboard
        if (message.type === 'balance_update') {
          
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
        // WebSocket message parsing error
      }
    };

    ws.onerror = (error) => {
      // WebSocket error
    };

    ws.onclose = () => {
      // WebSocket disconnected
    };

    return () => {
      ws.close();
    };
  }, [queryClient, sendMethod, receiveMethod]);

  // Listen for admin updates and refetch exchange rate instantly
  useEffect(() => {
    const handleAdminUpdate = (event: CustomEvent) => {
      const message = event.detail;
      
      // Only refetch if the update is for exchange rates, currency limits, balances, or system status
      if (
        message?.type === 'exchange_rate_update' ||
        message?.type === 'currency_limit_update' ||
        message?.type === 'balance_update' ||
        message?.type === 'system_status_update'
      ) {
        // Force immediate cache invalidation and refetch
        queryClient.invalidateQueries({ queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${sendMethod}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/currency-limits/${receiveMethod}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/balances"] });
        queryClient.invalidateQueries({ queryKey: ["/api/balances"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/system-status"] });
        
        // Force immediate refetch for instant updates
        queryClient.refetchQueries({ queryKey: ["/api/balances"] });
        queryClient.refetchQueries({ queryKey: ["/api/admin/balances"] });
        
        // Immediately refetch public balances to get latest system status
        refetchPublicBalances();
        
        // For balance updates, show a subtle notification
        if (message?.type === 'balance_update' && message.data?.currency) {
          console.log(`🔄 Balance updated: ${message.data.currency} = $${message.data.amount}`);
        }
      }
    };
    window.addEventListener('admin-update', handleAdminUpdate as EventListener);
    return () => {
      window.removeEventListener('admin-update', handleAdminUpdate as EventListener);
    };
  }, [queryClient, sendMethod, receiveMethod, refetchPublicBalances]);

  // Helper to get exclusions for a selected value
  function getExclusions(selected: string) {
    return specialExclusions[selected] || [selected];
  }

  // Get display balance based on system status (admin)
  const getDisplayBalance = (currency: string) => {
    if (systemStatus?.status === 'off') {
      return 0;
    }
    
    // Use lowercase currency keys to match database storage
    const balanceKey = currency.toLowerCase();
    return balances?.[balanceKey] || 0;
  };

  // Get public display balance for users
  const getPublicDisplayBalance = (currency: string) => {
    if (!publicBalanceData?.balances) {
      return 0;
    }
    
    // Use lowercase currency keys to match database storage
    const balanceKey = currency.toLowerCase();
    return publicBalanceData.balances[balanceKey] || 0;
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
                {/* System Status Indicator */}
                {publicBalanceData?.systemStatus === 'off' && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-md">
                    <div className="flex items-center justify-center">
                      <span className="text-sm font-medium text-red-800">
                        ⚠️ System is currently offline. All balances show $0.
                      </span>
                    </div>
                  </div>
                )}
                
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
                                saveFormDataImmediately('sendMethod', value);
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
                                        <img src={method.logo} alt={method.label} className="w-6 h-6 mr-2 object-contain" />
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
                          <FormItem>
                            <FormLabel className="text-lg font-semibold text-gray-700 flex items-center">
                              Amount to Send
                            </FormLabel>
                          <FormControl>
                            <Input
                                type="text"
                              placeholder="0.00"
                              className="h-12 text-lg"
                                autoComplete="off"
                                spellCheck={false}
                                inputMode="decimal"
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                handleSendAmountChange(e.target.value);
                                  saveFormDataImmediately('sendAmount', e.target.value);
                              }}
                            />
                          </FormControl>
                            {/* Bidirectional amount input - auto-calculates receive amount */}
                            <div className="text-xs text-gray-500 mt-1">
                              Enter amount to send - receive amount will be calculated automatically
                            </div>
                            <FormMessage />
                          </FormItem>
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
                                saveFormDataImmediately('receiveMethod', value);
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
                                        <img src={method.logo} alt={method.label} className="w-6 h-6 mr-2 object-contain" />
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
                          <FormItem>
                            <FormLabel className="text-lg font-semibold text-gray-700 flex items-center">
                              Amount to Receive
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="0.00"
                                className="h-12 text-lg"
                                autoComplete="off"
                                spellCheck={false}
                                inputMode="decimal"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  handleReceiveAmountChange(e.target.value);
                                  saveFormDataImmediately('receiveAmount', e.target.value);
                                }}
                              />
                            </FormControl>
                            {/* Bidirectional amount input - auto-calculates send amount */}
                            <div className="text-xs text-gray-500 mt-1">
                              Enter amount to receive - send amount will be calculated automatically
                            </div>
                            <FormMessage />
                          </FormItem>
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
                                saveFormDataImmediately('fullName', e.target.value);
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
                                saveFormDataImmediately('senderAccount', e.target.value);
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
                              saveFormDataImmediately('email', e.target.value);
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
                            ? 'MoneyGo Address *'
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
                              saveFormDataImmediately('walletAddress', e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Terms and Submit */}
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
                  

                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}