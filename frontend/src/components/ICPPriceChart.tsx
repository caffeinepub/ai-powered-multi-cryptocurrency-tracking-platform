import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useICPHistoricalData, usePriceAlerts, usePrefetchTimeframes, type TimeframeOption } from '@/hooks/useQueries';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { Info, RefreshCw, TrendingUp } from 'lucide-react';
import {
  calculateRSI,
  calculateMACD,
  calculateTTMSqueeze,
  preparePriceDataForTTM,
  type IndicatorData,
  type MACDData,
  type TTMSqueezeData,
} from '@/lib/indicators';

const TIMEFRAME_OPTIONS: { value: TimeframeOption; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '2m', label: '2m' },
  { value: '3m', label: '3m' },
  { value: '5m', label: '5m' },
  { value: '10m', label: '10m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '2h', label: '2h' },
  { value: '4h', label: '4h' },
  { value: '6h', label: '6h' },
  { value: '1d', label: '1d' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1y', label: '1y' },
];

type IndicatorType = 'none' | 'rsi' | 'macd' | 'ttm';

interface ChartDataPoint {
  timestamp: number;
  price: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  ttmValue?: number;
  ttmSqueeze?: boolean;
}

// Custom tooltip component with comprehensive details
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload as ChartDataPoint;
  const timestamp = label as number;

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          {format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss')}
        </p>
        <Separator className="my-1" />
        <p className="text-sm font-bold">
          Price: <span className="text-primary">${data.price.toFixed(4)}</span>
        </p>
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
            {data.macdHistogram !== undefined && (
              <p className="text-xs">
                Histogram: <span className="font-semibold">{data.macdHistogram.toFixed(4)}</span>
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
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorType>('none');
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showTTM, setShowTTM] = useState(false);

  const { data: historicalData, isLoading, error, refetch, isFetching } = useICPHistoricalData(selectedTimeframe);
  const { data: alerts } = usePriceAlerts();
  const { prefetchTimeframe } = usePrefetchTimeframes();

  // Prefetch adjacent timeframes for smoother transitions
  useEffect(() => {
    const currentIndex = TIMEFRAME_OPTIONS.findIndex(opt => opt.value === selectedTimeframe);
    
    // Prefetch next and previous timeframes
    if (currentIndex > 0) {
      prefetchTimeframe(TIMEFRAME_OPTIONS[currentIndex - 1].value);
    }
    if (currentIndex < TIMEFRAME_OPTIONS.length - 1) {
      prefetchTimeframe(TIMEFRAME_OPTIONS[currentIndex + 1].value);
    }
  }, [selectedTimeframe, prefetchTimeframe]);

  // Calculate indicators based on historical data with adaptive period handling
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!historicalData || historicalData.length === 0) return [];

    let data: ChartDataPoint[] = historicalData.map((d) => ({
      timestamp: d.timestamp,
      price: d.price,
    }));

    // Adjust indicator periods based on data density
    const dataLength = historicalData.length;
    const rsiPeriod = Math.min(14, Math.max(7, Math.floor(dataLength / 10)));
    const macdFast = Math.min(12, Math.max(6, Math.floor(dataLength / 15)));
    const macdSlow = Math.min(26, Math.max(12, Math.floor(dataLength / 8)));
    const macdSignal = Math.min(9, Math.max(5, Math.floor(dataLength / 20)));

    // Calculate RSI if enabled
    if (showRSI) {
      const rsiData = calculateRSI(historicalData, rsiPeriod);
      const rsiMap = new Map(rsiData.map((d) => [d.timestamp, d.value]));
      data = data.map((d) => ({
        ...d,
        rsi: rsiMap.get(d.timestamp),
      }));
    }

    // Calculate MACD if enabled
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

    // Calculate TTM Squeeze if enabled
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

    return data;
  }, [historicalData, showRSI, showMACD, showTTM]);

  const handleTimeframeChange = (timeframe: TimeframeOption) => {
    setSelectedTimeframe(timeframe);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ICP Price Chart</CardTitle>
          <CardDescription>Historical price data with customizable timeframes and indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ICP Price Chart</CardTitle>
          <CardDescription>Historical price data with customizable timeframes and indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
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
      <Card>
        <CardHeader>
          <CardTitle>ICP Price Chart</CardTitle>
          <CardDescription>Historical price data with customizable timeframes and indicators</CardDescription>
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

  // Check if data is recent (less than 1 hour old)
  const isRecentData =
    historicalData.length > 0 && Date.now() - historicalData[historicalData.length - 1].timestamp < 3600000;

  // Format timestamp based on timeframe
  const formatTimestamp = (timestamp: number) => {
    if (['1m', '2m', '3m', '5m', '10m', '15m', '30m'].includes(selectedTimeframe)) {
      return format(new Date(timestamp), 'HH:mm');
    } else if (['1h', '2h', '4h', '6h'].includes(selectedTimeframe)) {
      return format(new Date(timestamp), 'MMM dd HH:mm');
    } else if (selectedTimeframe === '1d') {
      return format(new Date(timestamp), 'MMM dd');
    } else {
      return format(new Date(timestamp), 'MMM yyyy');
    }
  };

  // Determine if we need multiple charts for indicators
  const hasIndicators = showRSI || showMACD || showTTM;
  const mainChartHeight = hasIndicators ? 300 : 400;
  const indicatorHeight = 150;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>ICP Price Chart</CardTitle>
              <CardDescription>Historical price data with customizable timeframes and indicators</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && (
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Updating
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
          <div className="flex flex-wrap gap-1">
            {TIMEFRAME_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={selectedTimeframe === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimeframeChange(option.value)}
                className="h-8 px-3 text-xs"
                disabled={isFetching}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Indicator Toggles */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Indicators:</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="rsi-toggle" checked={showRSI} onCheckedChange={setShowRSI} disabled={isFetching} />
              <Label htmlFor="rsi-toggle" className="cursor-pointer text-sm">
                RSI
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="macd-toggle" checked={showMACD} onCheckedChange={setShowMACD} disabled={isFetching} />
              <Label htmlFor="macd-toggle" className="cursor-pointer text-sm">
                MACD
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ttm-toggle" checked={showTTM} onCheckedChange={setShowTTM} disabled={isFetching} />
              <Label htmlFor="ttm-toggle" className="cursor-pointer text-sm">
                TTM Squeeze
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Price Chart */}
          <ResponsiveContainer width="100%" height={mainChartHeight}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} className="text-xs" minTickGap={50} />
              <YAxis
                yAxisId="price"
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {alerts?.map((alert) => (
                <ReferenceLine
                  key={alert.price}
                  y={alert.price}
                  yAxisId="price"
                  stroke={alert.isTriggered ? 'hsl(142 76% 36%)' : 'hsl(var(--destructive))'}
                  strokeDasharray="3 3"
                  label={{
                    value: `$${alert.price.toFixed(2)}`,
                    position: 'right',
                    fill: alert.isTriggered ? 'hsl(142 76% 36%)' : 'hsl(var(--destructive))',
                    fontSize: 11,
                  }}
                />
              ))}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="Price"
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* RSI Indicator Chart */}
          {showRSI && (
            <ResponsiveContainer width="100%" height={indicatorHeight}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} className="text-xs" minTickGap={50} />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Overbought" />
                <ReferenceLine y={30} stroke="hsl(142 76% 36%)" strokeDasharray="3 3" label="Oversold" />
                <Line
                  type="monotone"
                  dataKey="rsi"
                  stroke="hsl(280 100% 70%)"
                  strokeWidth={2}
                  dot={false}
                  name="RSI"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* MACD Indicator Chart */}
          {showMACD && (
            <ResponsiveContainer width="100%" height={indicatorHeight}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} className="text-xs" minTickGap={50} />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="macdHistogram" fill="hsl(220 70% 50%)" opacity={0.6} name="Histogram" />
                <Line type="monotone" dataKey="macd" stroke="hsl(220 100% 60%)" strokeWidth={2} dot={false} name="MACD" />
                <Line
                  type="monotone"
                  dataKey="macdSignal"
                  stroke="hsl(30 100% 60%)"
                  strokeWidth={2}
                  dot={false}
                  name="Signal"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* TTM Squeeze Indicator Chart */}
          {showTTM && (
            <ResponsiveContainer width="100%" height={indicatorHeight}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} className="text-xs" minTickGap={50} />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar
                  dataKey="ttmValue"
                  fill="hsl(142 76% 36%)"
                  opacity={0.8}
                  name="TTM Momentum"
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
