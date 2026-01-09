import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCryptoPrice, useCryptoDailyHighLow } from '@/hooks/useQueries';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import type { CryptoId } from '@/components/MultiCryptoDashboard';

interface CryptoPriceOverviewProps {
  cryptoId: CryptoId;
}

export function CryptoPriceOverview({ cryptoId }: CryptoPriceOverviewProps) {
  const { data: priceData, isLoading: isPriceLoading, error: priceError, refetch: refetchPrice, isFetching } = useCryptoPrice(cryptoId);
  const { data: dailyHighLow, isLoading: isHighLowLoading } = useCryptoDailyHighLow(cryptoId);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | null>(null);

  const currentPrice = priceData?.price;
  const priceChange24h = priceData?.priceChange24h || 0;

  // Update current time every second for live display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Track price changes and trigger animations
  useEffect(() => {
    if (currentPrice !== undefined && previousPrice !== null && currentPrice !== previousPrice) {
      setPriceAnimation(currentPrice > previousPrice ? 'up' : 'down');
      const timer = setTimeout(() => setPriceAnimation(null), 1000);
      setPreviousPrice(currentPrice);
      return () => clearTimeout(timer);
    } else if (currentPrice !== undefined && previousPrice === null) {
      setPreviousPrice(currentPrice);
    }
  }, [currentPrice, previousPrice]);

  const isPositive = priceChange24h >= 0;

  if (priceError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Unable to fetch live price data. Please check your connection and try again.</span>
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
          {/* Header with Time and Live Indicator */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl md:text-3xl font-bold">Current Price</h3>
                {isFetching && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-medium">Live</span>
                  </div>
                )}
              </div>
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
              <div 
                className={`text-6xl md:text-7xl font-bold tracking-tight transition-all duration-500 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${
                  priceAnimation === 'up' ? 'scale-105' : priceAnimation === 'down' ? 'scale-95' : ''
                }`}
              >
                ${currentPrice < 1 ? currentPrice.toFixed(4) : currentPrice.toFixed(3)}
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
                        ${dailyHighLow.high < 1 ? dailyHighLow.high.toFixed(4) : dailyHighLow.high.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">24h Low:</span>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        ${dailyHighLow.low < 1 ? dailyHighLow.low.toFixed(4) : dailyHighLow.low.toFixed(3)}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Price data is currently unavailable. Retrying...
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
