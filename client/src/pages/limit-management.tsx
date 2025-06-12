import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings } from "lucide-react";

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

const limitSchema = z.object({
  minAmount: z.number().min(0.01, "Minimum amount must be greater than 0"),
  maxAmount: z.number().min(1, "Maximum amount must be at least 1"),
}).refine((data) => data.maxAmount > data.minAmount, {
  message: "Maximum amount must be greater than minimum amount",
  path: ["maxAmount"],
});

type LimitFormData = z.infer<typeof limitSchema>;

interface CurrencyLimit {
  minAmount: number;
  maxAmount: number;
  from: string;
  to: string;
}

export default function LimitManagement() {
  const [fromCurrency, setFromCurrency] = useState<string>("");
  const [toCurrency, setToCurrency] = useState<string>("");
  const [currentLimits, setCurrentLimits] = useState<CurrencyLimit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LimitFormData>({
    resolver: zodResolver(limitSchema),
    defaultValues: {
      minAmount: 5,
      maxAmount: 10000,
    },
  });

  // Fetch current limits when both currencies are selected
  const fetchLimits = async () => {
    if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/currency-limits/${fromCurrency}/${toCurrency}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentLimits(data);
        form.reset({
          minAmount: data.minAmount,
          maxAmount: data.maxAmount,
        });
      } else {
        setCurrentLimits(null);
        form.reset({
          minAmount: 5,
          maxAmount: 10000,
        });
      }
    } catch (error) {
      console.error('Error fetching limits:', error);
      setCurrentLimits(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, [fromCurrency, toCurrency]);

  const updateLimitsMutation = useMutation({
    mutationFn: async (data: LimitFormData) => {
      const response = await fetch(`/api/admin/currency-limits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          minAmount: data.minAmount,
          maxAmount: data.maxAmount,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update limits');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Currency limits updated successfully",
      });
      fetchLimits(); // Refresh the current limits
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update currency limits",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LimitFormData) => {
    if (!fromCurrency || !toCurrency) {
      toast({
        title: "Error",
        description: "Please select both currencies",
        variant: "destructive",
      });
      return;
    }
    if (fromCurrency === toCurrency) {
      toast({
        title: "Error",
        description: "Please select different currencies",
        variant: "destructive",
      });
      return;
    }
    updateLimitsMutation.mutate(data);
  };

  const availableToCurrencies = paymentMethods.filter(
    method => method.value !== fromCurrency
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Limit Management</h1>
          <p className="text-gray-600">Set minimum and maximum limits for currency pairs</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Currency Pair Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Currency Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromCurrency">From Currency</Label>
                <Select value={fromCurrency} onValueChange={(value) => {
                  setFromCurrency(value);
                  if (value === toCurrency) {
                    setToCurrency("");
                  }
                }}>
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

              <div className="space-y-2">
                <Label htmlFor="toCurrency">To Currency</Label>
                <Select 
                  value={toCurrency} 
                  onValueChange={setToCurrency}
                  disabled={!fromCurrency}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select to currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableToCurrencies.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current Limits Display */}
            {fromCurrency && toCurrency && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Current Limits: {paymentMethods.find(m => m.value === fromCurrency)?.label} → {paymentMethods.find(m => m.value === toCurrency)?.label}
                </h3>
                {isLoading ? (
                  <p className="text-blue-700">Loading current limits...</p>
                ) : currentLimits ? (
                  <p className="text-blue-700">
                    Min: ${currentLimits.minAmount.toFixed(2)} | Max: ${currentLimits.maxAmount.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-blue-700">Using default limits: Min: $5.00 | Max: $10,000</p>
                )}
              </div>
            )}

            {/* Limit Setting Form */}
            {fromCurrency && toCurrency && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="5.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="10000.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateLimitsMutation.isPending}
                  >
                    {updateLimitsMutation.isPending ? "Updating..." : "Update Limits"}
                  </Button>
                </form>
              </Form>
            )}

            {!fromCurrency || !toCurrency ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Select both currencies to manage their limits</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}