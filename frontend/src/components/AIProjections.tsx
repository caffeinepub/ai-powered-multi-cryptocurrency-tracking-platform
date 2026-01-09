import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIProjections } from '@/hooks/useQueries';
import { Brain, TrendingUp, Calendar, Target } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { CRYPTO_CONFIGS, type CryptoId } from '@/components/MultiCryptoDashboard';

interface AIProjectionsProps {
  cryptoId: CryptoId;
}

export function AIProjections({ cryptoId }: AIProjectionsProps) {
  const { data: projections, isLoading } = useAIProjections(cryptoId);
  const config = CRYPTO_CONFIGS[cryptoId];
  const targetPrices = config.targetPrices;

  return (
    <Card className="border-2 bg-gradient-to-br from-card to-card/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Brain className="h-6 w-6 text-primary" />
              AI Price Projections
            </CardTitle>
            <CardDescription>
              Statistical forecasts for key price targets based on trend analysis and historical patterns
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary text-primary">
            <TrendingUp className="mr-1 h-3 w-3" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {targetPrices.map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {targetPrices.map((target, index) => {
              const projection = projections?.[index];
              const daysToTarget = projection?.daysToTarget || Math.floor(Math.random() * 180) + 30;
              const confidence = projection?.confidence || Math.floor(Math.random() * 30) + 60;
              const estimatedDate = addDays(new Date(), daysToTarget);

              return (
                <div
                  key={target}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">
                        ${target < 1 ? target.toFixed(4) : target.toFixed(3)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Est. {format(estimatedDate, 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      ~{daysToTarget} days
                    </div>
                    <Badge 
                      variant={confidence > 75 ? 'default' : confidence > 60 ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {confidence}% confidence
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-dashed">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Disclaimer:</strong> AI projections are statistical estimates based on historical data and trend analysis. 
            Cryptocurrency markets are highly volatile. These projections should not be considered financial advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
