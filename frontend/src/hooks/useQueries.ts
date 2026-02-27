import { useQuery } from '@tanstack/react-query';

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
}

export interface HistoricalPricePoint {
  timestamp: number;
  price: number;
}

let _topCoinsCache: { data: CoinMarketData[]; timestamp: number } | null = null;
const coinHistoryCache = new Map<string, { data: HistoricalPricePoint[]; timestamp: number }>();

export function useTopCoins() {
  return useQuery<CoinMarketData[]>({
    queryKey: ['top-100-coins'],
    queryFn: async () => {
      // Return in-memory cache if fresh (60s)
      if (_topCoinsCache && Date.now() - _topCoinsCache.timestamp < 60000) {
        return _topCoinsCache.data;
      }

      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',
        { headers: { Accept: 'application/json' } }
      );

      if (res.status === 429) {
        if (_topCoinsCache) return _topCoinsCache.data;
        throw new Error('Rate limit exceeded (429). Please wait a moment.');
      }

      if (!res.ok) {
        if (_topCoinsCache) return _topCoinsCache.data;
        throw new Error(`CoinGecko API error: ${res.status}`);
      }

      const data: CoinMarketData[] = await res.json();
      _topCoinsCache = { data, timestamp: Date.now() };
      return data;
    },
    refetchInterval: 60000,
    staleTime: 60000,
    gcTime: 1000 * 60 * 15,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('429')) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useCoinHistory(coinId: string | null) {
  return useQuery<HistoricalPricePoint[]>({
    queryKey: ['coin-history-30d', coinId],
    queryFn: async () => {
      if (!coinId) return [];

      const cached = coinHistoryCache.get(coinId);
      if (cached && Date.now() - cached.timestamp < 300000) {
        return cached.data;
      }

      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`,
        { headers: { Accept: 'application/json' } }
      );

      if (res.status === 429) {
        const c = coinHistoryCache.get(coinId);
        if (c) return c.data;
        throw new Error('Rate limit exceeded (429).');
      }

      if (!res.ok) {
        const c = coinHistoryCache.get(coinId);
        if (c) return c.data;
        throw new Error(`CoinGecko API error: ${res.status}`);
      }

      const data = await res.json();
      const points: HistoricalPricePoint[] = (data.prices || []).map(
        ([ts, price]: [number, number]) => ({ timestamp: ts, price })
      );

      coinHistoryCache.set(coinId, { data: points, timestamp: Date.now() });
      return points;
    },
    enabled: !!coinId,
    staleTime: 300000,
    gcTime: 1000 * 60 * 15,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('429')) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
