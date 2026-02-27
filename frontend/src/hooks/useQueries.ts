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

const topCoinsCache: { data: CoinMarketData[]; timestamp: number } | null = null;
let _topCoinsCache: { data: CoinMarketData[]; timestamp: number } | null = null;
const coinHistoryCache = new Map<string, { data: HistoricalPricePoint[]; timestamp: number }>();

export function useTopCoins() {
  return useQuery<CoinMarketData[]>({
    queryKey: ['top-150-coins'],
    queryFn: async () => {
      // Check in-memory cache first (5 min)
      if (_topCoinsCache && Date.now() - _topCoinsCache.timestamp < 300000) {
        return _topCoinsCache.data;
      }

      // Fetch page 1 (100 coins) and page 2 (50 coins) in parallel
      const [res1, res2] = await Promise.all([
        fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',
          { headers: { Accept: 'application/json' } }
        ),
        fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=2&sparkline=false&price_change_percentage=24h',
          { headers: { Accept: 'application/json' } }
        ),
      ]);

      if (res1.status === 429 || res2.status === 429) {
        if (_topCoinsCache) return _topCoinsCache.data;
        throw new Error('Rate limit exceeded (429). Please wait a moment.');
      }

      if (!res1.ok || !res2.ok) {
        throw new Error(`CoinGecko API error: ${res1.status} / ${res2.status}`);
      }

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      const combined: CoinMarketData[] = [...data1, ...data2];

      _topCoinsCache = { data: combined, timestamp: Date.now() };
      return combined;
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('429')) return false;
      return failureCount < 2;
    },
  });
}

export function useCoinHistory(coinId: string | null) {
  return useQuery<HistoricalPricePoint[]>({
    queryKey: ['coin-history-30d', coinId],
    queryFn: async () => {
      if (!coinId) return [];

      const cached = coinHistoryCache.get(coinId);
      if (cached && Date.now() - cached.timestamp < 600000) {
        return cached.data;
      }

      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`,
        { headers: { Accept: 'application/json' } }
      );

      if (res.status === 429) {
        const cached = coinHistoryCache.get(coinId);
        if (cached) return cached.data;
        throw new Error('Rate limit exceeded (429).');
      }

      if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);

      const data = await res.json();
      const points: HistoricalPricePoint[] = (data.prices || []).map(
        ([ts, price]: [number, number]) => ({ timestamp: ts, price })
      );

      coinHistoryCache.set(coinId, { data: points, timestamp: Date.now() });
      return points;
    },
    enabled: !!coinId,
    staleTime: 300000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('429')) return false;
      return failureCount < 2;
    },
  });
}
