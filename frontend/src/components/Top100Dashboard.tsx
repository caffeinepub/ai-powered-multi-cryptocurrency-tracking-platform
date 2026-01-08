import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTop100Cryptocurrencies } from '@/hooks/useQueries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Search, AlertCircle, RefreshCw, X, Sparkles, Clock } from 'lucide-react';

export function Top100Dashboard() {
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const { data: cryptos, isLoading, error, refetch, isFetching } = useTop100Cryptocurrencies(refreshInterval);
  const [searchQuery, setSearchQuery] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [changeFilter, setChangeFilter] = useState('');
  const [marketCapFilter, setMarketCapFilter] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change' | 'volume'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // AI-powered analytics: Calculate market insights
  const marketInsights = useMemo(() => {
    if (!cryptos || cryptos.length === 0) return null;

    const totalMarketCap = cryptos.reduce((sum, c) => sum + (c.market_cap || 0), 0);
    const avgChange24h = cryptos.reduce((sum, c) => sum + c.price_change_percentage_24h, 0) / cryptos.length;
    
    // Volatility detection
    const volatilityThreshold = 10;
    const highVolatilityCoins = cryptos.filter(c => Math.abs(c.price_change_percentage_24h) > volatilityThreshold);
    
    // Trend strength analysis
    const bullishCoins = cryptos.filter(c => c.price_change_percentage_24h > 5);
    const bearishCoins = cryptos.filter(c => c.price_change_percentage_24h < -5);
    
    // Market sentiment
    const positiveCoins = cryptos.filter(c => c.price_change_percentage_24h > 0).length;
    const sentiment = positiveCoins / cryptos.length;
    
    let sentimentLabel = 'Neutral';
    let sentimentColor = 'text-yellow-500';
    if (sentiment > 0.6) {
      sentimentLabel = 'Bullish';
      sentimentColor = 'text-green-500';
    } else if (sentiment < 0.4) {
      sentimentLabel = 'Bearish';
      sentimentColor = 'text-red-500';
    }

    return {
      totalMarketCap,
      avgChange24h,
      highVolatilityCoins: highVolatilityCoins.length,
      bullishCoins: bullishCoins.length,
      bearishCoins: bearishCoins.length,
      sentiment: sentimentLabel,
      sentimentColor,
      sentimentPercentage: (sentiment * 100).toFixed(1),
    };
  }, [cryptos]);

  const filteredAndSortedCryptos = useMemo(() => {
    if (!cryptos) return [];

    let filtered = cryptos.filter((crypto) => {
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

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rank':
          comparison = a.market_cap_rank - b.market_cap_rank;
          break;
        case 'price':
          comparison = a.current_price - b.current_price;
          break;
        case 'change':
          comparison = a.price_change_percentage_24h - b.price_change_percentage_24h;
          break;
        case 'volume':
          comparison = a.total_volume - b.total_volume;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [cryptos, searchQuery, nameFilter, symbolFilter, priceFilter, changeFilter, marketCapFilter, sortBy, sortOrder]);

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

  const handleSort = (column: 'rank' | 'price' | 'change' | 'volume') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Top 100 Cryptocurrencies</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Top 100 Cryptocurrencies</h2>
        <p className="text-muted-foreground">Live market data by market capitalization with AI-powered insights</p>
      </div>

      {/* AI-Powered Market Insights */}
      {marketInsights && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Market Analytics</CardTitle>
            </div>
            <CardDescription>Real-time market sentiment and trend analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">Market Sentiment</div>
                <div className={`mt-2 text-2xl font-bold ${marketInsights.sentimentColor}`}>
                  {marketInsights.sentiment}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {marketInsights.sentimentPercentage}% positive
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">Avg 24h Change</div>
                <div className={`mt-2 text-2xl font-bold ${marketInsights.avgChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {marketInsights.avgChange24h >= 0 ? '+' : ''}{marketInsights.avgChange24h.toFixed(2)}%
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Market average
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">High Volatility</div>
                <div className="mt-2 text-2xl font-bold text-orange-500">
                  {marketInsights.highVolatilityCoins}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Assets with ±10% change
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">Trend Strength</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-green-500">↑{marketInsights.bullishCoins}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-lg font-bold text-red-500">↓{marketInsights.bearishCoins}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Strong movers (±5%)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Market Overview
                  {isFetching && (
                    <Badge variant="outline" className="border-blue-500 text-blue-500">
                      <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      Updating
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Real-time prices and 24h changes • {filteredAndSortedCryptos.length} of 100 assets</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Select value={refreshInterval.toString()} onValueChange={(v) => setRefreshInterval(parseInt(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15000">15s</SelectItem>
                      <SelectItem value="30000">30s</SelectItem>
                      <SelectItem value="60000">1m</SelectItem>
                      <SelectItem value="120000">2m</SelectItem>
                    </SelectContent>
                  </Select>
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
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="whitespace-nowrap"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            {/* Sort Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
              <Button
                variant={sortBy === 'rank' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('rank')}
              >
                Rank {sortBy === 'rank' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortBy === 'price' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('price')}
              >
                Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortBy === 'change' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('change')}
              >
                24h Change {sortBy === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant={sortBy === 'volume' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('volume')}
              >
                Volume {sortBy === 'volume' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
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
                          placeholder="Filter..."
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
                          placeholder="Filter..."
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
                          placeholder="Filter..."
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
                          placeholder="Filter..."
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
                          placeholder="Filter..."
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
                  {filteredAndSortedCryptos && filteredAndSortedCryptos.length > 0 ? (
                    filteredAndSortedCryptos.map((crypto) => {
                      const isPositive = crypto.price_change_percentage_24h >= 0;
                      const isHighVolatility = Math.abs(crypto.price_change_percentage_24h) > 10;
                      return (
                        <TableRow key={crypto.id} className="hover:bg-muted/50 transition-colors">
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
                            <div className="flex items-center justify-end gap-1">
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
                              {isHighVolatility && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Sparkles className="h-3 w-3 text-orange-500" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>High volatility</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
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
