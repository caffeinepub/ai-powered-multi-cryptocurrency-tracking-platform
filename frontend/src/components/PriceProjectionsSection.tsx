import React, { useState, useMemo } from 'react';
import { TrendingUp, Info, Search, AlertCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCoinHistory, type CoinMarketData } from '@/hooks/useQueries';
import { generateProjections, formatPrice, formatLargeNumber } from '@/utils/projections';

interface PriceProjectionsSectionProps {
  coins: CoinMarketData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg p-3 text-xs border border-white/10 shadow-xl">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span style={{ color: entry.color }}>●</span>
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-mono font-medium">{formatPrice(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function PriceProjectionsSection({ coins }: PriceProjectionsSectionProps) {
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCoin = useMemo(
    () => coins.find((c) => c.id === selectedCoinId) ?? null,
    [coins, selectedCoinId]
  );

  const { data: history, isLoading: histLoading, isError: histError } = useCoinHistory(selectedCoinId);

  const projections = useMemo(() => {
    if (!selectedCoin || !history || history.length < 5) return null;
    const prices = history.map((p) => p.price);
    return generateProjections(selectedCoin.current_price, prices);
  }, [selectedCoin, history]);

  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) return coins.slice(0, 150);
    const q = searchQuery.toLowerCase();
    return coins.filter(
      (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    );
  }, [coins, searchQuery]);

  const chartData = useMemo(() => {
    if (!projections) return [];
    return projections.map((p) => ({
      name: p.label,
      low: parseFloat(p.low.toFixed(6)),
      mid: parseFloat(p.mid.toFixed(6)),
      high: parseFloat(p.high.toFixed(6)),
    }));
  }, [projections]);

  return (
    <section className="mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-accent/30 to-gold-accent/30 border border-white/10">
          <TrendingUp className="h-5 w-5 text-cyan-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Price Projections</h2>
          <p className="text-xs text-muted-foreground">12-Month Rolling Forecast</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4 sm:p-6">
        {/* Coin Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Select a cryptocurrency to project
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Filter coins…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-background/60 border border-white/10 focus:border-cyan-accent/60 focus:outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select
              value={selectedCoinId ?? ''}
              onValueChange={(v) => setSelectedCoinId(v || null)}
            >
              <SelectTrigger className="h-9 text-sm w-full sm:w-[260px] bg-background/50 border-white/10 focus:border-cyan-accent/60">
                <SelectValue placeholder="Choose a coin…" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-white/10 max-h-64">
                {filteredCoins.map((coin) => (
                  <SelectItem key={coin.id} value={coin.id} className="text-sm">
                    <span className="flex items-center gap-2">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="h-4 w-4 rounded-full"
                        loading="lazy"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                      {coin.name}
                      <span className="text-muted-foreground uppercase text-xs">
                        {coin.symbol}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty state */}
        {!selectedCoinId && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <TrendingUp className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              Select a coin above to view its 12-month price projection
            </p>
          </div>
        )}

        {/* Loading */}
        {selectedCoinId && histLoading && (
          <div className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-8 rounded" />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {selectedCoinId && histError && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load historical data. Please try again.
            </p>
          </div>
        )}

        {/* Projections content */}
        {selectedCoin && projections && !histLoading && (
          <>
            {/* Coin header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
              <img
                src={selectedCoin.image}
                alt={selectedCoin.name}
                className="h-10 w-10 rounded-full"
              />
              <div>
                <h3 className="font-bold text-lg">{selectedCoin.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="uppercase font-mono">{selectedCoin.symbol}</span>
                  <span>·</span>
                  <span>Current: {formatPrice(selectedCoin.current_price)}</span>
                  <span
                    className={`font-semibold ${
                      (selectedCoin.price_change_percentage_24h ?? 0) >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {(selectedCoin.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}
                    {(selectedCoin.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                12-Month Price Projection Chart
              </h4>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="midGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatPrice(v).replace('$', '$')}
                      width={70}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="high"
                      stroke="#22d3ee"
                      strokeWidth={1}
                      strokeDasharray="4 2"
                      fill="url(#highGrad)"
                      name="High"
                    />
                    <Area
                      type="monotone"
                      dataKey="mid"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      fill="url(#midGrad)"
                      name="Mid"
                    />
                    <Area
                      type="monotone"
                      dataKey="low"
                      stroke="#f59e0b"
                      strokeWidth={1}
                      strokeDasharray="4 2"
                      fill="url(#lowGrad)"
                      name="Low"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Table */}
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Monthly Breakdown
              </h4>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">Month</TableHead>
                      <TableHead className="text-xs text-muted-foreground text-right">Low</TableHead>
                      <TableHead className="text-xs text-muted-foreground text-right">Mid</TableHead>
                      <TableHead className="text-xs text-muted-foreground text-right">High</TableHead>
                      <TableHead className="text-xs text-muted-foreground text-right">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projections.map((proj) => {
                      const midChange =
                        ((proj.mid - selectedCoin.current_price) / selectedCoin.current_price) * 100;
                      return (
                        <TableRow key={proj.month} className="border-white/5 hover:bg-white/5">
                          <TableCell className="text-sm font-medium">
                            <span className="text-muted-foreground mr-2 font-mono text-xs">
                              M{proj.month}
                            </span>
                            {proj.label}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-red-400">
                            {formatPrice(proj.low)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">
                            <span className={midChange >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {formatPrice(proj.mid)}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              ({midChange >= 0 ? '+' : ''}
                              {midChange.toFixed(1)}%)
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-emerald-400">
                            {formatPrice(proj.high)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={`text-xs font-mono border-0 ${
                                proj.confidence >= 70
                                  ? 'bg-emerald-400/10 text-emerald-400'
                                  : proj.confidence >= 50
                                  ? 'bg-gold-accent/10 text-gold-accent'
                                  : 'bg-red-400/10 text-red-400'
                              }`}
                            >
                              {proj.confidence}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-gold-accent" />
              <p>
                <strong className="text-foreground">Disclaimer:</strong> Projections are derived
                from 30-day historical price trends using log-normal momentum and linear regression
                models. Confidence scores reflect historical volatility — lower volatility yields
                higher confidence. These projections are{' '}
                <strong className="text-foreground">not financial advice</strong> and should not be
                used as the sole basis for investment decisions. Cryptocurrency markets are highly
                volatile and past performance does not guarantee future results.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
