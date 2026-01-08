import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown, AlertCircle, DollarSign, Coins } from 'lucide-react';
import { usePortfolioSummary } from '@/hooks/useQueries';
import { Progress } from '@/components/ui/progress';

export function PortfolioCard() {
  const { data: portfolio, isLoading, error } = usePortfolioSummary();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always',
    }).format(value / 100);
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfolio Summary
          </CardTitle>
          <CardDescription>Your ICP investment overview</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load portfolio data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfolio Summary
          </CardTitle>
          <CardDescription>Your ICP investment overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!portfolio) {
    return null;
  }

  const isProfit = portfolio.profitLossDollar >= 0;
  const originalInvestment = portfolio.coins * portfolio.avgCost;
  const roiProgress = Math.min(Math.max((portfolio.profitLossPercent + 100), 0), 200);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Portfolio Summary
            </CardTitle>
            <CardDescription>Your ICP investment overview</CardDescription>
          </div>
          <Badge variant={isProfit ? 'default' : 'destructive'} className="text-sm">
            {isProfit ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
            {formatPercentage(portfolio.profitLossPercent)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Holdings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Coins className="h-4 w-4" />
              Holdings
            </span>
            <span className="font-medium text-foreground">{formatNumber(portfolio.coins)} ICP</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Average Cost</span>
            <span className="font-medium text-foreground">{formatCurrency(portfolio.avgCost)}</span>
          </div>
        </div>

        {/* Current Value */}
        <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Current Value</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {formatCurrency(portfolio.currentValue)}
          </div>
          <div className="text-xs text-muted-foreground">
            Original Investment: {formatCurrency(originalInvestment)}
          </div>
        </div>

        {/* Profit/Loss */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Unrealized P/L</span>
            <div className="text-right">
              <div className={`text-lg font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isProfit ? '+' : ''}{formatCurrency(portfolio.profitLossDollar)}
              </div>
              <div className={`text-xs ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPercentage(portfolio.profitLossPercent)}
              </div>
            </div>
          </div>

          {/* ROI Visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>ROI Progress</span>
              <span>{roiProgress.toFixed(0)}%</span>
            </div>
            <Progress 
              value={roiProgress} 
              className={`h-2 ${isProfit ? '[&>*]:bg-green-600 dark:[&>*]:bg-green-400' : '[&>*]:bg-red-600 dark:[&>*]:bg-red-400'}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-100%</span>
              <span>0%</span>
              <span>+100%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
