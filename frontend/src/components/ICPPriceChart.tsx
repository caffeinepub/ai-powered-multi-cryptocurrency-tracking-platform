import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useICPHistoricalData, usePriceAlerts } from '@/hooks/useQueries';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ICPPriceChart() {
  const { data: historicalData, isLoading, error, refetch, isFetching } = useICPHistoricalData();
  const { data: alerts } = usePriceAlerts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>7-Day Price Chart</CardTitle>
          <CardDescription>Historical price data with alert levels</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show error alert but keep displaying cached data if available
  const showErrorAlert = error && !historicalData;

  if (showErrorAlert) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>7-Day Price Chart</CardTitle>
          <CardDescription>Historical price data with alert levels</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Chart data temporarily unavailable. Please try again.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="ml-4"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!historicalData || historicalData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>7-Day Price Chart</CardTitle>
            <CardDescription>
              Historical price data with alert levels
              {error && <span className="text-yellow-500 ml-2">(Using cached data)</span>}
            </CardDescription>
          </div>
          {error && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              className="text-xs"
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              className="text-xs"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy HH:mm')}
              formatter={(value: number) => [`$${value.toFixed(3)}`, 'Price']}
            />
            {alerts?.map((alert) => (
              <ReferenceLine
                key={alert.price}
                y={alert.price}
                stroke={alert.isActive ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'}
                strokeDasharray="3 3"
                strokeOpacity={alert.isActive ? 1 : 0.3}
                label={{
                  value: `$${alert.price.toFixed(2)}`,
                  position: 'right',
                  fill: alert.isActive ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
                  fontSize: 12,
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
