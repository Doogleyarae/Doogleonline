import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useFormDataMemory } from "@/hooks/use-form-data-memory";
import { formatAmount } from "@/lib/utils";

const paymentMethods = [
  { value: "zaad", label: "Zaad" },
  { value: "sahal", label: "Sahal" },
  { value: "evc", label: "EVC Plus" },
  { value: "edahab", label: "eDahab" },
  { value: "premier", label: "Premier Bank" },
  { value: "moneygo", label: "MoneyGo" },
  { value: "trc20", label: "TRC20" },
  { value: "peb20", label: "PEB20" },
  { value: "trx", label: "TRX" },
  { value: "usdc", label: "USDC" }
];

const exchangeSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phoneNumber: z.string().min(1, "Phone number required"),
  sendMethod: z.string().min(1, "Select send method"),
  receiveMethod: z.string().min(1, "Select receive method"),
  sendAmount: z.string().min(1, "Enter amount to send"),
  senderAccount: z.string().optional(),
  walletAddress: z.string().min(1, "Wallet address required"),
  remindMe: z.boolean().default(false)
});

type ExchangeForm = z.infer<typeof exchangeSchema>;

export default function Exchange() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rate, setRate] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const { savedData, saveFormData, toggleRemind } = useFormDataMemory("exchange");

  const form = useForm<ExchangeForm>({
    resolver: zodResolver(exchangeSchema),
    defaultValues: {
      fullName: savedData?.fullName || "",
      email: savedData?.email || "",
      phoneNumber: savedData?.phoneNumber || "",
      sendMethod: savedData?.sendMethod || "trc20",
      receiveMethod: savedData?.receiveMethod || "moneygo",
      sendAmount: savedData?.sendAmount || "",
      senderAccount: savedData?.senderAccount || "",
      walletAddress: savedData?.walletAddress || "",
      remindMe: savedData?.isReminded || false
    }
  });

  const sendMethod = form.watch("sendMethod");
  const receiveMethod = form.watch("receiveMethod");
  const sendAmount = form.watch("sendAmount");
  const remindMe = form.watch("remindMe");

  // Auto-save form data when fields change
  useEffect(() => {
    const subscription = form.watch((data) => {
      saveFormData(data);
    });
    return () => subscription.unsubscribe();
  }, [form, saveFormData]);

  // Fetch exchange rate
  const { data: rateData } = useQuery({
    queryKey: [`/api/exchange-rate/${sendMethod}/${receiveMethod}`, Date.now()],
    enabled: !!sendMethod && !!receiveMethod && sendMethod !== receiveMethod,
    refetchInterval: 1000,
    staleTime: 0
  });

  useEffect(() => {
    if (rateData && typeof rateData === 'object' && 'rate' in rateData) {
      setRate(rateData.rate as number);
    }
  }, [rateData]);

  // Calculate receive amount
  const receiveAmount = sendAmount && !isNaN(Number(sendAmount)) && rate 
    ? (Number(sendAmount) * rate).toFixed(2)
    : "";

  // Check if sender account is required
  const requiresSenderAccount = ["zaad", "sahal", "evc", "edahab", "premier"].includes(sendMethod);
  
  // Get dynamic label for sender account
  const getSenderAccountLabel = () => {
    if (sendMethod === "premier") return "Premier Bank Account Number";
    return `${paymentMethods.find(m => m.value === sendMethod)?.label} Phone Number`;
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: ExchangeForm) => {
      const response = await apiRequest("POST", "/api/orders", {
        ...data,
        receiveAmount
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (remindMe) {
        toggleRemind(form.getValues());
      } else {
        localStorage.removeItem("formData_exchange");
      }
      setLocation(`/confirmation?orderId=${data.orderId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ExchangeForm) => {
    if (sendMethod === receiveMethod) {
      toast({
        title: "Error",
        description: "Send and receive methods must be different",
        variant: "destructive"
      });
      return;
    }
    createOrderMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Currency Exchange
          </h1>
          <p className="text-gray-600">
            Fast and secure exchange in 3 simple steps
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Exchange Form</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Personal Information</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your full name" />
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
                            <Input {...field} placeholder="+252 XX XXX XXXX" />
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="your@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Exchange Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Exchange Details</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sendMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Send From</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
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
                      name="receiveMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receive To</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
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
                  </div>

                  {requiresSenderAccount && (
                    <FormField
                      control={form.control}
                      name="senderAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{getSenderAccountLabel()}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter account number/phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sendAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Send Amount ($)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              onChange={(e) => {
                                field.onChange(e);
                                setIsCalculating(true);
                                setTimeout(() => setIsCalculating(false), 500);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>Receive Amount ($)</FormLabel>
                      <div className="relative">
                        <Input 
                          value={isCalculating ? "Calculating..." : receiveAmount}
                          disabled
                          className="bg-gray-50"
                        />
                        {isCalculating && (
                          <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                      {rate !== 1 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Rate: 1 USD = {rate} USD
                        </p>
                      )}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receiving Wallet/Account Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter wallet address or account number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Data Storage */}
                <div className="border-t pt-4">
                  <FormField
                    control={form.control}
                    name="remindMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              toggleRemind(form.getValues());
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Remember my information</FormLabel>
                          <p className="text-sm text-gray-500">
                            Save form data for 7 days to speed up future exchanges
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      Create Exchange Order
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}