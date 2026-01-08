import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTop100Cryptocurrencies, usePortfolioSummary, useICPPrice } from '@/hooks/useQueries';
import { TrendingUp, Target, DollarSign, AlertCircle, Lightbulb, Sparkles, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Line,
} from 'recharts';
import { format, addMonths } from 'date-fns';

type InvestmentType = 'icp' | 'diversified' | 'custom';
type GrowthProjection = 'conservative' | 'moderate' | 'aggressive' | 'market-based';
type TimeframeOption = '6' | '12' | '24' | '36' | '60' | '120';
type StrategyType = 'lump-sum' | 'dca' | 'hybrid';
type RiskLevel = 'low' | 'medium' | 'high' | 'very-high';

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
  // Configuration state with dropdown selections
  const [investmentType, setInvestmentType] = useState<InvestmentType>('icp');
  const [growthProjection, setGrowthProjection] = useState<GrowthProjection>('market-based');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('36');
  const [strategyType, setStrategyType] = useState<StrategyType>('dca');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medium');
  
  // Amount configuration
  const [startAmount, setStartAmount] = useState('1000');
  const [monthlyContribution, setMonthlyContribution] = useState('100');
  const [targetAmount, setTargetAmount] = useState('10000');
  
  // Real-time data hooks
  const { data: cryptos, isLoading: cryptosLoading } = useTop100Cryptocurrencies(30000);
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolioSummary();
  const { data: currentICPPrice, isLoading: priceLoading } = useICPPrice();

  // Parse numeric values
  const startAmountNum = parseFloat(startAmount) || 0;
  const monthlyContributionNum = parseFloat(monthlyContribution) || 0;
  const targetAmountNum = parseFloat(targetAmount) || 0;
  const timeHorizon = parseInt(timeframe);

  // Calculate real-time market insights from live data
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
      recommendation = 'Strong bullish market. Consider aggressive growth strategy with higher risk tolerance.';
    } else if (avgGrowth > 0) {
      recommendation = 'Moderate market conditions. Balanced approach with medium risk recommended.';
    } else if (avgGrowth > -3) {
      recommendation = 'Slight bearish trend. Conservative strategy with lower risk advised.';
    } else {
      recommendation = 'Strong bearish market. Focus on capital preservation with minimal risk.';
    }

    return { avgGrowth, volatility, topPerformers, recommendation };
  }, [cryptos]);

  // Calculate growth rate based on investment type and real-time data
  const calculateGrowthRate = useMemo(() => {
    let baseRate = 0;

    // Base rates by growth projection
    const projectionRates: Record<GrowthProjection, number> = {
      'conservative': 0.015,  // 1.5% monthly
      'moderate': 0.04,       // 4% monthly
      'aggressive': 0.07,     // 7% monthly
      'market-based': 0.04,   // Will be adjusted by market data
    };

    baseRate = projectionRates[growthProjection];

    // Adjust for investment type using real-time data
    if (investmentType === 'icp' && portfolio) {
      // Use actual ICP performance
      const icpMonthlyGrowth = (portfolio.profitLossPercent / 100) / 12; // Approximate monthly from total
      if (growthProjection === 'market-based') {
        baseRate = icpMonthlyGrowth;
      }
    } else if (investmentType === 'diversified' && marketInsights.avgGrowth !== 0) {
      // Use market average
      const marketMonthlyGrowth = (marketInsights.avgGrowth / 100) * 30; // Convert 24h to monthly estimate
      if (growthProjection === 'market-based') {
        baseRate = marketMonthlyGrowth;
      }
    }

    // Adjust for risk level
    const riskMultipliers: Record<RiskLevel, number> = {
      'low': 0.7,
      'medium': 1.0,
      'high': 1.3,
      'very-high': 1.6,
    };

    baseRate *= riskMultipliers[riskLevel];

    // Apply market sentiment adjustment
    if (growthProjection === 'market-based' && marketInsights.avgGrowth !== 0) {
      const marketAdjustment = (marketInsights.avgGrowth / 100) * 0.3;
      baseRate += marketAdjustment;
    }

    return baseRate;
  }, [growthProjection, investmentType, riskLevel, marketInsights, portfolio]);

  // Calculate simulation data with real-time projections
  const simulationData = useMemo<SimulationResult[]>(() => {
    const monthlyGrowth = calculateGrowthRate;
    const results: SimulationResult[] = [];
    
    let currentValue = startAmountNum;
    let totalInvested = startAmountNum;
    
    // Optimistic and pessimistic scenarios based on volatility
    const volatilityFactor = Math.max(0.3, Math.min(0.8, marketInsights.volatility / 10));
    const optimisticGrowth = monthlyGrowth * (1 + volatilityFactor);
    const pessimisticGrowth = monthlyGrowth * (1 - volatilityFactor);
    
    let optimisticValue = startAmountNum;
    let pessimisticValue = startAmountNum;
    
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
        // Apply growth with strategy-specific logic
        const randomFactor = 1 + (Math.random() - 0.5) * 0.05; // Reduced randomness for stability
        
        if (strategyType === 'lump-sum') {
          // Only initial investment grows
          currentValue = currentValue * (1 + monthlyGrowth * randomFactor);
          optimisticValue = optimisticValue * (1 + optimisticGrowth * randomFactor);
          pessimisticValue = pessimisticValue * (1 + pessimisticGrowth * randomFactor);
        } else if (strategyType === 'dca') {
          // Regular contributions with growth
          currentValue = currentValue * (1 + monthlyGrowth * randomFactor) + monthlyContributionNum;
          optimisticValue = optimisticValue * (1 + optimisticGrowth * randomFactor) + monthlyContributionNum;
          pessimisticValue = pessimisticValue * (1 + pessimisticGrowth * randomFactor) + monthlyContributionNum;
          totalInvested += monthlyContributionNum;
        } else {
          // Hybrid: 50% of contribution
          const hybridContribution = monthlyContributionNum * 0.5;
          currentValue = currentValue * (1 + monthlyGrowth * randomFactor) + hybridContribution;
          optimisticValue = optimisticValue * (1 + optimisticGrowth * randomFactor) + hybridContribution;
          pessimisticValue = pessimisticValue * (1 + pessimisticGrowth * randomFactor) + hybridContribution;
          totalInvested += hybridContribution;
        }
      }
    }
    
    return results;
  }, [startAmountNum, monthlyContributionNum, timeHorizon, calculateGrowthRate, strategyType, marketInsights.volatility]);

  const finalValue = simulationData[simulationData.length - 1]?.value || 0;
  const totalInvested = simulationData[simulationData.length - 1]?.invested || 0;
  const totalReturn = finalValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  const targetReached = finalValue >= targetAmountNum;
  const monthsToTarget = simulationData.findIndex(d => d.value >= targetAmountNum);

  // Smart suggestions based on real-time data
  const suggestions = useMemo(() => {
    const suggestions: string[] = [];
    
    if (!targetReached && finalValue < targetAmountNum * 0.8) {
      const neededIncrease = Math.ceil((targetAmountNum - finalValue) / timeHorizon);
      suggestions.push(`Increase monthly contribution by $${neededIncrease} to reach your goal.`);
    }
    
    if (marketInsights.avgGrowth > 2 && growthProjection === 'conservative') {
      suggestions.push('Market is bullish. Consider switching to moderate or aggressive projection.');
    }
    
    if (marketInsights.avgGrowth < -2 && growthProjection === 'aggressive') {
      suggestions.push('Market is bearish. Consider switching to conservative projection to protect capital.');
    }
    
    if (investmentType === 'icp' && portfolio && portfolio.profitLossPercent < -10) {
      suggestions.push('Your ICP portfolio is down. Consider diversifying to reduce risk.');
    }

    if (strategyType === 'lump-sum' && timeHorizon < 24) {
      suggestions.push('For short timeframes, DCA strategy may reduce timing risk.');
    }
    
    if (riskLevel === 'very-high' && marketInsights.volatility > 8) {
      suggestions.push('High market volatility detected. Consider reducing risk level.');
    }

    return suggestions;
  }, [targetReached, finalValue, targetAmountNum, timeHorizon, marketInsights, growthProjection, investmentType, portfolio, strategyType, riskLevel]);

  const isLoading = cryptosLoading || portfolioLoading || priceLoading;

  return (
    <section className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Portfolio Growth Simulator</h2>
        <p className="text-muted-foreground">
          Real-time investment projections powered by live market data and your active portfolio
        </p>
      </div>

      {/* Real-time Market Insights Banner */}
      {!isLoading && marketInsights.avgGrowth !== 0 && (
        <Alert className="border-primary/50 bg-primary/5 animate-fade-in">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="flex flex-col gap-2">
              <div className="font-semibold flex items-center gap-2">
                Live Market Insights
                {isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
              </div>
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

      {/* Active Portfolio Status */}
      {portfolio && investmentType === 'icp' && (
        <Card className="border-2 border-blue-500/20 bg-blue-500/5 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Your Active ICP Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Holdings</div>
                <div className="text-lg font-bold">{portfolio.coins.toFixed(2)} ICP</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Current Value</div>
                <div className="text-lg font-bold">${portfolio.currentValue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Profit/Loss</div>
                <div className={`text-lg font-bold ${portfolio.profitLossPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {portfolio.profitLossPercent >= 0 ? '+' : ''}{portfolio.profitLossPercent.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Live ICP Price</div>
                <div className="text-lg font-bold">${currentICPPrice?.toFixed(3) || '...'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Enhanced Configuration Panel with Dropdowns */}
        <Card className="lg:col-span-1 transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Simulator Configuration
            </CardTitle>
            <CardDescription>Customize your investment simulation parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Investment Selection */}
            <div className="space-y-2">
              <Label htmlFor="investment-type" className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Investment Selection
              </Label>
              <Select value={investmentType} onValueChange={(v) => setInvestmentType(v as InvestmentType)}>
                <SelectTrigger id="investment-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icp">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">ICP (Your Active Portfolio)</span>
                      <span className="text-xs text-muted-foreground">Based on your current holdings</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="diversified">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Diversified Crypto Portfolio</span>
                      <span className="text-xs text-muted-foreground">Top 100 market average</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Custom Strategy</span>
                      <span className="text-xs text-muted-foreground">Manual configuration</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Growth Projections */}
            <div className="space-y-2">
              <Label htmlFor="growth-projection" className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Growth Projection
              </Label>
              <Select value={growthProjection} onValueChange={(v) => setGrowthProjection(v as GrowthProjection)}>
                <SelectTrigger id="growth-projection" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market-based">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Market-Based (Live Data)</span>
                      <span className="text-xs text-muted-foreground">Real-time market performance</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="conservative">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Conservative</span>
                      <span className="text-xs text-muted-foreground">~1.5% monthly growth</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="moderate">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Moderate</span>
                      <span className="text-xs text-muted-foreground">~4% monthly growth</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="aggressive">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Aggressive</span>
                      <span className="text-xs text-muted-foreground">~7% monthly growth</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timeframe */}
            <div className="space-y-2">
              <Label htmlFor="timeframe" className="text-sm font-semibold">
                Investment Timeframe
              </Label>
              <Select value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeOption)}>
                <SelectTrigger id="timeframe" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 months (Short-term)</SelectItem>
                  <SelectItem value="12">1 year</SelectItem>
                  <SelectItem value="24">2 years</SelectItem>
                  <SelectItem value="36">3 years (Recommended)</SelectItem>
                  <SelectItem value="60">5 years</SelectItem>
                  <SelectItem value="120">10 years (Long-term)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Strategy Type */}
            <div className="space-y-2">
              <Label htmlFor="strategy-type" className="text-sm font-semibold">
                Investment Strategy
              </Label>
              <Select value={strategyType} onValueChange={(v) => setStrategyType(v as StrategyType)}>
                <SelectTrigger id="strategy-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lump-sum">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Lump Sum</span>
                      <span className="text-xs text-muted-foreground">One-time investment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dca">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Dollar-Cost Averaging (DCA)</span>
                      <span className="text-xs text-muted-foreground">Regular monthly contributions</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hybrid">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Hybrid Strategy</span>
                      <span className="text-xs text-muted-foreground">Initial + reduced monthly</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Risk Level */}
            <div className="space-y-2">
              <Label htmlFor="risk-level" className="text-sm font-semibold">
                Risk Tolerance Level
              </Label>
              <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as RiskLevel)}>
                <SelectTrigger id="risk-level" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Low Risk</span>
                      <span className="text-xs text-muted-foreground">Capital preservation focus</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Medium Risk</span>
                      <span className="text-xs text-muted-foreground">Balanced approach</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">High Risk</span>
                      <span className="text-xs text-muted-foreground">Growth-oriented</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="very-high">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Very High Risk</span>
                      <span className="text-xs text-muted-foreground">Maximum growth potential</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount Inputs */}
            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="start-amount" className="text-sm">
                  Starting Investment ($)
                </Label>
                <input
                  id="start-amount"
                  type="number"
                  value={startAmount}
                  onChange={(e) => setStartAmount(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  min="0"
                  step="100"
                />
              </div>

              {strategyType !== 'lump-sum' && (
                <div className="space-y-2">
                  <Label htmlFor="monthly-contribution" className="text-sm">
                    Monthly Contribution ($)
                  </Label>
                  <input
                    id="monthly-contribution"
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    min="0"
                    step="50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="target-amount" className="text-sm">
                  Target Goal ($)
                </Label>
                <input
                  id="target-amount"
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  min="0"
                  step="1000"
                />
              </div>
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
            <CardTitle>Real-Time Projection Results</CardTitle>
            <CardDescription>Expected portfolio growth over {timeHorizon} months based on live market data</CardDescription>
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
                  <strong>🎉 Target Reached!</strong> You'll reach your ${targetAmountNum.toLocaleString()} goal in{' '}
                  {monthsToTarget > 0 ? `${monthsToTarget} months` : 'less than a month'}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  With current parameters, you'll reach ${finalValue.toLocaleString()} in {timeHorizon} months.
                  {finalValue < targetAmountNum && ` You need $${(targetAmountNum - finalValue).toLocaleString()} more to reach your goal.`}
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
                    y={targetAmountNum} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ 
                      value: `Goal: $${(targetAmountNum / 1000).toFixed(0)}k`, 
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
