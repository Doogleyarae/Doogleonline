import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { History, Edit, Plus, RefreshCw } from "lucide-react";

interface ExchangeRate {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  updatedAt: string;
}

interface ExchangeRateHistory {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  oldRate: string | null;
  newRate: string;
  changedBy: string;
  changeReason: string | null;
  createdAt: string;
}

const paymentMethods = [
  { value: "zaad", label: "Zaad" },
  { value: "sahal", label: "Sahal" },
  { value: "evc", label: "EVC Plus" },
  { value: "edahab", label: "eDahab" },
  { value: "premier", label: "Premier Bank" },
  { value: "moneygo", label: "MoneyGo" },
  { value: "trc20", label: "TRC20 (USDT)" },
  { value: "peb20", label: "PEB20" },
  { value: "trx", label: "TRX" },
  { value: "usdc", label: "USDC" }
];

export default function AdminExchangeRates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFrom, setSelectedFrom] = useState("");
  const [selectedTo, setSelectedTo] = useState("");
  const [newRate, setNewRate] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<ExchangeRateHistory[]>([]);

  // BALANCE MANAGEMENT STATE
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Fetch all exchange rates
  const { data: rates, isLoading: ratesLoading } = useQuery<ExchangeRate[]>({
    queryKey: ["/api/admin/exchange-rates"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch exchange rate history
  const { data: history, isLoading: historyLoading } = useQuery<ExchangeRateHistory[]>({
    queryKey: ["/api/admin/exchange-rate-history"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch balances on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/balances");
        const data = await res.json();
        // Ensure all values are numbers
        const safeData: Record<string, number> = {};
        Object.entries(data).forEach(([k, v]) => {
          const num = typeof v === 'number' ? v : Number(v);
          safeData[k] = isNaN(num) ? 0 : num;
        });
        setBalances(safeData);
        setEditAmounts(Object.fromEntries(Object.entries(safeData).map(([k, v]) => [k, v.toString()])));
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to fetch balances", variant: "destructive" });
      }
    })();
  }, []);

  // Update exchange rate mutation
  const updateRateMutation = useMutation({
    mutationFn: async (data: {
      fromCurrency: string;
      toCurrency: string;
      rate: string;
      changedBy: string;
      changeReason?: string;
    }) => {
      const response = await apiRequest("POST", "/api/admin/exchange-rates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exchange-rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exchange-rate-history"] });
      toast({
        title: "Rate Updated",
        description: `Exchange rate updated successfully: ${selectedFrom} → ${selectedTo} = ${newRate}`,
      });
      setIsUpdateDialogOpen(false);
      setNewRate("");
      setChangeReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update exchange rate",
        variant: "destructive",
      });
    },
  });

  // Handle edit
  const handleEditAmount = (currency: string, value: string) => {
    setEditAmounts((prev) => ({ ...prev, [currency]: value }));
  };

  // Handle save
  const handleSave = async (currency: string) => {
    setSaving((prev) => ({ ...prev, [currency]: true }));
    try {
      const res = await apiRequest("POST", "/api/admin/balances", { currency, amount: editAmounts[currency] });
      const data = await res.json();
      setBalances((prev) => ({ ...prev, [currency]: data.amount }));
      setEditAmounts((prev) => ({ ...prev, [currency]: data.amount.toString() }));
      toast({ title: "Balance Updated", description: `${currency.toUpperCase()} balance updated to $${data.amount}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || `Failed to update ${currency} balance`, variant: "destructive" });
    } finally {
      setSaving((prev) => ({ ...prev, [currency]: false }));
    }
  };

  // Generate all possible currency pairs
  const generateAllPairs = () => {
    const pairs: { from: string; to: string }[] = [];
    for (let i = 0; i < paymentMethods.length; i++) {
      for (let j = 0; j < paymentMethods.length; j++) {
        if (i !== j) {
          pairs.push({
            from: paymentMethods[i].value.toUpperCase(),
            to: paymentMethods[j].value.toUpperCase(),
          });
        }
      }
    }
    return pairs;
  };

  const allPairs = generateAllPairs();

  // Get current rate for a pair
  const getCurrentRate = (from: string, to: string) => {
    return rates?.find(rate => 
      rate.fromCurrency === from && rate.toCurrency === to
    );
  };

  // Get history for a pair
  const getHistoryForPair = (from: string, to: string) => {
    return history?.filter(h => 
      h.fromCurrency === from && h.toCurrency === to
    ) || [];
  };

  const handleUpdateRate = () => {
    if (!selectedFrom || !selectedTo || !newRate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateRateMutation.mutate({
      fromCurrency: selectedFrom,
      toCurrency: selectedTo,
      rate: newRate,
      changedBy: "admin", // You can enhance this with actual user authentication
      changeReason: changeReason || undefined,
    });
  };

  const openUpdateDialog = (rate: ExchangeRate) => {
    setSelectedRate(rate);
    setSelectedFrom(rate.fromCurrency);
    setSelectedTo(rate.toCurrency);
    setNewRate(rate.rate);
    setIsUpdateDialogOpen(true);
  };

  const openHistoryDialog = (from: string, to: string) => {
    const pairHistory = getHistoryForPair(from, to);
    setSelectedHistory(pairHistory);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exchange Rate Management</h1>
          <p className="text-gray-600 mt-2">Manage all currency exchange rates and view history</p>
        </div>
        <Button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/exchange-rates"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/exchange-rate-history"] });
          }}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* BALANCE MANAGEMENT SECTION */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            Balance Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead>Available Balance</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((method) => {
                const code = method.value.toUpperCase();
                return (
                  <TableRow key={code}>
                    <TableCell>{method.label} ({code})</TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={editAmounts[code] ?? ""}
                        onChange={e => handleEditAmount(code, e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        inputMode="decimal"
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleSave(code)}
                        disabled={saving[code] || editAmounts[code] === undefined || editAmounts[code] === balances[code]?.toString()}
                      >
                        {saving[code] ? "Saving..." : "Save"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add New Rate */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add New Exchange Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="fromCurrency">From Currency</Label>
              <Select value={selectedFrom} onValueChange={setSelectedFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value.toUpperCase()}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="toCurrency">To Currency</Label>
              <Select value={selectedTo} onValueChange={setSelectedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value.toUpperCase()}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                type="text"
                placeholder="1.000000"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                inputMode="decimal"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleUpdateRate}
                disabled={!selectedFrom || !selectedTo || !newRate || updateRateMutation.isPending}
                className="w-full"
              >
                {updateRateMutation.isPending ? "Adding..." : "Add Rate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Exchange Rates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allPairs.map((pair) => {
          const currentRate = getCurrentRate(pair.from, pair.to);
          const pairHistory = getHistoryForPair(pair.from, pair.to);
          
          return (
            <Card key={`${pair.from}-${pair.to}`} className="relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {pair.from} → {pair.to}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {paymentMethods.find(m => m.value.toUpperCase() === pair.from)?.label} to{" "}
                      {paymentMethods.find(m => m.value.toUpperCase() === pair.to)?.label}
                    </p>
                  </div>
                  <Badge variant={currentRate ? "default" : "secondary"}>
                    {currentRate ? "Active" : "Not Set"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {currentRate ? (
                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-green-600">
                      1 {pair.from} = {parseFloat(currentRate.rate).toFixed(6)} {pair.to}
                    </div>
                    <div className="text-sm text-gray-500">
                      Last updated: {format(new Date(currentRate.updatedAt), "MMM dd, yyyy HH:mm")}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUpdateDialog(currentRate)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openHistoryDialog(pair.from, pair.to)}
                          >
                            <History className="w-4 h-4 mr-1" />
                            History ({pairHistory.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Rate History: {pair.from} → {pair.to}</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-96 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Old Rate</TableHead>
                                  <TableHead>New Rate</TableHead>
                                  <TableHead>Changed By</TableHead>
                                  <TableHead>Reason</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pairHistory.map((h: any) => (
                                  <TableRow key={h.id}>
                                    <TableCell>
                                      {format(new Date(h.createdAt), "MMM dd, yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell>
                                      {h.oldRate ? parseFloat(h.oldRate).toFixed(6) : "N/A"}
                                    </TableCell>
                                    <TableCell className="font-bold">
                                      {parseFloat(h.newRate).toFixed(6)}
                                    </TableCell>
                                    <TableCell>{h.changedBy}</TableCell>
                                    <TableCell>
                                      {h.changeReason || "No reason provided"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-lg text-gray-500">No rate configured</div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedFrom(pair.from);
                        setSelectedTo(pair.to);
                        setNewRate("");
                        setIsUpdateDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Rate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Update Rate Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRate ? "Update Exchange Rate" : "Add Exchange Rate"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Currency</Label>
                <div className="text-lg font-semibold">{selectedFrom}</div>
              </div>
              <div>
                <Label>To Currency</Label>
                <div className="text-lg font-semibold">{selectedTo}</div>
              </div>
            </div>
            <div>
              <Label htmlFor="newRate">New Rate</Label>
              <Input
                id="newRate"
                type="text"
                placeholder="1.000000"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor="changeReason">Change Reason (Optional)</Label>
              <Textarea
                id="changeReason"
                placeholder="Why are you changing this rate?"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRate}
                disabled={!newRate || updateRateMutation.isPending}
              >
                {updateRateMutation.isPending ? "Updating..." : "Update Rate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 