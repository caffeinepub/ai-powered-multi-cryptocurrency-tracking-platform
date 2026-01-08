import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToggleAlert, useAddAlert, useDeleteAlert } from '@/hooks/useQueries';
import { Bell, BellOff, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AlertStatus } from '@/backend';

interface PriceAlertsCardProps {
  alerts?: AlertStatus[];
  currentPrice?: number;
}

export function PriceAlertsCard({ alerts, currentPrice }: PriceAlertsCardProps) {
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const toggleAlert = useToggleAlert();
  const addAlert = useAddAlert();
  const deleteAlert = useDeleteAlert();

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

  const handleToggle = async (price: number, currentActive: boolean) => {
    try {
      await toggleAlert.mutateAsync({ price, active: !currentActive });
      toast.success(
        !currentActive ? 'Alert activated' : 'Alert deactivated',
        {
          description: `Price alert for $${price.toFixed(3)} has been ${!currentActive ? 'activated' : 'deactivated'}.`,
        }
      );
    } catch (error) {
      toast.error('Failed to toggle alert', {
        description: 'Please try again.',
      });
    }
  };

  const handleAddAlert = async () => {
    const price = parseFloat(newAlertPrice);
    
    if (isNaN(price) || price <= 0) {
      toast.error('Invalid price', {
        description: 'Please enter a valid price greater than 0.',
      });
      return;
    }

    // Check if alert already exists
    if (alerts.some(alert => Math.abs(alert.price - price) < 0.001)) {
      toast.error('Alert already exists', {
        description: `An alert for $${price.toFixed(3)} already exists.`,
      });
      return;
    }

    try {
      await addAlert.mutateAsync(price);
      setNewAlertPrice('');
      toast.success('Alert added', {
        description: `Price alert for $${price.toFixed(3)} has been created.`,
      });
    } catch (error) {
      toast.error('Failed to add alert', {
        description: 'Please try again.',
      });
    }
  };

  const handleDeleteAlert = async (price: number) => {
    try {
      await deleteAlert.mutateAsync(price);
      toast.success('Alert deleted', {
        description: `Price alert for $${price.toFixed(3)} has been removed.`,
      });
    } catch (error) {
      toast.error('Failed to delete alert', {
        description: 'Please try again.',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddAlert();
    }
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
        <div className="space-y-4">
          {/* Add new alert input */}
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.001"
              placeholder="Enter target price (e.g., 5.50)"
              value={newAlertPrice}
              onChange={(e) => setNewAlertPrice(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={addAlert.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleAddAlert}
              disabled={addAlert.isPending || !newAlertPrice}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Alert list */}
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No price alerts configured</p>
                <p className="text-xs mt-1">Add a target price above to get started</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const isAbove = currentPrice ? currentPrice > alert.price : false;
                const isNear = currentPrice ? Math.abs(currentPrice - alert.price) / alert.price < 0.05 : false;
                const isTriggered = currentPrice ? 
                  (isAbove && alert.price < currentPrice) || (!isAbove && alert.price > currentPrice) : false;

                return (
                  <div
                    key={alert.price}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      isNear && alert.isActive ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        alert.isActive ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        {alert.isActive ? (
                          <Bell className="h-5 w-5 text-primary" />
                        ) : (
                          <BellOff className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">${alert.price.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">
                          {currentPrice ? (
                            <>
                              {isAbove ? 'Above target' : 'Below target'}
                              {isNear && alert.isActive && ' • Near target!'}
                            </>
                          ) : (
                            'Waiting for price data...'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {alert.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={() => handleToggle(alert.price, alert.isActive)}
                          disabled={toggleAlert.isPending}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAlert(alert.price)}
                        disabled={deleteAlert.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
