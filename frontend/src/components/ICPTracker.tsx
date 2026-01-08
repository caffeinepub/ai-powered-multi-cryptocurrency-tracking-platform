import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useICPPrice, useICPHistoricalData, usePortfolioSummary, usePriceAlerts } from '@/hooks/useQueries';
import { ICPPriceChart } from '@/components/ICPPriceChart';
import { PortfolioCard } from '@/components/PortfolioCard';
import { PriceAlertsCard } from '@/components/PriceAlertsCard';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ICPTracker() {
  const { data: currentPrice, isLoading: isPriceLoading, error: priceError, refetch: refetchPrice } = useICPPrice();
  const { data: historicalData, error: historicalError } = useICPHistoricalData();
  const { data: portfolio, isLoading: isPortfolioLoading } = usePortfolioSummary();
  const { data: alerts } = usePriceAlerts();
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);

  // Calculate 24h price change from historical data
  const priceChange24h = historicalData && currentPrice
    ? ((currentPrice - historicalData[0].price) / historicalData[0].price) * 100
    : 0;

  const high24h = historicalData
    ? Math.max(...historicalData.map(d => d.price), currentPrice || 0)
    : currentPrice || 0;

  const low24h = historicalData
    ? Math.min(...historicalData.map(d => d.price), currentPrice || 0)
    : currentPrice || 0;

  // Check for triggered alerts
  useEffect(() => {
    if (currentPrice && alerts && previousPrice !== null) {
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
    } else if (currentPrice && previousPrice === null) {
      setPreviousPrice(currentPrice);
    }
  }, [currentPrice, alerts, previousPrice]);

  if (priceError) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ICP Live Price Tracker</h2>
          <p className="text-muted-foreground">Real-time Internet Computer Protocol price monitoring</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Data temporarily unavailable. Please try again.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchPrice()}
              className="ml-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </section>
    );
  }

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
            {currentPrice && (
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
          ) : currentPrice ? (
            <div className="space-y-4">
              <div>
                <div className="text-5xl font-bold tracking-tight">
                  ${currentPrice.toFixed(3)}
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>24h High: ${high24h.toFixed(3)}</span>
                  <span>•</span>
                  <span>24h Low: ${low24h.toFixed(3)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Chart */}
      {historicalError ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Chart data temporarily unavailable.</span>
          </AlertDescription>
        </Alert>
      ) : (
        <ICPPriceChart />
      )}

      {/* Portfolio and Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <PortfolioCard portfolio={portfolio} currentPrice={currentPrice} isLoading={isPortfolioLoading} />
        <PriceAlertsCard alerts={alerts} currentPrice={currentPrice} />
      </div>
    </section>
  );
}
