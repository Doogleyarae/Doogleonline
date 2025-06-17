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
  const queryClient = useQueryClient();

  const [sendMethod, setSendMethod] = useState("trc20");
  const [receiveMethod, setReceiveMethod] = useState("moneygo");
  const [sendAmount, setSendAmount] = useState("1");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [rateDisplay, setRateDisplay] = useState("1 USD = 1.05 EUR");
  const [dynamicLimits, setDynamicLimits] = useState({
    minSendAmount: 5,
    maxSendAmount: 10000,
    minReceiveAmount: 5,
    maxReceiveAmount: 10000,
  });

  const { 
    isReminded, 
    savedData, 
    toggleRemind, 
    updateSavedField,
    forceRemoveData,
    hasSavedData 
  } = useFormDataMemory('exchange');

  // Fetch exchange rate
  const { data: rateData, isLoading: rateLoading } = useQuery<ExchangeRateResponse>({
    queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`, Date.now()],
    enabled: !!(sendMethod && receiveMethod && sendMethod !== receiveMethod),
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch currency limits
  const { data: sendCurrencyLimits, isLoading: sendLimitsLoading } = useQuery<CurrencyLimitsResponse>({
    queryKey: [`/api/currency-limits/${sendMethod}`, Date.now()],
    enabled: !!sendMethod,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: receiveCurrencyLimits, isLoading: receiveLimitsLoading } = useQuery<CurrencyLimitsResponse>({
    queryKey: [`/api/currency-limits/${receiveMethod}`, Date.now()],
    enabled: !!receiveMethod,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch wallet addresses
  const { data: walletAddresses } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/wallet-addresses", Date.now()],
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch balances
  const { data: balances, isLoading: balancesLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/balances", Date.now()],
    staleTime: 0,
    refetchOnMount: true,
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
      fullName: savedData?.fullName || "",
      email: savedData?.email || "",
      phoneNumber: savedData?.phoneNumber || "",
      senderAccount: savedData?.senderAccount || "",
      walletAddress: savedData?.walletAddress || "",
      rememberDetails: isReminded,
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

  // Calculate dynamic limits
  useEffect(() => {
    if (sendCurrencyLimits?.minAmount && receiveCurrencyLimits?.minAmount && exchangeRate > 0) {
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
    }
  }, [sendCurrencyLimits, receiveCurrencyLimits, exchangeRate, balances, receiveMethod]);

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
                    <div className="text-xs text-center mt-1 text-green-600">
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
                          }}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
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
                          }}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
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

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+252 61 234 5678"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
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

              {/* Sender Account (conditional) */}
              {['zaad', 'sahal', 'evc', 'edahab', 'premier'].includes(sendMethod) && (
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
              )}

              <FormField
                control={form.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address / Account Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your wallet address or account number"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          if (isReminded) {
                            updateSavedField('walletAddress', e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="text-xs text-orange-600 mt-1">
                      ⚠️ This is for crypto wallet addresses or account numbers only - NOT your email address
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remember Details and Terms */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="rememberDetails"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            toggleRemind();
                            if (!checked) {
                              form.reset({
                                ...form.getValues(),
                                fullName: "",
                                email: "",
                                phoneNumber: "",
                                senderAccount: "",
                                walletAddress: "",
                              });
                              forceRemoveData();
                              toast({
                                title: "Data Cleared",
                                description: "Your personal information has been cleared for privacy protection.",
                              });
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
                          {isReminded ? (
                            <>
                              <Bell className="w-4 h-4 mr-1 text-blue-600" />
                              Remember my details for future transactions
                            </>
                          ) : (
                            <>
                              <BellOff className="w-4 h-4 mr-1 text-gray-400" />
                              Remember my details for future transactions
                            </>
                          )}
                        </label>
                        <p className="text-xs text-gray-600">
                          {isReminded
                            ? "Your information will be saved securely for 7 days to make future exchanges easier."
                            : "Enable this to save your information for faster future exchanges."
                          }
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
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          I agree to the{" "}
                          <a href="/terms" className="text-blue-600 hover:underline">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                          </a>{" "}
                          *
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                disabled={createOrderMutation.isPending || exchangeRate === 0}
              >
                <Send className="w-5 h-5 mr-2" />
                {createOrderMutation.isPending ? "Processing..." : "Submit Exchange Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}