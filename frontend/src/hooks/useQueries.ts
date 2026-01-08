import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PriceCache, PortfolioSummary, PriceRange } from '@/backend';

// CoinGecko API types
interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
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

// Fetch ICP current price from backend with enhanced caching and real-time updates
export function useICPPrice() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['icp-price'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      
      try {
        const response = await actor.getICPLivePrice();
        const data: ICPPriceResponse = JSON.parse(response);
        const price = data['internet-computer'].usd;
        
        // Cache the price in the backend for fallback
        try {
          await actor.recordNewICPPrice(price);
        } catch (error) {
          console.warn('Failed to cache price in backend:', error);
        }
        
        return price;
      } catch (error) {
        // Fallback to cached data if API fails
        console.warn('Live price fetch failed, attempting fallback to cache:', error);
        const cachedData = await actor.getCachedPriceHistory();
        if (cachedData.length > 0) {
          const latestCached = cachedData[cachedData.length - 1];
          return latestCached.price;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000, // Increased frequency to 15 seconds for real-time updates
    staleTime: 10000, // Reduced stale time for fresher data
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Fetch 24-hour high/low from backend with enhanced precision
export function useDailyHighLow() {
  const { actor, isFetching } = useActor();

  return useQuery<PriceRange>({
    queryKey: ['daily-high-low'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const range = await actor.getDailyHighLowFromCache();
      return range;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000, // Increased frequency for real-time updates
    staleTime: 10000,
    retry: 2,
  });
}

// Fetch portfolio summary from backend with real-time updates
export function usePortfolioSummary() {
  const { actor, isFetching } = useActor();

  return useQuery<PortfolioSummary>({
    queryKey: ['portfolio-summary'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const summary = await actor.getPortfolioSummary();
      return summary;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000, // Increased frequency for real-time updates
    staleTime: 10000,
    retry: 2,
  });
}

// Enhanced resampling with advanced smoothing for better visual transitions
function resampleDataWithSmoothing(data: HistoricalDataPoint[], intervalMinutes: number): HistoricalDataPoint[] {
  if (data.length === 0) return [];
  
  const intervalMs = intervalMinutes * 60 * 1000;
  const grouped: { [key: number]: number[] } = {};
  
  // Group data points by interval bucket
  data.forEach(point => {
    const bucketKey = Math.floor(point.timestamp / intervalMs) * intervalMs;
    if (!grouped[bucketKey]) {
      grouped[bucketKey] = [];
    }
    grouped[bucketKey].push(point.price);
  });
  
  // Calculate average for each bucket with weighted smoothing
  const resampled = Object.entries(grouped)
    .map(([timestamp, prices]) => {
      // Use weighted average favoring recent prices in the bucket
      const weights = prices.map((_, i) => i + 1);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      const weightedPrice = prices.reduce((sum, price, i) => sum + price * weights[i], 0) / totalWeight;
      
      return {
        timestamp: parseInt(timestamp),
        price: weightedPrice,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
  
  // Apply exponential moving average smoothing for better visual transitions
  if (resampled.length > 5) {
    const smoothed = [resampled[0]];
    const alpha = 0.2; // Reduced smoothing factor for more responsive updates
    
    for (let i = 1; i < resampled.length; i++) {
      const smoothedPrice = alpha * resampled[i].price + (1 - alpha) * smoothed[i - 1].price;
      smoothed.push({
        timestamp: resampled[i].timestamp,
        price: smoothedPrice,
      });
    }
    
    return smoothed;
  }
  
  // Ensure we have enough data points for visualization
  if (resampled.length < 2) {
    return data.slice(-100); // Return last 100 raw points if resampling produces too few points
  }
  
  return resampled;
}

// Get interval configuration for timeframe with proper nanosecond conversions
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

// Prefetch data for multiple timeframes to improve responsiveness
export function usePrefetchTimeframes() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();

  const prefetchTimeframe = async (timeframe: TimeframeOption) => {
    if (!actor || isFetching) return;
    
    const config = getTimeframeConfig(timeframe);
    
    await queryClient.prefetchQuery({
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
          
          return resampleDataWithSmoothing(rawData, config.intervalMinutes);
        } catch (error) {
          // Fallback to backend data
          const resampledData = await actor.getResampledPriceHistory(config.intervalNanos);
          
          if (resampledData.length > 0) {
            return resampledData.map((entry: PriceCache) => ({
              timestamp: Number(entry.timestamp) / 1_000_000, // Convert nanoseconds to milliseconds
              price: entry.price,
            })).sort((a, b) => a.timestamp - b.timestamp);
          }
          
          return [];
        }
      },
      staleTime: config.intervalMinutes < 60 ? 10000 : 240000,
    });
  };

  return { prefetchTimeframe };
}

// Fetch ICP historical data for chart with improved real-time updates and consistent scaling
export function useICPHistoricalData(timeframe: TimeframeOption = '1d') {
  const { actor, isFetching } = useActor();
  const config = getTimeframeConfig(timeframe);

  return useQuery<HistoricalDataPoint[]>({
    queryKey: ['icp-historical', timeframe],
    queryFn: async () => {
      // Try to fetch from CoinGecko first
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
        
        // Resample data with advanced smoothing for better transitions
        const resampledData = resampleDataWithSmoothing(rawData, config.intervalMinutes);
        
        // Ensure we have enough data points for consistent scaling
        if (resampledData.length < config.minDataPoints && rawData.length >= config.minDataPoints) {
          // If resampling reduced data too much, use lighter resampling
          return resampleDataWithSmoothing(rawData, Math.max(1, Math.floor(config.intervalMinutes / 2)));
        }
        
        return resampledData;
      } catch (error) {
        console.warn('CoinGecko API failed, falling back to cached data:', error);
        
        // Fallback to cached data from backend
        if (!actor) throw new Error('Actor not initialized');
        
        try {
          // Try to get resampled data from backend with correct nanosecond interval
          const resampledData = await actor.getResampledPriceHistory(config.intervalNanos);
          
          if (resampledData.length > 0) {
            const backendData = resampledData.map((entry: PriceCache) => ({
              timestamp: Number(entry.timestamp) / 1_000_000, // Convert nanoseconds to milliseconds
              price: entry.price,
            }));
            
            // Sort by timestamp to ensure proper ordering
            return backendData.sort((a, b) => a.timestamp - b.timestamp);
          }
        } catch (backendError) {
          console.warn('Backend resampling failed:', backendError);
        }
        
        // Fallback to raw cached data
        try {
          const cachedData = await actor.getCachedPriceHistory();
          
          if (cachedData.length > 0) {
            const rawCachedData = cachedData.map((entry: PriceCache) => ({
              timestamp: Number(entry.timestamp) / 1_000_000, // Convert nanoseconds to milliseconds
              price: entry.price,
            })).sort((a, b) => a.timestamp - b.timestamp);
            
            // Resample on frontend with smoothing
            const resampled = resampleDataWithSmoothing(rawCachedData, config.intervalMinutes);
            
            if (resampled.length >= 2) {
              return resampled;
            }
            
            // Return raw data if resampling fails
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

// Fetch top 100 cryptocurrencies from CoinGecko API with dynamic refresh
export function useTop100Cryptocurrencies(refreshInterval: number = 30000) {
  return useQuery<CoinGeckoPrice[]>({
    queryKey: ['top-100-cryptos'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h,24h,7d'
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from CoinGecko');
      }
      
      return data;
    },
    refetchInterval: refreshInterval,
    staleTime: refreshInterval - 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function usePriceAlerts() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[number, boolean]>>({
    queryKey: ['price-alerts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const alerts = await actor.getAlerts();
      // Sort by price ascending
      return alerts.sort((a, b) => a[0] - b[0]);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000, // Check alerts every 10 seconds
    retry: 2,
  });
}

export function useAddAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (price: number) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.createPriceAlert(price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
    },
    retry: 1,
  });
}

export function useRemoveAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (price: number) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deletePriceAlert(price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
    },
    retry: 1,
  });
}

export function useToggleAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (price: number) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.toggleAlertStatus(price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
    },
    retry: 1,
  });
}
