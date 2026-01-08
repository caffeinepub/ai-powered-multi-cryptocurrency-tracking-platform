import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Coins } from 'lucide-react';
import type { PortfolioSummary } from '@/backend';

interface PortfolioCardProps {
  portfolio?: PortfolioSummary;
  currentPrice?: number;
  isLoading: boolean;
}

export function PortfolioCard({ portfolio, currentPrice, isLoading }: PortfolioCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Portfolio</CardTitle>
          <CardDescription>Your ICP holdings summary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!portfolio || !currentPrice) {
    return null;
  }

  const totalValue = portfolio.coins * currentPrice;
  const totalCost = portfolio.coins * portfolio.avgCost;
  const profitLoss = totalValue - totalCost;
  const profitLossPercentage = ((profitLoss / totalCost) * 100);
  const isProfit = profitLoss >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Investment Portfolio
            </CardTitle>
            <CardDescription>Your ICP holdings summary</CardDescription>
          </div>
          <Badge variant={isProfit ? 'default' : 'destructive'} className="text-sm">
            {isProfit ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
            {isProfit ? '+' : ''}
            {profitLossPercentage.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Coins</p>
                <p className="text-2xl font-bold">{portfolio.coins.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Cost</p>
                <p className="text-2xl font-bold">${portfolio.avgCost.toFixed(3)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-gradient-to-br from-card to-muted/20 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Value</span>
                <span className="text-lg font-semibold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Cost</span>
                <span className="text-lg font-semibold">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profit/Loss</span>
                  <span className={`text-xl font-bold ${isProfit ? 'text-green-500' : 'text-destructive'}`}>
                    {isProfit ? '+' : ''}${profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
