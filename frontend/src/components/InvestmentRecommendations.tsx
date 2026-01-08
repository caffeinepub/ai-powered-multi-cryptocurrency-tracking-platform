import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useICPHistoricalData, useICPPrice } from '@/hooks/useQueries';
import { Lightbulb, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, XCircle, Sparkles, Activity } from 'lucide-react';
import { calculateRSI, calculateMACD, calculateTTMSqueeze, preparePriceDataForTTM } from '@/lib/indicators';

type RecommendationType = 'buy' | 'sell' | 'hold';
type ConfidenceLevel = 'high' | 'medium' | 'low';

interface Recommendation {
  type: RecommendationType;
  confidence: ConfidenceLevel;
  reason: string;
  indicators: {
    rsi?: { value: number; signal: string };
    macd?: { value: number; signal: string };
    ttm?: { value: number; squeeze: boolean; signal: string };
  };
  aiInsights: {
    trendStrength: string;
    volatilityLevel: string;
    recommendation: string;
  };
}

export function InvestmentRecommendations() {
  const { data: currentPrice, isLoading: priceLoading } = useICPPrice();
  const { data: historicalData, isLoading: historyLoading } = useICPHistoricalData('1d');

  const recommendation = useMemo<Recommendation | null>(() => {
    if (!historicalData || historicalData.length < 50) return null;

    // Calculate indicators
    const rsiData = calculateRSI(historicalData, 14);
    const macdData = calculateMACD(historicalData, 12, 26, 9);
    const ttmData = calculateTTMSqueeze(preparePriceDataForTTM(historicalData), 20, 2, 20, 1.5);

    const latestRSI = rsiData[rsiData.length - 1];
    const latestMACD = macdData[macdData.length - 1];
    const latestTTM = ttmData[ttmData.length - 1];

    if (!latestRSI || !latestMACD || !latestTTM) return null;

    // AI-powered volatility detection
    const priceChanges = historicalData.slice(-20).map((d, i, arr) => 
      i > 0 ? Math.abs((d.price - arr[i-1].price) / arr[i-1].price) : 0
    );
    const avgVolatility = priceChanges.reduce((sum, v) => sum + v, 0) / priceChanges.length;
    
    let volatilityLevel = 'Low';
    if (avgVolatility > 0.03) volatilityLevel = 'High';
    else if (avgVolatility > 0.015) volatilityLevel = 'Medium';

    // AI-powered trend strength analysis
    const recentPrices = historicalData.slice(-10);
    const priceSlope = (recentPrices[recentPrices.length - 1].price - recentPrices[0].price) / recentPrices[0].price;
    
    let trendStrength = 'Neutral';
    if (priceSlope > 0.05) trendStrength = 'Strong Uptrend';
    else if (priceSlope > 0.02) trendStrength = 'Moderate Uptrend';
    else if (priceSlope < -0.05) trendStrength = 'Strong Downtrend';
    else if (priceSlope < -0.02) trendStrength = 'Moderate Downtrend';

    // Analyze indicators
    let buySignals = 0;
    let sellSignals = 0;
    let holdSignals = 0;

    const indicators: Recommendation['indicators'] = {};

    // RSI Analysis
    if (latestRSI.value < 30) {
      buySignals++;
      indicators.rsi = { value: latestRSI.value, signal: 'Oversold - Buy Signal' };
    } else if (latestRSI.value > 70) {
      sellSignals++;
      indicators.rsi = { value: latestRSI.value, signal: 'Overbought - Sell Signal' };
    } else {
      holdSignals++;
      indicators.rsi = { value: latestRSI.value, signal: 'Neutral' };
    }

    // MACD Analysis
    if (latestMACD.histogram > 0 && latestMACD.macd > latestMACD.signal) {
      buySignals++;
      indicators.macd = { value: latestMACD.histogram, signal: 'Bullish Momentum' };
    } else if (latestMACD.histogram < 0 && latestMACD.macd < latestMACD.signal) {
      sellSignals++;
      indicators.macd = { value: latestMACD.histogram, signal: 'Bearish Momentum' };
    } else {
      holdSignals++;
      indicators.macd = { value: latestMACD.histogram, signal: 'Neutral Momentum' };
    }

    // TTM Squeeze Analysis
    if (!latestTTM.squeeze && latestTTM.value > 0) {
      buySignals++;
      indicators.ttm = { value: latestTTM.value, squeeze: latestTTM.squeeze, signal: 'Breakout - Bullish' };
    } else if (!latestTTM.squeeze && latestTTM.value < 0) {
      sellSignals++;
      indicators.ttm = { value: latestTTM.value, squeeze: latestTTM.squeeze, signal: 'Breakout - Bearish' };
    } else {
      holdSignals++;
      indicators.ttm = { value: latestTTM.value, squeeze: latestTTM.squeeze, signal: latestTTM.squeeze ? 'In Squeeze - Wait' : 'Neutral' };
    }

    // Determine overall recommendation
    let type: RecommendationType;
    let confidence: ConfidenceLevel;
    let reason: string;

    if (buySignals >= 2) {
      type = 'buy';
      confidence = buySignals === 3 ? 'high' : 'medium';
      reason = `${buySignals} out of 3 indicators suggest buying. ${indicators.rsi?.signal}. ${indicators.macd?.signal}.`;
    } else if (sellSignals >= 2) {
      type = 'sell';
      confidence = sellSignals === 3 ? 'high' : 'medium';
      reason = `${sellSignals} out of 3 indicators suggest selling. ${indicators.rsi?.signal}. ${indicators.macd?.signal}.`;
    } else {
      type = 'hold';
      confidence = 'medium';
      reason = 'Mixed signals from indicators. Consider holding your position and monitoring the market.';
    }

    // AI-powered recommendation summary
    let aiRecommendation = '';
    if (type === 'buy' && volatilityLevel === 'Low' && trendStrength.includes('Uptrend')) {
      aiRecommendation = 'Strong buy opportunity with favorable conditions: low volatility and positive trend momentum.';
    } else if (type === 'buy' && volatilityLevel === 'High') {
      aiRecommendation = 'Buy signal detected, but high volatility suggests caution. Consider dollar-cost averaging.';
    } else if (type === 'sell' && trendStrength.includes('Downtrend')) {
      aiRecommendation = 'Sell signal confirmed by downward trend. Consider taking profits or cutting losses.';
    } else if (type === 'hold') {
      aiRecommendation = 'Market conditions are mixed. Wait for clearer signals before making significant moves.';
    } else {
      aiRecommendation = `${type === 'buy' ? 'Buying' : 'Selling'} opportunity identified. Monitor closely for confirmation.`;
    }

    return { 
      type, 
      confidence, 
      reason, 
      indicators,
      aiInsights: {
        trendStrength,
        volatilityLevel,
        recommendation: aiRecommendation,
      }
    };
  }, [historicalData]);

  const isLoading = priceLoading || historyLoading;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Investment Recommendations</h2>
          <p className="text-muted-foreground">AI-powered insights based on technical analysis</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!recommendation) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Investment Recommendations</h2>
          <p className="text-muted-foreground">AI-powered insights based on technical analysis</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Insufficient data to generate recommendations. Please check back later.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const getRecommendationIcon = (type: RecommendationType) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-6 w-6" />;
      case 'sell':
        return <TrendingDown className="h-6 w-6" />;
      case 'hold':
        return <Minus className="h-6 w-6" />;
    }
  };

  const getRecommendationColor = (type: RecommendationType) => {
    switch (type) {
      case 'buy':
        return 'text-green-600 dark:text-green-400 border-green-500/50 bg-green-500/10';
      case 'sell':
        return 'text-red-600 dark:text-red-400 border-red-500/50 bg-red-500/10';
      case 'hold':
        return 'text-yellow-600 dark:text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    }
  };

  const getConfidenceBadge = (confidence: ConfidenceLevel) => {
    const variants: Record<ConfidenceLevel, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      high: { variant: 'default', label: 'High Confidence' },
      medium: { variant: 'secondary', label: 'Medium Confidence' },
      low: { variant: 'outline', label: 'Low Confidence' },
    };
    return variants[confidence];
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Investment Recommendations</h2>
        <p className="text-muted-foreground">AI-powered insights based on technical analysis</p>
      </div>

      {/* AI Insights Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Market Intelligence</CardTitle>
          </div>
          <CardDescription>Advanced analytics and trend detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4" />
                Trend Strength
              </div>
              <div className="mt-2 text-xl font-bold">{recommendation.aiInsights.trendStrength}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4" />
                Volatility Level
              </div>
              <div className="mt-2 text-xl font-bold">{recommendation.aiInsights.volatilityLevel}</div>
            </div>
            <div className="rounded-lg border bg-card p-4 md:col-span-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                AI Recommendation
              </div>
              <div className="mt-2 text-sm">{recommendation.aiInsights.recommendation}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Recommendation Card */}
      <Card className={`border-2 ${getRecommendationColor(recommendation.type)}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${getRecommendationColor(recommendation.type)}`}>
                {getRecommendationIcon(recommendation.type)}
              </div>
              <div>
                <CardTitle className="text-2xl capitalize">{recommendation.type} Recommendation</CardTitle>
                <CardDescription>Based on RSI, MACD, and TTM Squeeze analysis</CardDescription>
              </div>
            </div>
            <Badge {...getConfidenceBadge(recommendation.confidence)}>
              {getConfidenceBadge(recommendation.confidence).label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Price */}
          {currentPrice && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="text-sm font-medium text-muted-foreground">Current ICP Price</div>
              <div className="mt-1 text-3xl font-bold">${currentPrice.toFixed(3)}</div>
            </div>
          )}

          {/* Recommendation Reason */}
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-base">{recommendation.reason}</AlertDescription>
          </Alert>

          {/* Indicator Details */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Technical Indicators</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {/* RSI */}
              {recommendation.indicators.rsi && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">RSI (14)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold">{recommendation.indicators.rsi.value.toFixed(1)}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {recommendation.indicators.rsi.signal.includes('Buy') ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : recommendation.indicators.rsi.signal.includes('Sell') ? (
                        <XCircle className="h-3 w-3 text-red-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-yellow-500" />
                      )}
                      {recommendation.indicators.rsi.signal}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* MACD */}
              {recommendation.indicators.macd && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">MACD</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold">{recommendation.indicators.macd.value.toFixed(4)}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {recommendation.indicators.macd.signal.includes('Bullish') ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : recommendation.indicators.macd.signal.includes('Bearish') ? (
                        <XCircle className="h-3 w-3 text-red-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-yellow-500" />
                      )}
                      {recommendation.indicators.macd.signal}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TTM Squeeze */}
              {recommendation.indicators.ttm && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">TTM Squeeze</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold">{recommendation.indicators.ttm.value.toFixed(4)}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {recommendation.indicators.ttm.signal.includes('Bullish') ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : recommendation.indicators.ttm.signal.includes('Bearish') ? (
                        <XCircle className="h-3 w-3 text-red-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-yellow-500" />
                      )}
                      {recommendation.indicators.ttm.signal}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Disclaimer:</strong> These recommendations are based on technical analysis and AI-powered insights. They should not be considered financial advice. 
              Always do your own research and consult with a financial advisor before making investment decisions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </section>
  );
}
