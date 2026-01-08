import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useICPHistoricalData } from '@/hooks/useQueries';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

const ALERT_PRICES = [3.567, 4.885, 6.152, 9.828];

export function ICPPriceChart() {
  const { data: historicalData, isLoading } = useICPHistoricalData();

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

  if (!historicalData || historicalData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>7-Day Price Chart</CardTitle>
        <CardDescription>Historical price data with alert levels</CardDescription>
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
            {ALERT_PRICES.map((price) => (
              <ReferenceLine
                key={price}
                y={price}
                stroke="hsl(var(--destructive))"
                strokeDasharray="3 3"
                label={{
                  value: `$${price}`,
                  position: 'right',
                  fill: 'hsl(var(--destructive))',
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
