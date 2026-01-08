import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTop50Cryptocurrencies } from '@/hooks/useQueries';
import { TrendingUp, Target, Calendar, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { format, addMonths } from 'date-fns';

type MarketCondition = 'bull' | 'bear' | 'sideways';

interface SimulationResult {
  month: number;
  date: string;
  value: number;
  invested: number;
}

export function PortfolioSimulator() {
  const [startAmount, setStartAmount] = useState('1000');
  const [targetAmount, setTargetAmount] = useState('10000');
  const [monthlyContribution, setMonthlyContribution] = useState('100');
  const [timeHorizon, setTimeHorizon] = useState('36');
  const [marketCondition, setMarketCondition] = useState<MarketCondition>('bull');
  const [selectedCrypto, setSelectedCrypto] = useState('internet-computer');
  
  const { data: cryptos, isLoading: cryptosLoading } = useTop50Cryptocurrencies();

  // Calculate simulation data
  const simulationData = useMemo<SimulationResult[]>(() => {
    const start = parseFloat(startAmount) || 1000;
    const monthly = parseFloat(monthlyContribution) || 100;
    const months = parseInt(timeHorizon) || 36;
    
    // Market condition growth rates (monthly)
    const growthRates: Record<MarketCondition, number> = {
      bull: 0.08,      // 8% monthly growth (aggressive bull market)
      sideways: 0.02,  // 2% monthly growth (stable market)
      bear: -0.03,     // -3% monthly growth (bear market)
    };
    
    const monthlyGrowth = growthRates[marketCondition];
    const results: SimulationResult[] = [];
    let currentValue = start;
    let totalInvested = start;
    
    for (let month = 0; month <= months; month++) {
      results.push({
        month,
        date: format(addMonths(new Date(), month), 'MMM yyyy'),
        value: currentValue,
        invested: totalInvested,
      });
      
      if (month < months) {
        // Apply growth
        currentValue = currentValue * (1 + monthlyGrowth);
        // Add monthly contribution
        currentValue += monthly;
        totalInvested += monthly;
      }
    }
    
    return results;
  }, [startAmount, monthlyContribution, timeHorizon, marketCondition]);

  const finalValue = simulationData[simulationData.length - 1]?.value || 0;
  const totalInvested = simulationData[simulationData.length - 1]?.invested || 0;
  const totalReturn = finalValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  const target = parseFloat(targetAmount) || 10000;
  const targetReached = finalValue >= target;
  const monthsToTarget = simulationData.findIndex(d => d.value >= target);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Portfolio Growth Simulator</h2>
        <p className="text-muted-foreground">
          Simulate your investment growth from ${startAmount} to ${targetAmount} goal
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Simulation Parameters
            </CardTitle>
            <CardDescription>Adjust your investment scenario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-amount">Starting Investment</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="start-amount"
                  type="number"
                  value={startAmount}
                  onChange={(e) => setStartAmount(e.target.value)}
                  className="pl-9"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-amount">Target Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="target-amount"
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="pl-9"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-contribution">Monthly Contribution</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="monthly-contribution"
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  className="pl-9"
                  min="0"
                  step="50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-horizon">Time Horizon (Months)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="time-horizon"
                  type="number"
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(e.target.value)}
                  className="pl-9"
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-condition">Market Condition</Label>
              <Select value={marketCondition} onValueChange={(v) => setMarketCondition(v as MarketCondition)}>
                <SelectTrigger id="market-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bull">Bull Market (High Growth)</SelectItem>
                  <SelectItem value="sideways">Sideways Market (Stable)</SelectItem>
                  <SelectItem value="bear">Bear Market (Decline)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crypto-select">Cryptocurrency</Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto} disabled={cryptosLoading}>
                <SelectTrigger id="crypto-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cryptosLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : cryptos ? (
                    cryptos.slice(0, 20).map((crypto) => (
                      <SelectItem key={crypto.id} value={crypto.id}>
                        {crypto.name} ({crypto.symbol.toUpperCase()})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="internet-computer">Internet Computer (ICP)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>Projected portfolio growth over time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-sm font-medium text-muted-foreground">Final Value</div>
                <div className="mt-1 text-2xl font-bold">${finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Invested</div>
                <div className="mt-1 text-2xl font-bold">${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Return</div>
                <div className={`mt-1 text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {totalReturn >= 0 ? '+' : ''}${totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-sm font-medium text-muted-foreground">ROI</div>
                <div className={`mt-1 text-2xl font-bold ${returnPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Target Status */}
            {targetReached ? (
              <Alert className="border-green-500/50 bg-green-500/10">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  <strong>Target Reached!</strong> You'll reach your ${target.toLocaleString()} goal in{' '}
                  {monthsToTarget > 0 ? `${monthsToTarget} months` : 'less than a month'}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  With current parameters, you'll reach ${finalValue.toLocaleString()} in {timeHorizon} months.
                  Adjust your contributions or time horizon to reach your ${target.toLocaleString()} goal.
                </AlertDescription>
              </Alert>
            )}

            {/* Growth Chart */}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload as SimulationResult;
                      return (
                        <div className="rounded-lg border bg-popover p-3 shadow-md">
                          <p className="text-xs font-medium text-muted-foreground">{data.date}</p>
                          <p className="text-sm font-bold">
                            Portfolio: <span className="text-primary">${data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </p>
                          <p className="text-xs">
                            Invested: ${data.invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <ReferenceLine 
                    y={target} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="3 3"
                    label={{ value: `Target: $${target.toLocaleString()}`, position: 'right', fill: 'hsl(var(--destructive))', fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                    name="Portfolio Value"
                  />
                  <Line
                    type="monotone"
                    dataKey="invested"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Total Invested"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
