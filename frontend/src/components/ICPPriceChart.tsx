import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useICPHistoricalData, usePriceAlerts } from '@/hooks/useQueries';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { Info } from 'lucide-react';

export function ICPPriceChart() {
  const { data: historicalData, isLoading, error } = useICPHistoricalData();
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

  if (error || !historicalData || historicalData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>7-Day Price Chart</CardTitle>
          <CardDescription>Historical price data with alert levels</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Unable to load chart data. The system will retry automatically.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Check if data is from cache/synthetic
  const isRecentData = historicalData.length > 0 && 
    (Date.now() - historicalData[historicalData.length - 1].timestamp) < 3600000; // Less than 1 hour old

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>7-Day Price Chart</CardTitle>
            <CardDescription>Historical price data with alert levels</CardDescription>
          </div>
          {!isRecentData && (
            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
              <Info className="mr-1 h-3 w-3" />
              Cached Data
            </Badge>
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
                stroke={alert.isTriggered ? 'hsl(var(--green-500))' : 'hsl(var(--destructive))'}
                strokeDasharray="3 3"
                label={{
                  value: `$${alert.price.toFixed(2)}`,
                  position: 'right',
                  fill: alert.isTriggered ? 'hsl(var(--green-500))' : 'hsl(var(--destructive))',
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
