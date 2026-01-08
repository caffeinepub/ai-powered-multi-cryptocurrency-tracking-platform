import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTop100Cryptocurrencies, useICPPrice } from '@/hooks/useQueries';
import { Target, PieChart, TrendingUp, DollarSign, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Allocation {
  id: string;
  cryptoId: string;
  cryptoName: string;
  cryptoSymbol: string;
  percentage: number;
  amount: number;
}

export function InvestmentPlanner() {
  const [totalInvestment, setTotalInvestment] = useState('5000');
  const [allocations, setAllocations] = useState<Allocation[]>([
    { id: '1', cryptoId: 'internet-computer', cryptoName: 'Internet Computer', cryptoSymbol: 'ICP', percentage: 100, amount: 5000 }
  ]);
  const [selectedCrypto, setSelectedCrypto] = useState('');

  const { data: cryptos, isLoading: cryptosLoading } = useTop100Cryptocurrencies();
  const { data: icpPrice } = useICPPrice();

  const totalPercentage = useMemo(() => {
    return allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
  }, [allocations]);

  const isValidAllocation = totalPercentage === 100;

  const handleAddAllocation = () => {
    if (!selectedCrypto) {
      toast.error('Please select a cryptocurrency');
      return;
    }

    const crypto = cryptos?.find(c => c.id === selectedCrypto);
    if (!crypto) return;

    const existingAllocation = allocations.find(a => a.cryptoId === selectedCrypto);
    if (existingAllocation) {
      toast.error('This cryptocurrency is already in your allocation');
      return;
    }

    const newAllocation: Allocation = {
      id: Date.now().toString(),
      cryptoId: crypto.id,
      cryptoName: crypto.name,
      cryptoSymbol: crypto.symbol,
      percentage: 0,
      amount: 0,
    };

    setAllocations([...allocations, newAllocation]);
    setSelectedCrypto('');
  };

  const handleRemoveAllocation = (id: string) => {
    setAllocations(allocations.filter(a => a.id !== id));
  };

  const handlePercentageChange = (id: string, value: string) => {
    const percentage = parseFloat(value) || 0;
    const investment = parseFloat(totalInvestment) || 0;
    const amount = (investment * percentage) / 100;

    setAllocations(allocations.map(a => 
      a.id === id ? { ...a, percentage, amount } : a
    ));
  };

  const handleAutoBalance = () => {
    const count = allocations.length;
    if (count === 0) return;

    const percentageEach = 100 / count;
    const investment = parseFloat(totalInvestment) || 0;

    setAllocations(allocations.map(a => ({
      ...a,
      percentage: percentageEach,
      amount: (investment * percentageEach) / 100,
    })));

    toast.success('Portfolio balanced equally across all assets');
  };

  const projectedReturns = useMemo(() => {
    if (!cryptos) return null;

    const returns = allocations.map(alloc => {
      const crypto = cryptos.find(c => c.id === alloc.cryptoId);
      if (!crypto) return { ...alloc, return24h: 0, projectedValue: alloc.amount };

      const return24h = (alloc.amount * crypto.price_change_percentage_24h) / 100;
      const projectedValue = alloc.amount + return24h;

      return { ...alloc, return24h, projectedValue };
    });

    const totalReturn = returns.reduce((sum, r) => sum + r.return24h, 0);
    const totalValue = returns.reduce((sum, r) => sum + r.projectedValue, 0);
    const returnPercentage = parseFloat(totalInvestment) > 0 
      ? (totalReturn / parseFloat(totalInvestment)) * 100 
      : 0;

    return { returns, totalReturn, totalValue, returnPercentage };
  }, [allocations, cryptos, totalInvestment]);

  if (cryptosLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Investment Planner</h2>
          <p className="text-muted-foreground">Plan and optimize your cryptocurrency portfolio</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Investment Planner</h2>
        <p className="text-muted-foreground">Plan and optimize your cryptocurrency portfolio allocation</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Portfolio Setup
            </CardTitle>
            <CardDescription>Configure your investment allocation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="total-investment">Total Investment</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="total-investment"
                  type="number"
                  value={totalInvestment}
                  onChange={(e) => {
                    setTotalInvestment(e.target.value);
                    const investment = parseFloat(e.target.value) || 0;
                    setAllocations(allocations.map(a => ({
                      ...a,
                      amount: (investment * a.percentage) / 100,
                    })));
                  }}
                  className="pl-9"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Add Cryptocurrency</Label>
              <div className="flex gap-2">
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select crypto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cryptos?.slice(0, 20).map((crypto) => (
                      <SelectItem key={crypto.id} value={crypto.id}>
                        {crypto.name} ({crypto.symbol.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddAllocation} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={handleAutoBalance} variant="outline" className="w-full">
              <PieChart className="mr-2 h-4 w-4" />
              Auto-Balance Portfolio
            </Button>

            {/* Allocation Status */}
            <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Total Allocation</span>
                <Badge variant={isValidAllocation ? 'default' : 'destructive'}>
                  {totalPercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={totalPercentage} className="h-2" />
              {!isValidAllocation && (
                <p className="text-xs text-destructive">
                  Allocation must equal 100%
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Allocation Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
            <CardDescription>Manage your cryptocurrency distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Allocations List */}
            <div className="space-y-3">
              {allocations.map((alloc) => {
                const crypto = cryptos?.find(c => c.id === alloc.cryptoId);
                return (
                  <div key={alloc.id} className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          {crypto && (
                            <img src={crypto.image} alt={crypto.name} className="h-8 w-8 rounded-full" />
                          )}
                          <div>
                            <div className="font-semibold">{alloc.cryptoName}</div>
                            <div className="text-xs text-muted-foreground uppercase">{alloc.cryptoSymbol}</div>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor={`percentage-${alloc.id}`} className="text-xs">
                              Percentage
                            </Label>
                            <Input
                              id={`percentage-${alloc.id}`}
                              type="number"
                              value={alloc.percentage}
                              onChange={(e) => handlePercentageChange(alloc.id, e.target.value)}
                              min="0"
                              max="100"
                              step="1"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Amount</Label>
                            <div className="flex h-9 items-center rounded-md border bg-background px-3 text-sm">
                              ${alloc.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAllocation(alloc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {allocations.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No allocations yet. Add cryptocurrencies to start planning your portfolio.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Projected Returns */}
            {projectedReturns && isValidAllocation && (
              <div className="space-y-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                <h3 className="text-lg font-semibold">24h Projected Performance</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-xs font-medium text-muted-foreground">Current Value</div>
                    <div className="mt-1 text-xl font-bold">
                      ${parseFloat(totalInvestment).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-xs font-medium text-muted-foreground">Projected Value</div>
                    <div className="mt-1 text-xl font-bold">
                      ${projectedReturns.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-xs font-medium text-muted-foreground">Expected Return</div>
                    <div className={`mt-1 text-xl font-bold ${projectedReturns.totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {projectedReturns.totalReturn >= 0 ? '+' : ''}${projectedReturns.totalReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      <span className="ml-2 text-sm">
                        ({projectedReturns.returnPercentage >= 0 ? '+' : ''}{projectedReturns.returnPercentage.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
