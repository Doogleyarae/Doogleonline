import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/queryClient";
import { ArrowUpCircle, ArrowDownCircle, User, Send, Bell, BellOff } from "lucide-react";
import { useFormDataMemory } from "@/hooks/use-form-data-memory";

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

const paymentMethods = [
  { value: "zaad", label: "Zaad" },
  { value: "sahal", label: "Sahal" },
  { value: "evc", label: "EVC Plus" },
  { value: "edahab", label: "eDahab" },
  { value: "premier", label: "Premier Bank" },
  { value: "moneygo", label: "MoneyGo" },
  { value: "trx", label: "TRX" },
  { value: "trc20", label: "TRC20" },
  { value: "peb20", label: "PEB20" },
  { value: "usdc", label: "USDC" },
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
  const [sendMethod, setSendMethod] = useState("trc20");
  const [receiveMethod, setReceiveMethod] = useState("moneygo");
  const [sendAmount, setSendAmount] = useState("1");
  const [receiveAmount, setReceiveAmount] = useState("");
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

  // Fetch currency-specific limits for the selected pair
  const { data: currencyLimits } = useQuery<CurrencyLimitsResponse>({
    queryKey: [`/api/currency-limits/${sendMethod}/${receiveMethod}`],
    enabled: !!(sendMethod && receiveMethod && sendMethod !== receiveMethod),
  });

  const form = useForm<ExchangeFormData>({
    resolver: zodResolver(createExchangeFormSchema(
      dynamicLimits.minSendAmount, 
      dynamicLimits.maxSendAmount,
      dynamicLimits.minReceiveAmount,
      dynamicLimits.maxReceiveAmount
    )),
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

  // Calculate dynamic limits when exchange rate or currency limits change
  useEffect(() => {
    if (currencyLimits && exchangeRate > 0) {
      const baseLimits = {
        minAmount: currencyLimits.minAmount,
        maxAmount: currencyLimits.maxAmount,
      };

      // Calculate dynamic limits based on exchange rate
      // Send limits: base limits from database
      // Receive limits: calculated from send limits using exchange rate
      const newLimits = {
        minSendAmount: baseLimits.minAmount,
        maxSendAmount: baseLimits.maxAmount,
        minReceiveAmount: baseLimits.minAmount * exchangeRate,
        maxReceiveAmount: baseLimits.maxAmount * exchangeRate,
      };

      setDynamicLimits(newLimits);
      setFormKey(prev => prev + 1); // Force form re-render with new limits
    }
  }, [currencyLimits, exchangeRate]);

  // Update form values when state changes
  useEffect(() => {
    form.setValue("sendMethod", sendMethod);
    form.setValue("receiveMethod", receiveMethod);
    form.setValue("sendAmount", sendAmount);
    form.setValue("receiveAmount", receiveAmount);
  }, [sendMethod, receiveMethod, sendAmount, receiveAmount, form]);

  // Restore saved data when component mounts or saved data changes
  useEffect(() => {
    if (isReminded && hasSavedData) {
      form.setValue("fullName", savedData.fullName || "");
      form.setValue("phoneNumber", savedData.phoneNumber || "");
      form.setValue("walletAddress", savedData.walletAddress || "");
      form.setValue("rememberDetails", true);
    }
  }, [isReminded, savedData, hasSavedData, form]);

  // Fetch exchange rate when methods change
  const { data: rateData } = useQuery<ExchangeRateResponse>({
    queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`],
    enabled: !!(sendMethod && receiveMethod && sendMethod !== receiveMethod),
  });

  // Update exchange rate and calculate initial receive amount
  useEffect(() => {
    if (rateData) {
      const rate = rateData.rate;
      setExchangeRate(rate);
      form.setValue("exchangeRate", rate.toString());
      setRateDisplay(`1 ${sendMethod.toUpperCase()} = ${rate} ${receiveMethod.toUpperCase()}`);
      
      // Calculate initial receive amount based on current send amount
      if (sendAmount) {
        const amount = parseFloat(sendAmount) || 0;
        const convertedAmount = (amount * rate).toFixed(2);
        setReceiveAmount(convertedAmount);
        form.setValue("receiveAmount", convertedAmount);
      }
    }
  }, [rateData, sendMethod, receiveMethod, form, sendAmount]);

  // Handle amount calculations with prevention of loops
  const handleSendAmountChange = (value: string) => {
    setSendAmount(value);
    
    // Auto-calculate receive amount when send amount changes
    if (!calculatingFromReceive && exchangeRate > 0) {
      setCalculatingFromSend(true);
      
      if (value && value !== "") {
        const amount = parseFloat(value) || 0;
        if (amount >= 0) {
          const convertedAmount = (amount * exchangeRate).toFixed(2);
          setReceiveAmount(convertedAmount);
          form.setValue("receiveAmount", convertedAmount);
        }
      } else {
        // Clear receive amount when send amount is empty
        setReceiveAmount("");
        form.setValue("receiveAmount", "");
      }
      
      setTimeout(() => setCalculatingFromSend(false), 10);
    }
  };

  const handleReceiveAmountChange = (value: string) => {
    setReceiveAmount(value);
    
    // Auto-calculate send amount when receive amount changes
    if (!calculatingFromSend && exchangeRate > 0) {
      setCalculatingFromReceive(true);
      
      if (value && value !== "") {
        const amount = parseFloat(value) || 0;
        if (amount >= 0) {
          const convertedAmount = (amount / exchangeRate).toFixed(2);
          setSendAmount(convertedAmount);
          form.setValue("sendAmount", convertedAmount);
        }
      } else {
        // Clear send amount when receive amount is empty
        setSendAmount("");
        form.setValue("sendAmount", "");
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
      const response = await apiRequest("POST", "/api/orders", {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        walletAddress: data.walletAddress,
        sendMethod: data.sendMethod,
        receiveMethod: data.receiveMethod,
        sendAmount: data.sendAmount,
        receiveAmount: data.receiveAmount,
        exchangeRate: data.exchangeRate,
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
                {currencyLimits && exchangeRate > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-blue-700 font-medium">Send Limits:</span>
                        <div className="text-blue-600">
                          ${dynamicLimits.minSendAmount.toFixed(2)} - ${dynamicLimits.maxSendAmount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Receive Limits:</span>
                        <div className="text-blue-600">
                          ${dynamicLimits.minReceiveAmount.toFixed(2)} - ${dynamicLimits.maxReceiveAmount.toLocaleString()}
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
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
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
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
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
