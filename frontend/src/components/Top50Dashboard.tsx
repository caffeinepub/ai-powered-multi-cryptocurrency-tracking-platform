import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { TrendingUp, TrendingDown, Search, AlertCircle, RefreshCw, X } from 'lucide-react';

export function Top50Dashboard() {
  const { data: cryptos, isLoading, error, refetch } = useTop50Cryptocurrencies();
  const [searchQuery, setSearchQuery] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [changeFilter, setChangeFilter] = useState('');
  const [marketCapFilter, setMarketCapFilter] = useState('');

  const filteredCryptos = useMemo(() => {
    if (!cryptos) return [];

    return cryptos.filter((crypto) => {
      // Global search filter
      const matchesSearch = searchQuery === '' || 
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase());

      // Column-specific filters
      const matchesName = nameFilter === '' || 
        crypto.name.toLowerCase().includes(nameFilter.toLowerCase());
      
      const matchesSymbol = symbolFilter === '' || 
        crypto.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
      
      const matchesPrice = priceFilter === '' || 
        crypto.current_price.toString().includes(priceFilter);
      
      const matchesChange = changeFilter === '' || 
        crypto.price_change_percentage_24h.toFixed(2).includes(changeFilter);
      
      const matchesMarketCap = marketCapFilter === '' || 
        (crypto.market_cap / 1e9).toFixed(2).includes(marketCapFilter);

      return matchesSearch && matchesName && matchesSymbol && 
             matchesPrice && matchesChange && matchesMarketCap;
    });
  }, [cryptos, searchQuery, nameFilter, symbolFilter, priceFilter, changeFilter, marketCapFilter]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setNameFilter('');
    setSymbolFilter('');
    setPriceFilter('');
    setChangeFilter('');
    setMarketCapFilter('');
  };

  const hasActiveFilters = searchQuery || nameFilter || symbolFilter || 
                          priceFilter || changeFilter || marketCapFilter;

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Top 50 Cryptocurrencies</h2>
          <p className="text-muted-foreground">Live market data by market capitalization</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Data temporarily unavailable. Please try again.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="ml-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
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
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cryptocurrencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="whitespace-nowrap"
                >
                  <X className="mr-1 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
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
                    <TableHead>
                      <div className="space-y-2">
                        <div>Name</div>
                        <Input
                          placeholder="Filter name..."
                          value={nameFilter}
                          onChange={(e) => setNameFilter(e.target.value)}
                          className="h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div>Symbol</div>
                        <Input
                          placeholder="Filter symbol..."
                          value={symbolFilter}
                          onChange={(e) => setSymbolFilter(e.target.value)}
                          className="h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="space-y-2">
                        <div>Price</div>
                        <Input
                          placeholder="Filter price..."
                          value={priceFilter}
                          onChange={(e) => setPriceFilter(e.target.value)}
                          className="h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="space-y-2">
                        <div>24h Change</div>
                        <Input
                          placeholder="Filter change..."
                          value={changeFilter}
                          onChange={(e) => setChangeFilter(e.target.value)}
                          className="h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      <div className="space-y-2">
                        <div>Market Cap</div>
                        <Input
                          placeholder="Filter cap..."
                          value={marketCapFilter}
                          onChange={(e) => setMarketCapFilter(e.target.value)}
                          className="h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </TableHead>
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
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground uppercase">
                              {crypto.symbol}
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
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {hasActiveFilters 
                          ? 'No cryptocurrencies found matching your filters'
                          : 'No data available'}
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
