import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTopCoins, type CoinMarketData } from '@/hooks/useQueries';
import { Top150FilterBar, type FilterState, type SortField, type SortDirection } from './Top150FilterBar';
import { PriceProjectionsSection } from './PriceProjectionsSection';
import { formatPrice, formatLargeNumber } from '@/utils/projections';

const PAGE_SIZE = 25;

type ColumnKey = 'rank' | 'name' | 'price' | 'change24h' | 'market_cap' | 'volume' | 'buy_ratio' | 'fdv';

interface Column {
  key: ColumnKey;
  label: string;
  sortField?: SortField;
  align?: 'right' | 'left';
  hideOnMobile?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'rank', label: '#', align: 'left' },
  { key: 'name', label: 'Name', align: 'left' },
  { key: 'price', label: 'Price', sortField: 'current_price', align: 'right' },
  { key: 'change24h', label: '24h %', sortField: 'price_change_percentage_24h', align: 'right' },
  { key: 'market_cap', label: 'Market Cap', sortField: 'market_cap', align: 'right', hideOnMobile: true },
  { key: 'volume', label: '24h Volume', sortField: 'total_volume', align: 'right', hideOnMobile: true },
  { key: 'buy_ratio', label: 'Buy Ratio', sortField: 'buy_ratio', align: 'right', hideOnMobile: true },
  { key: 'fdv', label: 'Fully Diluted MC', sortField: 'fully_diluted_valuation', align: 'right', hideOnMobile: true },
];

function getBuyRatio(coin: CoinMarketData): number {
  if (!coin.market_cap || coin.market_cap === 0) return 0;
  return (coin.total_volume / coin.market_cap) * 100;
}

function sortCoins(coins: CoinMarketData[], field: SortField, direction: SortDirection): CoinMarketData[] {
  if (field === 'default') return coins;
  return [...coins].sort((a, b) => {
    let aVal: number;
    let bVal: number;
    if (field === 'buy_ratio') {
      aVal = getBuyRatio(a);
      bVal = getBuyRatio(b);
    } else {
      aVal = (a[field as keyof CoinMarketData] as number) ?? 0;
      bVal = (b[field as keyof CoinMarketData] as number) ?? 0;
    }
    return direction === 'desc' ? bVal - aVal : aVal - bVal;
  });
}

export function Top150Dashboard() {
  const { data: coins, isLoading, isError, error, refetch, isFetching } = useTopCoins();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortField: 'default',
    sortDirection: 'desc',
  });
  const [page, setPage] = useState(1);
  const [tableSortField, setTableSortField] = useState<SortField>('default');
  const [tableSortDir, setTableSortDir] = useState<SortDirection>('desc');

  const handleColumnSort = (field: SortField | undefined) => {
    if (!field) return;
    if (tableSortField === field) {
      setTableSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setTableSortField(field);
      setTableSortDir('desc');
    }
    setPage(1);
  };

  const processedCoins = useMemo(() => {
    if (!coins) return [];
    let result = [...coins];

    // Search filter
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }

    // Apply filter bar sort
    if (filters.sortField !== 'default') {
      result = sortCoins(result, filters.sortField, filters.sortDirection);
    } else if (tableSortField !== 'default') {
      result = sortCoins(result, tableSortField, tableSortDir);
    }

    return result;
  }, [coins, filters, tableSortField, tableSortDir]);

  const totalPages = Math.ceil(processedCoins.length / PAGE_SIZE);
  const paginatedCoins = processedCoins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (f: FilterState) => {
    setFilters(f);
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField | undefined }) => {
    if (!field) return null;
    const activeField = filters.sortField !== 'default' ? filters.sortField : tableSortField;
    const activeDir = filters.sortField !== 'default' ? filters.sortDirection : tableSortDir;
    if (activeField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return activeDir === 'desc' ? (
      <ArrowDown className="h-3 w-3 ml-1 text-cyan-accent" />
    ) : (
      <ArrowUp className="h-3 w-3 ml-1 text-cyan-accent" />
    );
  };

  return (
    <div className="w-full">
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden" style={{ maxHeight: 220 }}>
        <img
          src="/assets/generated/crypto-hero-banner.dim_1440x320.png"
          alt="Crypto Tracker AI"
          className="w-full object-cover object-center"
          style={{ maxHeight: 220 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
            Top 150 Cryptocurrencies
          </h2>
          <p className="text-sm sm:text-base text-white/80 mt-1 drop-shadow">
            Live market data · Auto-refreshes every 60s
          </p>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 py-6 max-w-screen-2xl">
        {/* Filter Bar */}
        <Top150FilterBar filters={filters} onChange={handleFilterChange} />

        {/* Status bar */}
        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
          <span>
            {isLoading ? 'Loading…' : `${processedCoins.length} coins`}
            {isFetching && !isLoading && (
              <span className="ml-2 inline-flex items-center gap-1 text-cyan-accent">
                <RefreshCw className="h-3 w-3 animate-spin" /> Refreshing
              </span>
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 px-2 text-xs gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error state */}
        {isError && (
          <div className="glass-panel rounded-xl p-6 flex flex-col items-center gap-3 text-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Failed to load market data.'}
            </p>
            <Button size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="glass-panel rounded-xl overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  {COLUMNS.map((col) => (
                    <TableHead
                      key={col.key}
                      className={`
                        text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3
                        ${col.align === 'right' ? 'text-right' : 'text-left'}
                        ${col.hideOnMobile ? 'hidden md:table-cell' : ''}
                        ${col.sortField ? 'cursor-pointer select-none hover:text-foreground' : ''}
                      `}
                      onClick={() => handleColumnSort(col.sortField)}
                    >
                      <span className="inline-flex items-center">
                        {col.label}
                        {col.sortField && <SortIcon field={col.sortField} />}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <TableRow key={i} className="border-white/5">
                        {COLUMNS.map((col) => (
                          <TableCell
                            key={col.key}
                            className={col.hideOnMobile ? 'hidden md:table-cell' : ''}
                          >
                            <Skeleton className="h-4 w-full rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : paginatedCoins.map((coin) => {
                      const change = coin.price_change_percentage_24h ?? 0;
                      const buyRatio = getBuyRatio(coin);
                      const isPositive = change >= 0;

                      return (
                        <TableRow
                          key={coin.id}
                          className="border-white/5 hover:bg-white/5 transition-colors cursor-default"
                        >
                          {/* Rank */}
                          <TableCell className="text-muted-foreground text-sm font-mono w-10">
                            {coin.market_cap_rank}
                          </TableCell>

                          {/* Name */}
                          <TableCell className="min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <img
                                src={coin.image}
                                alt={coin.name}
                                className="h-6 w-6 rounded-full flex-shrink-0"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-sm truncate max-w-[120px]">
                                  {coin.name}
                                </div>
                                <div className="text-xs text-muted-foreground uppercase">
                                  {coin.symbol}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Price */}
                          <TableCell className="text-right font-mono text-sm font-medium">
                            {formatPrice(coin.current_price)}
                          </TableCell>

                          {/* 24h Change */}
                          <TableCell className="text-right">
                            <span
                              className={`inline-flex items-center gap-0.5 text-sm font-semibold ${
                                isPositive ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )}
                              {Math.abs(change).toFixed(2)}%
                            </span>
                          </TableCell>

                          {/* Market Cap */}
                          <TableCell className="text-right text-sm hidden md:table-cell text-muted-foreground">
                            {formatLargeNumber(coin.market_cap)}
                          </TableCell>

                          {/* Volume */}
                          <TableCell className="text-right text-sm hidden md:table-cell text-muted-foreground">
                            {formatLargeNumber(coin.total_volume)}
                          </TableCell>

                          {/* Buy Ratio */}
                          <TableCell className="text-right hidden md:table-cell">
                            <span
                              className={`text-sm font-mono ${
                                buyRatio > 20
                                  ? 'text-emerald-400'
                                  : buyRatio > 10
                                  ? 'text-gold-accent'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {buyRatio.toFixed(2)}%
                            </span>
                          </TableCell>

                          {/* FDV */}
                          <TableCell className="text-right text-sm hidden md:table-cell text-muted-foreground">
                            {formatLargeNumber(coin.fully_diluted_valuation)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between text-sm mb-8">
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages} · {processedCoins.length} results
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-2 border-white/10 bg-background/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 p-0 text-xs border-white/10 ${
                      page === pageNum ? 'bg-cyan-accent text-background' : 'bg-background/50'
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-2 border-white/10 bg-background/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Price Projections Section */}
        <PriceProjectionsSection coins={coins ?? []} />
      </div>
    </div>
  );
}
