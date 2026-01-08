import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useICPMarketData } from '@/hooks/useQueries';
import { TrendingUp, DollarSign, Activity, BarChart3 } from 'lucide-react';

export function MarketMetrics() {
  const { data: marketData, isLoading } = useICPMarketData();

  const metrics = [
    {
      title: 'Market Cap',
      value: marketData?.market_cap ? `$${(marketData.market_cap / 1e9).toFixed(2)}B` : 'N/A',
      icon: DollarSign,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: '24h Volume',
      value: marketData?.total_volume ? `$${(marketData.total_volume / 1e6).toFixed(2)}M` : 'N/A',
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Circulating Supply',
      value: marketData?.circulating_supply ? `${(marketData.circulating_supply / 1e6).toFixed(2)}M ICP` : 'N/A',
      icon: BarChart3,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Market Rank',
      value: marketData?.market_cap_rank ? `#${marketData.market_cap_rank}` : 'N/A',
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{metric.value}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
