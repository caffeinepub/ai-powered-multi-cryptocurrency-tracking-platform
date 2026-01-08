import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PriceCache, PriceRange } from '@/backend';

interface ICPMarketData {
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  market_cap_rank: number;
}

interface HistoricalDataPoint {
  timestamp: number;
  price: number;
}

interface ICPPriceResponse {
  'internet-computer': {
    usd: number;
  };
}

export type TimeframeOption = '1m' | '2m' | '3m' | '5m' | '10m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '1d' | '1M' | '3M' | '1y';

// Fetch ICP current price with optimized real-time updates
export function useICPPrice() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<number>({
    queryKey: ['icp-price'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      
      try {
        // Fetch live price from backend (which calls CoinGecko)
        const response = await actor.getICPLivePrice();
        
        // Parse the JSON response
        let data: ICPPriceResponse;
        try {
          data = JSON.parse(response);
        } catch (parseError) {
          console.error('Failed to parse price response:', parseError);
          throw new Error('Invalid price data format');
        }
        
        // Extract price with validation
        const price = data?.['internet-computer']?.usd;
        if (typeof price !== 'number' || isNaN(price) || price <= 0) {
          throw new Error('Invalid price value received');
        }
        
        // Cache the price in backend for fallback (fire and forget)
        actor.recordNewICPPrice(price).catch((error) => {
          console.warn('Failed to cache price in backend:', error);
        });
        
        return price;
      } catch (error) {
        console.warn('Live price fetch failed, attempting fallback to cache:', error);
        
        // Fallback to cached data
        try {
          const cachedData = await actor.getCachedPriceHistory();
          if (cachedData && cachedData.length > 0) {
            const latestCached = cachedData[cachedData.length - 1];
            if (latestCached && typeof latestCached.price === 'number') {
              console.info('Using cached price:', latestCached.price);
              return latestCached.price;
            }
          }
        } catch (cacheError) {
          console.error('Failed to fetch cached data:', cacheError);
        }
        
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// Fetch 24-hour high/low with optimized updates
export function useDailyHighLow() {
  const { actor, isFetching } = useActor();

  return useQuery<PriceRange>({
    queryKey: ['daily-high-low'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const range = await actor.getDailyHighLowFromCache();
      
      // Validate the range data
      if (!range || typeof range.high !== 'number' || typeof range.low !== 'number') {
        throw new Error('Invalid price range data');
      }
      
      return range;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000, // Sync with price updates
    staleTime: 5000,
    retry: 2,
    refetchOnMount: true,
  });
}

// Fetch ICP market data from CoinGecko
export function useICPMarketData() {
  return useQuery<ICPMarketData>({
    queryKey: ['icp-market-data'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/internet-computer?localization=false&tickers=false&community_data=false&developer_data=false'
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        market_cap: data.market_data?.market_cap?.usd || 0,
        total_volume: data.market_data?.total_volume?.usd || 0,
        circulating_supply: data.market_data?.circulating_supply || 0,
        market_cap_rank: data.market_cap_rank || 0,
      };
    },
    refetchInterval: 60000,
    staleTime: 50000,
    retry: 2,
  });
}

// Enhanced resampling with smoothing
function resampleDataWithSmoothing(data: HistoricalDataPoint[], intervalMinutes: number): HistoricalDataPoint[] {
  if (data.length === 0) return [];
  
  const intervalMs = intervalMinutes * 60 * 1000;
  const grouped: { [key: number]: number[] } = {};
  
  data.forEach(point => {
    const bucketKey = Math.floor(point.timestamp / intervalMs) * intervalMs;
    if (!grouped[bucketKey]) {
      grouped[bucketKey] = [];
    }
    grouped[bucketKey].push(point.price);
  });
  
  const resampled = Object.entries(grouped)
    .map(([timestamp, prices]) => {
      const weights = prices.map((_, i) => i + 1);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      const weightedPrice = prices.reduce((sum, price, i) => sum + price * weights[i], 0) / totalWeight;
      
      return {
        timestamp: parseInt(timestamp),
        price: weightedPrice,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
  
  if (resampled.length > 5) {
    const smoothed = [resampled[0]];
    const alpha = 0.2;
    
    for (let i = 1; i < resampled.length; i++) {
      const smoothedPrice = alpha * resampled[i].price + (1 - alpha) * smoothed[i - 1].price;
      smoothed.push({
        timestamp: resampled[i].timestamp,
        price: smoothedPrice,
      });
    }
    
    return smoothed;
  }
  
  if (resampled.length < 2) {
    return data.slice(-100);
  }
  
  return resampled;
}

// Get timeframe configuration
function getTimeframeConfig(timeframe: TimeframeOption): { 
  intervalMinutes: number;
  intervalNanos: bigint;
  daysBack: number; 
  coingeckoInterval?: string;
  minDataPoints: number;
  refetchInterval: number;
} {
  const configs: Record<TimeframeOption, { 
    intervalMinutes: number;
    intervalNanos: bigint;
    daysBack: number; 
    coingeckoInterval?: string;
    minDataPoints: number;
    refetchInterval: number;
  }> = {
    '1m': { intervalMinutes: 1, intervalNanos: BigInt(1 * 60 * 1_000_000_000), daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100, refetchInterval: 15000 },
    '2m': { intervalMinutes: 2, intervalNanos: BigInt(2 * 60 * 1_000_000_000), daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100, refetchInterval: 15000 },
    '3m': { intervalMinutes: 3, intervalNanos: BigInt(3 * 60 * 1_000_000_000), daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100, refetchInterval: 15000 },
    '5m': { intervalMinutes: 5, intervalNanos: BigInt(5 * 60 * 1_000_000_000), daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100, refetchInterval: 20000 },
    '10m': { intervalMinutes: 10, intervalNanos: BigInt(10 * 60 * 1_000_000_000), daysBack: 2, coingeckoInterval: 'minutely', minDataPoints: 100, refetchInterval: 30000 },
    '15m': { intervalMinutes: 15, intervalNanos: BigInt(15 * 60 * 1_000_000_000), daysBack: 2, coingeckoInterval: 'minutely', minDataPoints: 96, refetchInterval: 30000 },
    '30m': { intervalMinutes: 30, intervalNanos: BigInt(30 * 60 * 1_000_000_000), daysBack: 3, coingeckoInterval: 'minutely', minDataPoints: 96, refetchInterval: 60000 },
    '1h': { intervalMinutes: 60, intervalNanos: BigInt(60 * 60 * 1_000_000_000), daysBack: 7, coingeckoInterval: 'hourly', minDataPoints: 84, refetchInterval: 120000 },
    '2h': { intervalMinutes: 120, intervalNanos: BigInt(120 * 60 * 1_000_000_000), daysBack: 14, coingeckoInterval: 'hourly', minDataPoints: 84, refetchInterval: 180000 },
    '4h': { intervalMinutes: 240, intervalNanos: BigInt(240 * 60 * 1_000_000_000), daysBack: 30, coingeckoInterval: 'hourly', minDataPoints: 90, refetchInterval: 240000 },
    '6h': { intervalMinutes: 360, intervalNanos: BigInt(360 * 60 * 1_000_000_000), daysBack: 60, coingeckoInterval: 'hourly', minDataPoints: 120, refetchInterval: 300000 },
    '1d': { intervalMinutes: 1440, intervalNanos: BigInt(1440 * 60 * 1_000_000_000), daysBack: 90, coingeckoInterval: 'daily', minDataPoints: 90, refetchInterval: 300000 },
    '1M': { intervalMinutes: 43200, intervalNanos: BigInt(43200 * 60 * 1_000_000_000), daysBack: 30, coingeckoInterval: 'daily', minDataPoints: 30, refetchInterval: 600000 },
    '3M': { intervalMinutes: 129600, intervalNanos: BigInt(129600 * 60 * 1_000_000_000), daysBack: 90, coingeckoInterval: 'daily', minDataPoints: 90, refetchInterval: 600000 },
    '1y': { intervalMinutes: 525600, intervalNanos: BigInt(525600 * 60 * 1_000_000_000), daysBack: 365, coingeckoInterval: 'daily', minDataPoints: 365, refetchInterval: 600000 },
  };
  return configs[timeframe];
}

// Prefetch timeframes
export function usePrefetchTimeframes() {
  const { actor, isFetching } = useActor();

  const prefetchTimeframe = async (timeframe: TimeframeOption) => {
    // Prefetching logic would go here
  };

  return { prefetchTimeframe };
}

// Fetch ICP historical data
export function useICPHistoricalData(timeframe: TimeframeOption = '1d') {
  const { actor, isFetching } = useActor();
  const config = getTimeframeConfig(timeframe);

  return useQuery<HistoricalDataPoint[]>({
    queryKey: ['icp-historical', timeframe],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/internet-computer/market_chart?vs_currency=usd&days=${config.daysBack}&interval=${config.coingeckoInterval || 'hourly'}`
        );
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.prices || data.prices.length === 0) {
          throw new Error('No price data returned from CoinGecko');
        }
        
        const rawData = data.prices.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          price,
        }));
        
        const resampledData = resampleDataWithSmoothing(rawData, config.intervalMinutes);
        
        if (resampledData.length < config.minDataPoints && rawData.length >= config.minDataPoints) {
          return resampleDataWithSmoothing(rawData, Math.max(1, Math.floor(config.intervalMinutes / 2)));
        }
        
        return resampledData;
      } catch (error) {
        console.warn('CoinGecko API failed, falling back to cached data:', error);
        
        if (!actor) throw new Error('Actor not initialized');
        
        try {
          const resampledData = await actor.getResampledPriceHistory(config.intervalNanos);
          
          if (resampledData.length > 0) {
            const backendData = resampledData.map((entry: PriceCache) => ({
              timestamp: Number(entry.timestamp) / 1_000_000,
              price: entry.price,
            }));
            
            return backendData.sort((a, b) => a.timestamp - b.timestamp);
          }
        } catch (backendError) {
          console.warn('Backend resampling failed:', backendError);
        }
        
        try {
          const cachedData = await actor.getCachedPriceHistory();
          
          if (cachedData.length > 0) {
            const rawCachedData = cachedData.map((entry: PriceCache) => ({
              timestamp: Number(entry.timestamp) / 1_000_000,
              price: entry.price,
            })).sort((a, b) => a.timestamp - b.timestamp);
            
            const resampled = resampleDataWithSmoothing(rawCachedData, config.intervalMinutes);
            
            if (resampled.length >= 2) {
              return resampled;
            }
            
            return rawCachedData.slice(-100);
          }
        } catch (cacheError) {
          console.warn('Failed to fetch cached data:', cacheError);
        }
        
        throw new Error('No data available from any source');
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: config.refetchInterval,
    staleTime: config.intervalMinutes < 60 ? 10000 : 240000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// AI Projections (mock data for now - backend would provide real calculations)
interface AIProjection {
  targetPrice: number;
  daysToTarget: number;
  confidence: number;
}

export function useAIProjections() {
  return useQuery<AIProjection[]>({
    queryKey: ['ai-projections'],
    queryFn: async () => {
      // Simulate AI projection calculations
      // In production, this would call backend endpoints
      const targets = [3.567, 4.885, 5.152, 6.152, 9.828];
      
      return targets.map((target, index) => ({
        targetPrice: target,
        daysToTarget: Math.floor(Math.random() * 180) + 30 + (index * 20),
        confidence: Math.floor(Math.random() * 30) + 60,
      }));
    },
    refetchInterval: 300000, // 5 minutes
    staleTime: 240000,
  });
}

// Sentiment Analytics (mock data for now - backend would provide real calculations)
interface SentimentData {
  score: number;
  socialMedia: number;
  momentum: number;
  volumeTrend: number;
  volatility: number;
}

export function useSentimentAnalytics() {
  return useQuery<SentimentData>({
    queryKey: ['sentiment-analytics'],
    queryFn: async () => {
      // Simulate sentiment analysis
      // In production, this would call backend endpoints
      return {
        score: Math.floor(Math.random() * 40) + 50,
        socialMedia: Math.floor(Math.random() * 40) + 50,
        momentum: Math.floor(Math.random() * 40) + 50,
        volumeTrend: Math.floor(Math.random() * 40) + 40,
        volatility: Math.floor(Math.random() * 30) + 35,
      };
    },
    refetchInterval: 60000, // 1 minute
    staleTime: 50000,
  });
}
