import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { ICPPortfolio } from '@/backend';

interface PortfolioCardProps {
  portfolio?: ICPPortfolio;
  currentPrice?: number;
  isLoading: boolean;
}

export function PortfolioCard({ portfolio, currentPrice, isLoading }: PortfolioCardProps) {
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
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!portfolio || !currentPrice) {
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
          <p className="text-sm text-muted-foreground">Portfolio data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const totalValue = portfolio.coins * currentPrice;
  const totalCost = portfolio.coins * portfolio.avgCost;
  const profitLoss = totalValue - totalCost;
  const profitLossPercentage = (profitLoss / totalCost) * 100;
  const isProfit = profitLoss >= 0;

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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Coins</p>
            <p className="text-2xl font-bold">{portfolio.coins.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average Cost</p>
            <p className="text-2xl font-bold">${portfolio.avgCost.toFixed(3)}</p>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Value</span>
            <span className="text-lg font-semibold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Cost</span>
            <span className="text-lg font-semibold">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Profit/Loss</span>
            <div className="flex items-center gap-2">
              <Badge variant={isProfit ? 'default' : 'destructive'} className="text-base">
                {isProfit ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                {isProfit ? '+' : ''}${Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Badge>
              <Badge variant={isProfit ? 'default' : 'destructive'}>
                {isProfit ? '+' : ''}{profitLossPercentage.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
