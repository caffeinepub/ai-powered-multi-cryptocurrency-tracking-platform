import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useICPPrice, useICPHistoricalData, usePriceAlerts, useDailyHighLow } from '@/hooks/useQueries';
import { ICPPriceChart } from '@/components/ICPPriceChart';
import { PortfolioCard } from '@/components/PortfolioCard';
import { PriceAlertsCard } from '@/components/PriceAlertsCard';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function ICPTracker() {
  const { data: currentPrice, isLoading: isPriceLoading, error: priceError, refetch: refetchPrice } = useICPPrice();
  const { data: historicalData } = useICPHistoricalData('1d');
  const { data: alertsData } = usePriceAlerts();
  const { data: dailyHighLow, isLoading: isHighLowLoading } = useDailyHighLow();
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [notifiedAlerts, setNotifiedAlerts] = useState<Set<number>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Convert alerts from backend format [price, isTriggered] to frontend format
  const alerts = alertsData?.map(([price, isTriggered]) => ({ price, isTriggered }));

  // Calculate 24h price change from historical data
  const priceChange24h = historicalData && currentPrice && historicalData.length > 0
    ? ((currentPrice - historicalData[0].price) / historicalData[0].price) * 100
    : 0;

  // Check for triggered alerts
  useEffect(() => {
    if (currentPrice && alerts && previousPrice !== null) {
      alerts.forEach((alert) => {
        // Only notify for alerts that haven't been notified yet in this session
        if (!notifiedAlerts.has(alert.price)) {
          // Check if price crossed the alert threshold
          if (
            (previousPrice < alert.price && currentPrice >= alert.price) ||
            (previousPrice > alert.price && currentPrice <= alert.price)
          ) {
            toast.success(`Price Alert Triggered!`, {
              description: `ICP has reached $${alert.price.toFixed(3)}. Current price: $${currentPrice.toFixed(3)}`,
              duration: 10000,
            });
            setNotifiedAlerts(prev => new Set(prev).add(alert.price));
          }
        }
      });
      
      setPreviousPrice(currentPrice);
    } else if (currentPrice && previousPrice === null) {
      setPreviousPrice(currentPrice);
    }
  }, [currentPrice, alerts, previousPrice, notifiedAlerts]);

  // Reset notified alerts when alerts change (user adds/removes alerts)
  useEffect(() => {
    if (alerts) {
      setNotifiedAlerts(prev => {
        const newSet = new Set<number>();
        alerts.forEach(alert => {
          if (prev.has(alert.price)) {
            newSet.add(alert.price);
          }
        });
        return newSet;
      });
    }
  }, [alerts?.length]);

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
      <Card className="border-2 bg-gradient-to-br from-card to-card/50 transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Internet Computer (ICP)</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono text-xs">
                  {format(currentTime, 'MMM dd, yyyy • HH:mm:ss')}
                </span>
              </CardDescription>
            </div>
            {currentPrice && (
              <Badge variant={isPositive ? 'default' : 'destructive'} className="text-sm animate-scale-in">
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
                <div className="text-5xl font-bold tracking-tight transition-all duration-300">
                  ${currentPrice.toFixed(3)}
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  {isHighLowLoading ? (
                    <>
                      <Skeleton className="h-4 w-32" />
                      <span>•</span>
                      <Skeleton className="h-4 w-32" />
                    </>
                  ) : dailyHighLow ? (
                    <>
                      <span className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground/70">24h High:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${dailyHighLow.high.toFixed(3)}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground/70">24h Low:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          ${dailyHighLow.low.toFixed(3)}
                        </span>
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Chart - Always display, with fallback handling inside component */}
      <ICPPriceChart />

      {/* Portfolio and Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <PortfolioCard />
        <PriceAlertsCard alerts={alerts} currentPrice={currentPrice} />
      </div>
    </section>
  );
}
