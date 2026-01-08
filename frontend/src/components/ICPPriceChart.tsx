import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useICPHistoricalData, usePriceAlerts, type TimeframeOption } from '@/hooks/useQueries';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, TooltipProps } from 'recharts';
import { format } from 'date-fns';
import { Info, RefreshCw } from 'lucide-react';

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

// Custom tooltip component for better hover information
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const price = payload[0].value as number;
  const timestamp = label as number;

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          {format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss')}
        </p>
        <p className="text-sm font-bold">
          Price: <span className="text-primary">${price.toFixed(4)}</span>
        </p>
      </div>
    </div>
  );
}

export function ICPPriceChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('1d');
  const { data: historicalData, isLoading, error, refetch, isFetching } = useICPHistoricalData(selectedTimeframe);
  const { data: alerts } = usePriceAlerts();

  const handleTimeframeChange = (timeframe: TimeframeOption) => {
    setSelectedTimeframe(timeframe);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ICP Price Chart</CardTitle>
          <CardDescription>Historical price data with customizable timeframes</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ICP Price Chart</CardTitle>
          <CardDescription>Historical price data with customizable timeframes</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Unable to load chart data. Please try again.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-4"
              >
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
          <CardDescription>Historical price data with customizable timeframes</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>No data available for the selected timeframe. Try a different interval.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-4"
              >
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
  const isRecentData = historicalData.length > 0 && 
    (Date.now() - historicalData[historicalData.length - 1].timestamp) < 3600000;

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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>ICP Price Chart</CardTitle>
              <CardDescription>Historical price data with customizable timeframes</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && (
                <Badge variant="outline" className="text-blue-500 border-blue-500">
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Updating
                </Badge>
              )}
              {!isRecentData && (
                <Badge variant="outline" className="text-yellow-500 border-yellow-500">
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
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              className="text-xs"
              minTickGap={50}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            {alerts?.map((alert) => (
              <ReferenceLine
                key={alert.price}
                y={alert.price}
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
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
