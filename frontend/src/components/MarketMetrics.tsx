import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCryptoMarketData } from '@/hooks/useQueries';
import { DollarSign, TrendingUp, Coins, Award } from 'lucide-react';
import type { CryptoId } from '@/components/MultiCryptoDashboard';

interface MarketMetricsProps {
  cryptoId: CryptoId;
}

export function MarketMetrics({ cryptoId }: MarketMetricsProps) {
  const { data: marketData, isLoading } = useCryptoMarketData(cryptoId);

  const metrics = [
    {
      label: 'Market Cap',
      value: marketData?.market_cap ? `$${(marketData.market_cap / 1_000_000_000).toFixed(2)}B` : '-',
      icon: DollarSign,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: '24h Volume',
      value: marketData?.total_volume ? `$${(marketData.total_volume / 1_000_000).toFixed(2)}M` : '-',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Circulating Supply',
      value: marketData?.circulating_supply ? `${(marketData.circulating_supply / 1_000_000).toFixed(2)}M` : '-',
      icon: Coins,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Market Rank',
      value: marketData?.market_cap_rank ? `#${marketData.market_cap_rank}` : '-',
      icon: Award,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="border-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${metric.bgColor}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div className="text-sm text-muted-foreground">{metric.label}</div>
                  <div className="text-2xl font-bold">{metric.value}</div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
