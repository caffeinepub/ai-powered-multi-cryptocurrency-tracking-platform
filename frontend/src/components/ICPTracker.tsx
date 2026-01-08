import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useICPPrice, usePortfolioSummary, usePriceAlerts, useToggleAlert } from '@/hooks/useQueries';
import { ICPPriceChart } from '@/components/ICPPriceChart';
import { PortfolioCard } from '@/components/PortfolioCard';
import { PriceAlertsCard } from '@/components/PriceAlertsCard';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ICPTracker() {
  const { data: icpData, isLoading: isPriceLoading, error: priceError } = useICPPrice();
  const { data: portfolio, isLoading: isPortfolioLoading } = usePortfolioSummary();
  const { data: alerts } = usePriceAlerts();
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);

  // Check for triggered alerts
  useEffect(() => {
    if (icpData && alerts && previousPrice !== null) {
      const currentPrice = icpData.current_price;
      
      alerts.forEach((alert) => {
        if (!alert.isTriggered) {
          // Check if price crossed the alert threshold
          if (
            (previousPrice < alert.price && currentPrice >= alert.price) ||
            (previousPrice > alert.price && currentPrice <= alert.price)
          ) {
            toast.success(`Price Alert Triggered!`, {
              description: `ICP has reached $${alert.price.toFixed(3)}. Current price: $${currentPrice.toFixed(3)}`,
              duration: 10000,
            });
          }
        }
      });
      
      setPreviousPrice(currentPrice);
    } else if (icpData && previousPrice === null) {
      setPreviousPrice(icpData.current_price);
    }
  }, [icpData, alerts, previousPrice]);

  if (priceError) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ICP Live Price Tracker</h2>
          <p className="text-muted-foreground">Real-time Internet Computer Protocol price monitoring</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load ICP price data. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const priceChange24h = icpData?.price_change_percentage_24h || 0;
  const isPositive = priceChange24h >= 0;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">ICP Live Price Tracker</h2>
        <p className="text-muted-foreground">Real-time Internet Computer Protocol price monitoring</p>
      </div>

      {/* Current Price Card */}
      <Card className="border-2 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Internet Computer (ICP)</CardTitle>
              <CardDescription>Live Price • Updates every 30s</CardDescription>
            </div>
            {icpData && (
              <Badge variant={isPositive ? 'default' : 'destructive'} className="text-sm">
                {isPositive ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                {isPositive ? '+' : ''}
                {priceChange24h.toFixed(2)}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isPriceLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : icpData ? (
            <div className="space-y-4">
              <div>
                <div className="text-5xl font-bold tracking-tight">
                  ${icpData.current_price.toFixed(3)}
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>24h High: ${icpData.high_24h.toFixed(3)}</span>
                  <span>•</span>
                  <span>24h Low: ${icpData.low_24h.toFixed(3)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Market Cap</p>
                  <p className="text-lg font-semibold">
                    ${(icpData.market_cap / 1e9).toFixed(2)}B
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">24h Volume</p>
                  <p className="text-lg font-semibold">
                    ${(icpData.total_volume / 1e6).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Market Cap Rank</p>
                  <p className="text-lg font-semibold">#{icpData.market_cap_rank}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Circulating Supply</p>
                  <p className="text-lg font-semibold">
                    {(icpData.circulating_supply / 1e6).toFixed(2)}M
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Chart */}
      <ICPPriceChart />

      {/* Portfolio and Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <PortfolioCard portfolio={portfolio} currentPrice={icpData?.current_price} isLoading={isPortfolioLoading} />
        <PriceAlertsCard alerts={alerts} currentPrice={icpData?.current_price} />
      </div>
    </section>
  );
}
