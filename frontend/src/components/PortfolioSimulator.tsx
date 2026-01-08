import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTop100Cryptocurrencies } from '@/hooks/useQueries';
import { TrendingUp, Target, Calendar, DollarSign, AlertCircle, Lightbulb, Sparkles } from 'lucide-react';
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
  Area,
  AreaChart,
} from 'recharts';
import { format, addMonths } from 'date-fns';

type MarketCondition = 'conservative' | 'moderate' | 'aggressive';

interface SimulationResult {
  month: number;
  date: string;
  value: number;
  invested: number;
  optimistic: number;
  pessimistic: number;
}

interface MarketInsight {
  avgGrowth: number;
  volatility: number;
  topPerformers: number;
  recommendation: string;
}

export function PortfolioSimulator() {
  const [startAmount, setStartAmount] = useState(1000);
  const [targetAmount, setTargetAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [timeHorizon, setTimeHorizon] = useState(36);
  const [marketCondition, setMarketCondition] = useState<MarketCondition>('moderate');
  
  const { data: cryptos, isLoading: cryptosLoading } = useTop100Cryptocurrencies(60000);

  // Calculate market insights from top 100 cryptos
  const marketInsights = useMemo<MarketInsight>(() => {
    if (!cryptos || cryptos.length === 0) {
      return {
        avgGrowth: 0,
        volatility: 0,
        topPerformers: 0,
        recommendation: 'Loading market data...',
      };
    }

    const validCryptos = cryptos.filter(c => c.price_change_percentage_24h !== null && c.price_change_percentage_24h !== undefined);
    const avgGrowth = validCryptos.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / validCryptos.length;
    
    const growthValues = validCryptos.map(c => Math.abs(c.price_change_percentage_24h || 0));
    const volatility = growthValues.reduce((sum, val) => sum + val, 0) / growthValues.length;
    
    const topPerformers = validCryptos.filter(c => (c.price_change_percentage_24h || 0) > 5).length;

    let recommendation = '';
    if (avgGrowth > 3) {
      recommendation = 'Strong bullish market. Consider aggressive growth strategy.';
    } else if (avgGrowth > 0) {
      recommendation = 'Moderate market conditions. Balanced approach recommended.';
    } else if (avgGrowth > -3) {
      recommendation = 'Slight bearish trend. Conservative strategy advised.';
    } else {
      recommendation = 'Strong bearish market. Focus on capital preservation.';
    }

    return { avgGrowth, volatility, topPerformers, recommendation };
  }, [cryptos]);

  // Calculate simulation data with realistic projections
  const simulationData = useMemo<SimulationResult[]>(() => {
    // Base growth rates adjusted by market insights
    const baseRates: Record<MarketCondition, number> = {
      conservative: 0.015,  // 1.5% monthly
      moderate: 0.04,       // 4% monthly
      aggressive: 0.07,     // 7% monthly
    };
    
    // Adjust growth rate based on real market conditions
    const marketAdjustment = marketInsights.avgGrowth / 100;
    const monthlyGrowth = baseRates[marketCondition] + (marketAdjustment * 0.3);
    
    const results: SimulationResult[] = [];
    let currentValue = startAmount;
    let totalInvested = startAmount;
    
    // Optimistic and pessimistic scenarios
    const optimisticGrowth = monthlyGrowth * 1.5;
    const pessimisticGrowth = monthlyGrowth * 0.5;
    let optimisticValue = startAmount;
    let pessimisticValue = startAmount;
    
    for (let month = 0; month <= timeHorizon; month++) {
      results.push({
        month,
        date: format(addMonths(new Date(), month), 'MMM yy'),
        value: Math.round(currentValue),
        invested: Math.round(totalInvested),
        optimistic: Math.round(optimisticValue),
        pessimistic: Math.round(pessimisticValue),
      });
      
      if (month < timeHorizon) {
        // Apply growth with slight randomness for realism
        const randomFactor = 1 + (Math.random() - 0.5) * 0.1;
        currentValue = currentValue * (1 + monthlyGrowth * randomFactor);
        optimisticValue = optimisticValue * (1 + optimisticGrowth * randomFactor);
        pessimisticValue = pessimisticValue * (1 + pessimisticGrowth * randomFactor);
        
        // Add monthly contribution
        currentValue += monthlyContribution;
        optimisticValue += monthlyContribution;
        pessimisticValue += monthlyContribution;
        totalInvested += monthlyContribution;
      }
    }
    
    return results;
  }, [startAmount, monthlyContribution, timeHorizon, marketCondition, marketInsights]);

  const finalValue = simulationData[simulationData.length - 1]?.value || 0;
  const totalInvested = simulationData[simulationData.length - 1]?.invested || 0;
  const totalReturn = finalValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  const targetReached = finalValue >= targetAmount;
  const monthsToTarget = simulationData.findIndex(d => d.value >= targetAmount);

  // Smart suggestions based on market data
  const suggestions = useMemo(() => {
    const suggestions: string[] = [];
    
    if (!targetReached && finalValue < targetAmount * 0.8) {
      const neededIncrease = Math.ceil((targetAmount - finalValue) / timeHorizon);
      suggestions.push(`Increase monthly contribution by $${neededIncrease} to reach your goal.`);
    }
    
    if (marketInsights.avgGrowth > 2 && marketCondition === 'conservative') {
      suggestions.push('Market is bullish. Consider switching to moderate or aggressive strategy.');
    }
    
    if (marketInsights.avgGrowth < -2 && marketCondition === 'aggressive') {
      suggestions.push('Market is bearish. Consider switching to conservative strategy to protect capital.');
    }
    
    if (timeHorizon < 24 && !targetReached) {
      suggestions.push('Extend time horizon to 36+ months for better compound growth.');
    }
    
    if (monthlyContribution < startAmount * 0.1) {
      suggestions.push('Increase monthly contributions to at least 10% of starting amount for optimal growth.');
    }

    return suggestions;
  }, [targetReached, finalValue, targetAmount, timeHorizon, marketInsights, marketCondition, monthlyContribution, startAmount]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Portfolio Growth Simulator</h2>
        <p className="text-muted-foreground">
          Intelligent investment projections powered by live market data
        </p>
      </div>

      {/* Market Insights Banner */}
      {!cryptosLoading && marketInsights.avgGrowth !== 0 && (
        <Alert className="border-primary/50 bg-primary/5 animate-fade-in">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="flex flex-col gap-2">
              <div className="font-semibold">Live Market Insights</div>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <span>
                  Avg 24h Growth: <strong className={marketInsights.avgGrowth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {marketInsights.avgGrowth > 0 ? '+' : ''}{marketInsights.avgGrowth.toFixed(2)}%
                  </strong>
                </span>
                <span>
                  Volatility: <strong>{marketInsights.volatility.toFixed(2)}%</strong>
                </span>
                <span>
                  Top Performers: <strong>{marketInsights.topPerformers}/100</strong>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{marketInsights.recommendation}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1 transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>Adjust your investment parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="start-amount" className="text-sm font-medium">
                Starting Investment: ${startAmount.toLocaleString()}
              </Label>
              <Slider
                id="start-amount"
                min={100}
                max={50000}
                step={100}
                value={[startAmount]}
                onValueChange={([value]) => setStartAmount(value)}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="target-amount" className="text-sm font-medium">
                Target Goal: ${targetAmount.toLocaleString()}
              </Label>
              <Slider
                id="target-amount"
                min={1000}
                max={100000}
                step={1000}
                value={[targetAmount]}
                onValueChange={([value]) => setTargetAmount(value)}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="monthly-contribution" className="text-sm font-medium">
                Monthly Contribution: ${monthlyContribution.toLocaleString()}
              </Label>
              <Slider
                id="monthly-contribution"
                min={0}
                max={5000}
                step={50}
                value={[monthlyContribution]}
                onValueChange={([value]) => setMonthlyContribution(value)}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="time-horizon" className="text-sm font-medium">
                Time Horizon: {timeHorizon} months ({(timeHorizon / 12).toFixed(1)} years)
              </Label>
              <Slider
                id="time-horizon"
                min={6}
                max={120}
                step={6}
                value={[timeHorizon]}
                onValueChange={([value]) => setTimeHorizon(value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-condition">Investment Strategy</Label>
              <Select value={marketCondition} onValueChange={(v) => setMarketCondition(v as MarketCondition)}>
                <SelectTrigger id="market-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative (Lower Risk)</SelectItem>
                  <SelectItem value="moderate">Moderate (Balanced)</SelectItem>
                  <SelectItem value="aggressive">Aggressive (Higher Risk)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3 animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Smart Suggestions
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-0.5 text-primary">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Projection Results</CardTitle>
            <CardDescription>Expected portfolio growth over {timeHorizon} months</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-4 transition-all duration-300 hover:shadow-md">
                <div className="text-xs font-medium text-muted-foreground">Final Value</div>
                <div className="mt-1 text-2xl font-bold">${finalValue.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 transition-all duration-300 hover:shadow-md">
                <div className="text-xs font-medium text-muted-foreground">Total Invested</div>
                <div className="mt-1 text-2xl font-bold">${totalInvested.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 transition-all duration-300 hover:shadow-md">
                <div className="text-xs font-medium text-muted-foreground">Total Return</div>
                <div className={`mt-1 text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {totalReturn >= 0 ? '+' : ''}${totalReturn.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 transition-all duration-300 hover:shadow-md">
                <div className="text-xs font-medium text-muted-foreground">ROI</div>
                <div className={`mt-1 text-2xl font-bold ${returnPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Target Status */}
            {targetReached ? (
              <Alert className="border-green-500/50 bg-green-500/10 animate-scale-in">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  <strong>🎉 Target Reached!</strong> You'll reach your ${targetAmount.toLocaleString()} goal in{' '}
                  {monthsToTarget > 0 ? `${monthsToTarget} months` : 'less than a month'}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  With current parameters, you'll reach ${finalValue.toLocaleString()} in {timeHorizon} months.
                  {finalValue < targetAmount && ` You need $${(targetAmount - finalValue).toLocaleString()} more to reach your goal.`}
                </AlertDescription>
              </Alert>
            )}

            {/* Growth Chart */}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPessimistic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload as SimulationResult;
                      return (
                        <div className="rounded-lg border bg-popover p-3 shadow-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-2">{data.date}</p>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Expected:</span>{' '}
                              <span className="font-bold text-primary">${data.value.toLocaleString()}</span>
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Best case: ${data.optimistic.toLocaleString()}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400">
                              Worst case: ${data.pessimistic.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground border-t pt-1 mt-1">
                              Invested: ${data.invested.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <ReferenceLine 
                    y={targetAmount} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ 
                      value: `Goal: $${(targetAmount / 1000).toFixed(0)}k`, 
                      position: 'right', 
                      fill: 'hsl(var(--destructive))', 
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="optimistic"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={1}
                    fill="url(#colorOptimistic)"
                    fillOpacity={1}
                    name="Best Case"
                    strokeDasharray="3 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="pessimistic"
                    stroke="hsl(0, 84%, 60%)"
                    strokeWidth={1}
                    fill="url(#colorPessimistic)"
                    fillOpacity={1}
                    name="Worst Case"
                    strokeDasharray="3 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fill="url(#colorValue)"
                    fillOpacity={1}
                    name="Expected Value"
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
