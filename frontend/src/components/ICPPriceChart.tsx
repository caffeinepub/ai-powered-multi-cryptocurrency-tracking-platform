import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useICPHistoricalData, usePrefetchTimeframes, type TimeframeOption } from '@/hooks/useQueries';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps,
  Legend,
  Area,
} from 'recharts';
import { format } from 'date-fns';
import { Info, RefreshCw, TrendingUp, Clock, AlertCircle, Sparkles } from 'lucide-react';
import {
  calculateRSI,
  calculateMACD,
  calculateTTMSqueeze,
  preparePriceDataForTTM,
} from '@/lib/indicators';

interface TimeframeConfig {
  value: TimeframeOption;
  label: string;
  description: string;
  updateFrequency: string;
}

const TIMEFRAME_OPTIONS: TimeframeConfig[] = [
  { value: '1m', label: '1m', description: 'High-frequency data, updates every minute', updateFrequency: '~1440 points/day' },
  { value: '5m', label: '5m', description: 'High-frequency data, updates every 5 minutes', updateFrequency: '~288 points/day' },
  { value: '15m', label: '15m', description: 'Medium-frequency data, updates every 15 minutes', updateFrequency: '~96 points/day' },
  { value: '1h', label: '1h', description: 'Hourly data, updates every hour', updateFrequency: '~168 points/week' },
  { value: '4h', label: '4h', description: 'Hourly data, updates every 4 hours', updateFrequency: '~180 points/month' },
  { value: '1d', label: '1d', description: 'Daily data, updates once per day', updateFrequency: '~90 points/quarter' },
  { value: '1M', label: '1w', description: 'Weekly data, updates once per week', updateFrequency: '~52 points/year' },
  { value: '3M', label: '1mo', description: 'Monthly data, updates once per month', updateFrequency: '~12 points/year' },
];

interface ChartDataPoint {
  timestamp: number;
  price: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  ttmValue?: number;
  ttmSqueeze?: boolean;
  aiProjection?: number;
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload as ChartDataPoint;
  const timestamp = label as number;

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md animate-fade-in">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          {format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss')}
        </p>
        <Separator className="my-1" />
        <p className="text-sm font-bold">
          Price: <span className="text-primary">${data.price.toFixed(4)}</span>
        </p>
        {data.aiProjection !== undefined && (
          <p className="text-xs">
            AI Projection: <span className="font-semibold text-purple-500">${data.aiProjection.toFixed(4)}</span>
          </p>
        )}
        {data.rsi !== undefined && (
          <p className="text-xs">
            RSI: <span className="font-semibold text-purple-500">{data.rsi.toFixed(2)}</span>
          </p>
        )}
        {data.macd !== undefined && (
          <>
            <p className="text-xs">
              MACD: <span className="font-semibold text-blue-500">{data.macd.toFixed(4)}</span>
            </p>
            {data.macdSignal !== undefined && (
              <p className="text-xs">
                Signal: <span className="font-semibold text-orange-500">{data.macdSignal.toFixed(4)}</span>
              </p>
            )}
          </>
        )}
        {data.ttmValue !== undefined && (
          <>
            <p className="text-xs">
              TTM: <span className="font-semibold text-green-500">{data.ttmValue.toFixed(4)}</span>
            </p>
            {data.ttmSqueeze !== undefined && (
              <p className="text-xs">
                Squeeze: <span className={`font-semibold ${data.ttmSqueeze ? 'text-red-500' : 'text-green-500'}`}>
                  {data.ttmSqueeze ? 'ON' : 'OFF'}
                </span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function ICPPriceChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('1d');
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showTTM, setShowTTM] = useState(false);
  const [showAIProjection, setShowAIProjection] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { data: historicalData, isLoading, error, refetch, isFetching } = useICPHistoricalData(selectedTimeframe);
  const { prefetchTimeframe } = usePrefetchTimeframes();

  // Prefetch adjacent timeframes
  useEffect(() => {
    const currentIndex = TIMEFRAME_OPTIONS.findIndex(opt => opt.value === selectedTimeframe);
    
    if (currentIndex > 0) {
      prefetchTimeframe(TIMEFRAME_OPTIONS[currentIndex - 1].value);
    }
    if (currentIndex < TIMEFRAME_OPTIONS.length - 1) {
      prefetchTimeframe(TIMEFRAME_OPTIONS[currentIndex + 1].value);
    }
  }, [selectedTimeframe, prefetchTimeframe]);

  // Calculate indicators and AI projection
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!historicalData || historicalData.length === 0) return [];

    let data: ChartDataPoint[] = historicalData.map((d) => ({
      timestamp: d.timestamp,
      price: d.price,
    }));

    const dataLength = historicalData.length;
    const rsiPeriod = Math.min(14, Math.max(7, Math.floor(dataLength / 10)));
    const macdFast = Math.min(12, Math.max(6, Math.floor(dataLength / 15)));
    const macdSlow = Math.min(26, Math.max(12, Math.floor(dataLength / 8)));
    const macdSignal = Math.min(9, Math.max(5, Math.floor(dataLength / 20)));

    // Calculate RSI
    if (showRSI) {
      const rsiData = calculateRSI(historicalData, rsiPeriod);
      const rsiMap = new Map(rsiData.map((d) => [d.timestamp, d.value]));
      data = data.map((d) => ({
        ...d,
        rsi: rsiMap.get(d.timestamp),
      }));
    }

    // Calculate MACD
    if (showMACD) {
      const macdData = calculateMACD(historicalData, macdFast, macdSlow, macdSignal);
      const macdMap = new Map(
        macdData.map((d) => [
          d.timestamp,
          { macd: d.macd, signal: d.signal, histogram: d.histogram },
        ])
      );
      data = data.map((d) => {
        const macd = macdMap.get(d.timestamp);
        return {
          ...d,
          macd: macd?.macd,
          macdSignal: macd?.signal,
          macdHistogram: macd?.histogram,
        };
      });
    }

    // Calculate TTM Squeeze
    if (showTTM) {
      const ttmData = calculateTTMSqueeze(preparePriceDataForTTM(historicalData), 20, 2, 20, 1.5);
      const ttmMap = new Map(
        ttmData.map((d) => [d.timestamp, { value: d.value, squeeze: d.squeeze }])
      );
      data = data.map((d) => {
        const ttm = ttmMap.get(d.timestamp);
        return {
          ...d,
          ttmValue: ttm?.value,
          ttmSqueeze: ttm?.squeeze,
        };
      });
    }

    // Add AI projection (simple linear regression for demonstration)
    if (showAIProjection && data.length > 10) {
      const recentData = data.slice(-20);
      const avgGrowth = recentData.reduce((sum, d, i) => {
        if (i === 0) return 0;
        return sum + (d.price - recentData[i - 1].price);
      }, 0) / (recentData.length - 1);

      data = data.map((d, i) => ({
        ...d,
        aiProjection: i >= data.length - 10 ? d.price + avgGrowth * (data.length - i) : undefined,
      }));
    }

    return data;
  }, [historicalData, showRSI, showMACD, showTTM, showAIProjection]);

  const handleTimeframeChange = async (timeframe: TimeframeOption) => {
    if (timeframe === selectedTimeframe) return;
    
    setIsTransitioning(true);
    setSelectedTimeframe(timeframe);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Interactive Price Chart</CardTitle>
          <CardDescription>Real-time price data with AI projections and technical indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Interactive Price Chart</CardTitle>
          <CardDescription>Real-time price data with AI projections and technical indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Unable to load chart data. Please try again.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!historicalData || historicalData.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Interactive Price Chart</CardTitle>
          <CardDescription>Real-time price data with AI projections and technical indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>No data available for the selected timeframe. Try a different interval.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isRecentData =
    historicalData.length > 0 && Date.now() - historicalData[historicalData.length - 1].timestamp < 3600000;

  const formatTimestamp = (timestamp: number) => {
    if (['1m', '5m', '15m'].includes(selectedTimeframe)) {
      return format(new Date(timestamp), 'HH:mm');
    } else if (['1h', '4h'].includes(selectedTimeframe)) {
      return format(new Date(timestamp), 'MMM dd HH:mm');
    } else if (selectedTimeframe === '1d') {
      return format(new Date(timestamp), 'MMM dd');
    } else {
      return format(new Date(timestamp), 'MMM yyyy');
    }
  };

  const hasIndicators = showRSI || showMACD || showTTM;
  const mainChartHeight = hasIndicators ? 300 : 400;
  const indicatorHeight = 150;

  const currentConfig = TIMEFRAME_OPTIONS.find(opt => opt.value === selectedTimeframe);

  const priceValues = chartData.map(d => d.price);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const priceRange = maxPrice - minPrice;
  const pricePadding = priceRange * 0.1;
  const yAxisDomain = [minPrice - pricePadding, maxPrice + pricePadding];

  return (
    <Card className="animate-fade-in border-2">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Interactive Price Chart
                {isTransitioning && (
                  <Badge variant="outline" className="border-blue-500 text-blue-500 animate-pulse">
                    <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                    Loading
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Real-time price data with AI projections and technical indicators</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && !isTransitioning && (
                <Badge variant="outline" className="border-blue-500 text-blue-500 animate-pulse">
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Live Update
                </Badge>
              )}
              {!isRecentData && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                  <Info className="mr-1 h-3 w-3" />
                  Cached Data
                </Badge>
              )}
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Timeframe:</span>
              {currentConfig && (
                <span className="text-xs">
                  {currentConfig.description}
                </span>
              )}
            </div>
            <TooltipProvider delayDuration={200}>
              <div className="flex flex-wrap gap-1.5">
                {TIMEFRAME_OPTIONS.map((option) => (
                  <Tooltip key={option.value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedTimeframe === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTimeframeChange(option.value)}
                        className={`h-9 px-3 text-xs font-medium transition-all duration-200 ${
                          selectedTimeframe === option.value
                            ? 'shadow-md ring-2 ring-primary/20 scale-105'
                            : 'hover:border-primary/50 hover:scale-105'
                        }`}
                        disabled={isFetching || isTransitioning}
                      >
                        {option.label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">{option.label} Interval</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Indicator Toggles */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Overlays:</span>
            </div>
            <TooltipProvider delayDuration={200}>
              <div className="flex flex-wrap items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ai-toggle"
                        checked={showAIProjection}
                        onCheckedChange={setShowAIProjection}
                        disabled={isFetching || isTransitioning}
                      />
                      <Label htmlFor="ai-toggle" className="cursor-pointer text-sm font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Projection
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">AI-powered price trajectory forecast</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="rsi-toggle"
                        checked={showRSI}
                        onCheckedChange={setShowRSI}
                        disabled={isFetching || isTransitioning}
                      />
                      <Label htmlFor="rsi-toggle" className="cursor-pointer text-sm font-medium">
                        RSI
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Relative Strength Index - Momentum oscillator</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="macd-toggle"
                        checked={showMACD}
                        onCheckedChange={setShowMACD}
                        disabled={isFetching || isTransitioning}
                      />
                      <Label htmlFor="macd-toggle" className="cursor-pointer text-sm font-medium">
                        MACD
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Moving Average Convergence Divergence</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ttm-toggle"
                        checked={showTTM}
                        onCheckedChange={setShowTTM}
                        disabled={isFetching || isTransitioning}
                      />
                      <Label htmlFor="ttm-toggle" className="cursor-pointer text-sm font-medium">
                        TTM Squeeze
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">TTM Squeeze - Volatility indicator</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`space-y-4 transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
          {/* Main Price Chart */}
          <ResponsiveContainer width="100%" height={mainChartHeight}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} className="text-xs" minTickGap={50} />
              <YAxis
                yAxisId="price"
                domain={yAxisDomain}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                className="text-xs"
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                fill="url(#priceGradient)"
                strokeWidth={2}
                name="Price"
                isAnimationActive={!isTransitioning}
                animationDuration={300}
              />
              {showAIProjection && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="aiProjection"
                  stroke="hsl(280 100% 70%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="AI Projection"
                  isAnimationActive={!isTransitioning}
                  animationDuration={300}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* RSI Indicator */}
          {showRSI && (
            <ResponsiveContainer width="100%" height={indicatorHeight}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} className="text-xs" minTickGap={50} />
                <YAxis domain={[0, 100]} className="text-xs" />
                <RechartsTooltip content={<CustomTooltip />} />
                <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Overbought" />
                <ReferenceLine y={30} stroke="hsl(142 76% 36%)" strokeDasharray="3 3" label="Oversold" />
                <Line
                  type="monotone"
                  dataKey="rsi"
                  stroke="hsl(280 100% 70%)"
                  strokeWidth={2}
                  dot={false}
                  name="RSI"
                  isAnimationActive={!isTransitioning}
                  animationDuration={300}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* MACD Indicator */}
          {showMACD && (
            <ResponsiveContainer width="100%" height={indicatorHeight}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} className="text-xs" minTickGap={50} />
                <YAxis className="text-xs" />
                <RechartsTooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="macdHistogram" fill="hsl(220 70% 50%)" opacity={0.6} name="Histogram" isAnimationActive={!isTransitioning} />
                <Line type="monotone" dataKey="macd" stroke="hsl(220 100% 60%)" strokeWidth={2} dot={false} name="MACD" isAnimationActive={!isTransitioning} animationDuration={300} />
                <Line
                  type="monotone"
                  dataKey="macdSignal"
                  stroke="hsl(30 100% 60%)"
                  strokeWidth={2}
                  dot={false}
                  name="Signal"
                  isAnimationActive={!isTransitioning}
                  animationDuration={300}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* TTM Squeeze Indicator */}
          {showTTM && (
            <ResponsiveContainer width="100%" height={indicatorHeight}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} className="text-xs" minTickGap={50} />
                <YAxis className="text-xs" />
                <RechartsTooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar
                  dataKey="ttmValue"
                  fill="hsl(142 76% 36%)"
                  opacity={0.8}
                  name="TTM Momentum"
                  isAnimationActive={!isTransitioning}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const fill = payload.ttmSqueeze ? 'hsl(0 84% 60%)' : 'hsl(142 76% 36%)';
                    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
