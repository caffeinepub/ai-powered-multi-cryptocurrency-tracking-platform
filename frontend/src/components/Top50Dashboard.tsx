import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTop50Cryptocurrencies } from '@/hooks/useQueries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Search, AlertCircle } from 'lucide-react';

export function Top50Dashboard() {
  const { data: cryptos, isLoading, error } = useTop50Cryptocurrencies();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCryptos = cryptos?.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Top 50 Cryptocurrencies</h2>
          <p className="text-muted-foreground">Live market data by market capitalization</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load cryptocurrency data. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Top 50 Cryptocurrencies</h2>
        <p className="text-muted-foreground">Live market data by market capitalization</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Market Overview</CardTitle>
              <CardDescription>Real-time prices and 24h changes</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search cryptocurrencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">24h Change</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Market Cap</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Volume (24h)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCryptos && filteredCryptos.length > 0 ? (
                    filteredCryptos.map((crypto) => {
                      const isPositive = crypto.price_change_percentage_24h >= 0;
                      return (
                        <TableRow key={crypto.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-muted-foreground">
                            {crypto.market_cap_rank}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={crypto.image}
                                alt={crypto.name}
                                className="h-8 w-8 rounded-full"
                              />
                              <div>
                                <div className="font-semibold">{crypto.name}</div>
                                <div className="text-xs text-muted-foreground uppercase">
                                  {crypto.symbol}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${crypto.current_price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: crypto.current_price < 1 ? 6 : 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={isPositive ? 'default' : 'destructive'}
                              className="font-semibold"
                            >
                              {isPositive ? (
                                <TrendingUp className="mr-1 h-3 w-3" />
                              ) : (
                                <TrendingDown className="mr-1 h-3 w-3" />
                              )}
                              {isPositive ? '+' : ''}
                              {crypto.price_change_percentage_24h.toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right hidden md:table-cell">
                            ${(crypto.market_cap / 1e9).toFixed(2)}B
                          </TableCell>
                          <TableCell className="text-right hidden lg:table-cell">
                            ${(crypto.total_volume / 1e9).toFixed(2)}B
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No cryptocurrencies found matching "{searchQuery}"
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
