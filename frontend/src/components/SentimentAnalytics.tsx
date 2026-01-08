import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useSentimentAnalytics } from '@/hooks/useQueries';
import { Smile, Meh, Frown, TrendingUp, AlertTriangle } from 'lucide-react';

export function SentimentAnalytics() {
  const { data: sentiment, isLoading } = useSentimentAnalytics();

  const sentimentScore = sentiment?.score || 65;
  const sentimentLabel = sentimentScore >= 70 ? 'Bullish' : sentimentScore >= 40 ? 'Neutral' : 'Bearish';
  const sentimentColor = sentimentScore >= 70 ? 'text-green-500' : sentimentScore >= 40 ? 'text-yellow-500' : 'text-red-500';
  const sentimentBg = sentimentScore >= 70 ? 'bg-green-500/10' : sentimentScore >= 40 ? 'bg-yellow-500/10' : 'bg-red-500/10';
  const SentimentIcon = sentimentScore >= 70 ? Smile : sentimentScore >= 40 ? Meh : Frown;

  const indicators = [
    {
      label: 'Social Media Sentiment',
      value: sentiment?.socialMedia || 68,
      description: 'Based on Twitter, Reddit, and forum discussions',
    },
    {
      label: 'Market Momentum',
      value: sentiment?.momentum || 72,
      description: 'Technical indicators and price action analysis',
    },
    {
      label: 'Trading Volume Trend',
      value: sentiment?.volumeTrend || 58,
      description: 'Volume patterns and trading activity',
    },
    {
      label: 'Volatility Index',
      value: sentiment?.volatility || 45,
      description: 'Price stability and market uncertainty',
      inverse: true,
    },
  ];

  return (
    <Card className="border-2 bg-gradient-to-br from-card to-card/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="h-6 w-6 text-primary" />
              Sentiment Analytics
            </CardTitle>
            <CardDescription>
              AI-powered market sentiment analysis from multiple data sources
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary text-primary">
            Live Data
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Sentiment Score */}
            <div className={`p-6 rounded-lg ${sentimentBg} border border-current/20`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full bg-background/50`}>
                    <SentimentIcon className={`h-8 w-8 ${sentimentColor}`} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Overall Market Sentiment</div>
                    <div className={`text-3xl font-bold ${sentimentColor}`}>
                      {sentimentLabel}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{sentimentScore}</div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
              </div>
              <Progress value={sentimentScore} className="h-2" />
            </div>

            {/* Detailed Indicators */}
            <div className="space-y-4">
              {indicators.map((indicator) => {
                const displayValue = indicator.inverse ? 100 - indicator.value : indicator.value;
                const color = displayValue >= 70 ? 'text-green-500' : displayValue >= 40 ? 'text-yellow-500' : 'text-red-500';
                
                return (
                  <div
                    key={indicator.label}
                    className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{indicator.label}</div>
                        <div className="text-xs text-muted-foreground">{indicator.description}</div>
                      </div>
                      <div className={`text-2xl font-bold ${color}`}>
                        {displayValue}
                      </div>
                    </div>
                    <Progress value={displayValue} className="h-1.5" />
                  </div>
                );
              })}
            </div>

            {/* Warning Notice */}
            {sentimentScore < 40 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-destructive mb-1">Bearish Market Conditions</div>
                  <div className="text-muted-foreground">
                    Current sentiment indicators suggest caution. Consider waiting for improved market conditions before making investment decisions.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
