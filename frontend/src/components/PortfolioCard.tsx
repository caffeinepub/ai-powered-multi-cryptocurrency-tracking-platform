import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PortfolioCardProps {
  currentPrice?: number;
}

export function PortfolioCard({ currentPrice }: PortfolioCardProps) {
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
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Portfolio tracking feature coming soon. Connect your wallet to track your ICP holdings.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
