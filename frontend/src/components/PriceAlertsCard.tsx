import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAddAlert, useRemoveAlert, useToggleAlert } from '@/hooks/useQueries';
import { Bell, BellOff, Check, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { PriceAlertStatus } from '@/backend';

interface PriceAlertsCardProps {
  alerts?: PriceAlertStatus[];
  currentPrice?: number;
}

export function PriceAlertsCard({ alerts, currentPrice }: PriceAlertsCardProps) {
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const addAlert = useAddAlert();
  const removeAlert = useRemoveAlert();
  const toggleAlert = useToggleAlert();

  const handleAddAlert = async () => {
    const price = parseFloat(newAlertPrice);
    
    if (isNaN(price) || price <= 0) {
      toast.error('Invalid price', {
        description: 'Please enter a valid price greater than 0',
      });
      return;
    }

    try {
      await addAlert.mutateAsync(price);
      setNewAlertPrice('');
      toast.success('Alert added', {
        description: `You'll be notified when ICP reaches $${price.toFixed(3)}`,
      });
    } catch (error) {
      toast.error('Failed to add alert', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const handleRemoveAlert = async (price: number) => {
    try {
      await removeAlert.mutateAsync(price);
      toast.success('Alert removed', {
        description: `Alert for $${price.toFixed(3)} has been removed`,
      });
    } catch (error) {
      toast.error('Failed to remove alert', {
        description: 'Please try again',
      });
    }
  };

  const handleToggle = async (price: number) => {
    try {
      await toggleAlert.mutateAsync(price);
    } catch (error) {
      toast.error('Failed to toggle alert', {
        description: 'Please try again',
      });
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Price Alerts
            </CardTitle>
            <CardDescription>Manage target price notifications</CardDescription>
          </div>
          <Badge variant="outline">{alerts.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Alert */}
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.001"
            placeholder="Enter target price (e.g., 5.50)"
            value={newAlertPrice}
            onChange={(e) => setNewAlertPrice(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddAlert();
              }
            }}
            disabled={addAlert.isPending}
          />
          <Button
            onClick={handleAddAlert}
            disabled={addAlert.isPending || !newAlertPrice}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Alert List */}
        {alerts.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active alerts. Add a target price to get notified when ICP reaches it.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const isAbove = currentPrice ? currentPrice > alert.price : false;
              const isNear = currentPrice ? Math.abs(currentPrice - alert.price) / alert.price < 0.05 : false;
              const percentDiff = currentPrice 
                ? ((alert.price - currentPrice) / currentPrice * 100).toFixed(1)
                : '0';

              return (
                <div
                  key={alert.price}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                    alert.isTriggered 
                      ? 'border-green-500/50 bg-green-500/10' 
                      : isNear 
                      ? 'border-yellow-500/50 bg-yellow-500/5' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      alert.isTriggered 
                        ? 'bg-green-500/20' 
                        : isNear 
                        ? 'bg-yellow-500/20' 
                        : 'bg-muted'
                    }`}>
                      {alert.isTriggered ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : isNear ? (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">${alert.price.toFixed(3)}</p>
                        {alert.isTriggered && (
                          <Badge variant="outline" className="text-green-500 border-green-500 text-xs">
                            Triggered
                          </Badge>
                        )}
                        {!alert.isTriggered && isNear && (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500 text-xs">
                            Near
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isAbove ? `${percentDiff}% below current` : `${Math.abs(parseFloat(percentDiff))}% above current`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(alert.price)}
                      disabled={toggleAlert.isPending}
                      title={alert.isTriggered ? 'Mark as pending' : 'Mark as triggered'}
                    >
                      {alert.isTriggered ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveAlert(alert.price)}
                      disabled={removeAlert.isPending}
                      title="Remove alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
