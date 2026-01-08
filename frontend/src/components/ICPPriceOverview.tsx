import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useICPPrice, useDailyHighLow } from '@/hooks/useQueries';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function ICPPriceOverview() {
  const { data: currentPrice, isLoading: isPriceLoading, error: priceError, refetch: refetchPrice } = useICPPrice();
  const { data: dailyHighLow, isLoading: isHighLowLoading } = useDailyHighLow();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);

  // Update current time every second for live display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Track price changes
  useEffect(() => {
    if (currentPrice && previousPrice === null) {
      setPreviousPrice(currentPrice);
    }
  }, [currentPrice, previousPrice]);

  // Calculate 24h change (simplified - using high/low as reference)
  const priceChange24h = dailyHighLow && currentPrice
    ? ((currentPrice - dailyHighLow.low) / dailyHighLow.low) * 100
    : 0;

  const isPositive = priceChange24h >= 0;

  if (priceError) {
    return (
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
    );
  }

  return (
    <Card className="border-2 bg-gradient-to-br from-card via-card/95 to-card/90 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
      <CardContent className="p-6 md:p-8">
        <div className="space-y-6">
          {/* Header with Time */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl md:text-3xl font-bold">Current Price</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-mono">
                  {format(currentTime, 'MMM dd, yyyy • HH:mm:ss')}
                </span>
              </div>
            </div>
            {currentPrice && (
              <Badge 
                variant={isPositive ? 'default' : 'destructive'} 
                className="text-base px-4 py-2 animate-scale-in"
              >
                {isPositive ? <TrendingUp className="mr-2 h-5 w-5" /> : <TrendingDown className="mr-2 h-5 w-5" />}
                {isPositive ? '+' : ''}
                {priceChange24h.toFixed(2)}%
              </Badge>
            )}
          </div>

          {/* Price Display */}
          {isPriceLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-64" />
              <Skeleton className="h-6 w-full max-w-md" />
            </div>
          ) : currentPrice ? (
            <div className="space-y-4">
              <div className="text-6xl md:text-7xl font-bold tracking-tight transition-all duration-300 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ${currentPrice.toFixed(3)}
              </div>
              
              {/* 24h High/Low */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {isHighLowLoading ? (
                  <>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-32" />
                  </>
                ) : dailyHighLow ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">24h High:</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${dailyHighLow.high.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">24h Low:</span>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        ${dailyHighLow.low.toFixed(3)}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
