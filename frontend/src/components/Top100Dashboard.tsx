import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
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
import { Top100FilterBar, type FilterState, type MetricSortField, type SortDirection } from './Top100FilterBar';
import { PriceProjectionsSection } from './PriceProjectionsSection';
import { formatPrice, formatLargeNumber } from '@/utils/projections';

const PAGE_SIZE = 25;

type TableSortField =
  | 'market_cap_rank'
  | 'current_price'
  | 'price_change_percentage_24h'
  | 'market_cap'
  | 'total_volume'
  | 'buy_ratio'
  | 'fully_diluted_valuation';

interface Column {
  key: string;
  label: string;
  sortField?: TableSortField;
  align?: 'right' | 'left';
  hideOnMobile?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'rank', label: '#', sortField: 'market_cap_rank', align: 'left' },
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

function sortByField(
  coins: CoinMarketData[],
  field: TableSortField | MetricSortField,
  direction: SortDirection
): CoinMarketData[] {
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

export function Top100Dashboard() {
  const { data: coins, isLoading, isError, error, refetch, isFetching } = useTopCoins();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    activeMetric: null,
    sortDirection: 'desc',
  });
  const [page, setPage] = useState(1);
  const [tableSortField, setTableSortField] = useState<TableSortField | null>(null);
  const [tableSortDir, setTableSortDir] = useState<SortDirection>('desc');

  const handleColumnSort = (field: TableSortField | undefined) => {
    if (!field) return;
    // Column sort overrides metric sort
    setFilters((f) => ({ ...f, activeMetric: null }));
    if (tableSortField === field) {
      setTableSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setTableSortField(field);
      setTableSortDir('desc');
    }
    setPage(1);
  };

  const handleFilterChange = (f: FilterState) => {
    // Metric sort overrides column sort
    if (f.activeMetric !== null) {
      setTableSortField(null);
    }
    setFilters(f);
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

    // Apply sort: metric filter bar takes priority, then column sort
    if (filters.activeMetric) {
      result = sortByField(result, filters.activeMetric, filters.sortDirection);
    } else if (tableSortField) {
      result = sortByField(result, tableSortField, tableSortDir);
    }

    return result;
  }, [coins, filters, tableSortField, tableSortDir]);

  const totalPages = Math.ceil(processedCoins.length / PAGE_SIZE);
  const paginatedCoins = processedCoins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getActiveSortField = (): TableSortField | MetricSortField | null => {
    if (filters.activeMetric) return filters.activeMetric;
    return tableSortField;
  };

  const getActiveSortDir = (): SortDirection => {
    if (filters.activeMetric) return filters.sortDirection;
    return tableSortDir;
  };

  const SortIcon = ({ field }: { field: TableSortField | undefined }) => {
    if (!field) return null;
    const active = getActiveSortField();
    const dir = getActiveSortDir();
    if (active !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return dir === 'desc' ? (
      <ArrowDown className="h-3 w-3 ml-1 text-cyan-accent" />
    ) : (
      <ArrowUp className="h-3 w-3 ml-1 text-cyan-accent" />
    );
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push(-1); // ellipsis
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push(-2); // ellipsis
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, page]);

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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
            Top 100 Cryptocurrencies
          </h2>
          <p className="text-sm sm:text-base text-white/80 mt-1 drop-shadow">
            Live market data · Auto-refreshes every 60s
          </p>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 py-6 max-w-screen-2xl">
        {/* Filter Bar */}
        <Top100FilterBar filters={filters} onChange={handleFilterChange} />

        {/* Status bar */}
        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
          <span>
            {isLoading
              ? 'Loading market data…'
              : `Showing ${processedCoins.length} of 100 coins`}
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
            className="h-7 px-2 text-xs gap-1 hover:text-cyan-accent"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error state */}
        {isError && (
          <div className="glass-panel rounded-xl p-8 flex flex-col items-center gap-3 text-center mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="font-semibold text-foreground">Failed to load market data</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {error instanceof Error ? error.message : 'An unexpected error occurred.'}
            </p>
            <Button size="sm" onClick={() => refetch()} className="gap-2 mt-1">
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
                      className={[
                        'text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-3',
                        col.align === 'right' ? 'text-right' : 'text-left',
                        col.hideOnMobile ? 'hidden md:table-cell' : '',
                        col.sortField ? 'cursor-pointer select-none hover:text-foreground transition-colors' : '',
                      ].join(' ')}
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
                            className={['px-3', col.hideOnMobile ? 'hidden md:table-cell' : ''].join(' ')}
                          >
                            <Skeleton className="h-4 w-full rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : paginatedCoins.map((coin, idx) => {
                      const change = coin.price_change_percentage_24h ?? 0;
                      const buyRatio = getBuyRatio(coin);
                      const isPositive = change >= 0;
                      const globalRank = (page - 1) * PAGE_SIZE + idx + 1;

                      return (
                        <TableRow
                          key={coin.id}
                          className="border-white/5 hover:bg-white/[0.04] transition-colors cursor-default"
                        >
                          {/* Rank */}
                          <TableCell className="text-muted-foreground text-sm font-mono w-10 px-3">
                            {coin.market_cap_rank ?? globalRank}
                          </TableCell>

                          {/* Name */}
                          <TableCell className="min-w-[140px] px-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={coin.image}
                                alt={coin.name}
                                className="h-7 w-7 rounded-full flex-shrink-0 ring-1 ring-white/10"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-sm truncate max-w-[130px]">
                                  {coin.name}
                                </div>
                                <div className="text-xs text-muted-foreground uppercase font-mono">
                                  {coin.symbol}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Price */}
                          <TableCell className="text-right font-mono text-sm font-medium px-3">
                            {formatPrice(coin.current_price)}
                          </TableCell>

                          {/* 24h Change */}
                          <TableCell className="text-right px-3">
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
                          <TableCell className="text-right text-sm hidden md:table-cell text-muted-foreground px-3">
                            {formatLargeNumber(coin.market_cap)}
                          </TableCell>

                          {/* Volume */}
                          <TableCell className="text-right text-sm hidden md:table-cell text-muted-foreground px-3">
                            {formatLargeNumber(coin.total_volume)}
                          </TableCell>

                          {/* Buy Ratio */}
                          <TableCell className="text-right hidden md:table-cell px-3">
                            <span
                              className={`text-sm font-mono font-medium ${
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
                          <TableCell className="text-right text-sm hidden md:table-cell text-muted-foreground px-3">
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
                className="h-8 px-2 border-white/10 bg-background/50 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {pageNumbers.map((num, i) =>
                num < 0 ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-xs">
                    …
                  </span>
                ) : (
                  <Button
                    key={num}
                    variant={page === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(num)}
                    className={`h-8 w-8 p-0 text-xs border-white/10 ${
                      page === num
                        ? 'bg-cyan-accent text-background border-cyan-accent hover:bg-cyan-accent/90'
                        : 'bg-background/50 hover:bg-white/10'
                    }`}
                  >
                    {num}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-2 border-white/10 bg-background/50 hover:bg-white/10"
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
