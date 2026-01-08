import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToggleAlert } from '@/hooks/useQueries';
import { Bell, BellOff, Check, X } from 'lucide-react';
import type { PriceAlertStatus } from '@/backend';

interface PriceAlertsCardProps {
  alerts?: PriceAlertStatus[];
  currentPrice?: number;
}

export function PriceAlertsCard({ alerts, currentPrice }: PriceAlertsCardProps) {
  const toggleAlert = useToggleAlert();

  if (!alerts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Alerts</CardTitle>
          <CardDescription>Target price notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleToggle = async (price: number) => {
    await toggleAlert.mutateAsync(price);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Price Alerts
            </CardTitle>
            <CardDescription>Target price notifications</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isAbove = currentPrice ? currentPrice > alert.price : false;
            const isNear = currentPrice ? Math.abs(currentPrice - alert.price) / alert.price < 0.05 : false;

            return (
              <div
                key={alert.price}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  isNear ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    alert.isTriggered ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    {alert.isTriggered ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">${alert.price.toFixed(3)}</p>
                    <p className="text-xs text-muted-foreground">
                      {isAbove ? 'Above target' : 'Below target'}
                      {isNear && ' • Near target!'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {alert.isTriggered && (
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      Triggered
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(alert.price)}
                    disabled={toggleAlert.isPending}
                  >
                    {alert.isTriggered ? (
                      <BellOff className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
