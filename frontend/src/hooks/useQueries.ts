import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PriceAlertStatus, PriceCache } from '@/backend';

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

// Fetch ICP current price from backend
export function useICPPrice() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['icp-price'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const response = await actor.getICPLivePrice();
      const data: ICPPriceResponse = JSON.parse(response);
      const price = data['internet-computer'].usd;
      
      // Cache the price in the backend
      try {
        await actor.recordNewICPPrice(price);
      } catch (error) {
        console.error('Failed to cache price:', error);
      }
      
      return price;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Helper function to resample data on the frontend with improved accuracy
function resampleData(data: HistoricalDataPoint[], intervalMinutes: number): HistoricalDataPoint[] {
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
  
  // Calculate average for each bucket and sort by timestamp
  const resampled = Object.entries(grouped)
    .map(([timestamp, prices]) => ({
      timestamp: parseInt(timestamp),
      price: prices.reduce((sum, p) => sum + p, 0) / prices.length,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
  
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
} {
  const configs: Record<TimeframeOption, { 
    intervalMinutes: number;
    intervalNanos: bigint;
    daysBack: number; 
    coingeckoInterval?: string;
    minDataPoints: number;
  }> = {
    '1m': { intervalMinutes: 1, intervalNanos: BigInt(1 * 60 * 1_000_000_000), daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100 },
    '2m': { intervalMinutes: 2, intervalNanos: BigInt(2 * 60 * 1_000_000_000), daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100 },
    '3m': { intervalMinutes: 3, intervalNanos: BigInt(3 * 60 * 1_000_000_000), daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100 },
    '5m': { intervalMinutes: 5, intervalNanos: BigInt(5 * 60 * 1_000_000_000), daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100 },
    '10m': { intervalMinutes: 10, intervalNanos: BigInt(10 * 60 * 1_000_000_000), daysBack: 2, coingeckoInterval: 'minutely', minDataPoints: 100 },
    '15m': { intervalMinutes: 15, intervalNanos: BigInt(15 * 60 * 1_000_000_000), daysBack: 2, coingeckoInterval: 'minutely', minDataPoints: 96 },
    '30m': { intervalMinutes: 30, intervalNanos: BigInt(30 * 60 * 1_000_000_000), daysBack: 3, coingeckoInterval: 'minutely', minDataPoints: 96 },
    '1h': { intervalMinutes: 60, intervalNanos: BigInt(60 * 60 * 1_000_000_000), daysBack: 7, coingeckoInterval: 'hourly', minDataPoints: 84 },
    '2h': { intervalMinutes: 120, intervalNanos: BigInt(120 * 60 * 1_000_000_000), daysBack: 14, coingeckoInterval: 'hourly', minDataPoints: 84 },
    '4h': { intervalMinutes: 240, intervalNanos: BigInt(240 * 60 * 1_000_000_000), daysBack: 30, coingeckoInterval: 'hourly', minDataPoints: 90 },
    '6h': { intervalMinutes: 360, intervalNanos: BigInt(360 * 60 * 1_000_000_000), daysBack: 60, coingeckoInterval: 'hourly', minDataPoints: 120 },
    '1d': { intervalMinutes: 1440, intervalNanos: BigInt(1440 * 60 * 1_000_000_000), daysBack: 90, coingeckoInterval: 'daily', minDataPoints: 90 },
    '1M': { intervalMinutes: 43200, intervalNanos: BigInt(43200 * 60 * 1_000_000_000), daysBack: 30, coingeckoInterval: 'daily', minDataPoints: 30 },
    '3M': { intervalMinutes: 129600, intervalNanos: BigInt(129600 * 60 * 1_000_000_000), daysBack: 90, coingeckoInterval: 'daily', minDataPoints: 90 },
    '1y': { intervalMinutes: 525600, intervalNanos: BigInt(525600 * 60 * 1_000_000_000), daysBack: 365, coingeckoInterval: 'daily', minDataPoints: 365 },
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
          
          return resampleData(rawData, config.intervalMinutes);
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
      staleTime: config.intervalMinutes < 60 ? 25000 : 240000,
    });
  };

  return { prefetchTimeframe };
}

// Fetch ICP historical data for chart with improved timeframe support and caching
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
        
        // Resample data based on timeframe for consistent intervals
        const resampledData = resampleData(rawData, config.intervalMinutes);
        
        // Ensure we have enough data points
        if (resampledData.length < config.minDataPoints && rawData.length >= config.minDataPoints) {
          // If resampling reduced data too much, use raw data with lighter resampling
          return resampleData(rawData, Math.max(1, Math.floor(config.intervalMinutes / 2)));
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
            
            // Resample on frontend
            const resampled = resampleData(rawCachedData, config.intervalMinutes);
            
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
    refetchInterval: config.intervalMinutes < 60 ? 30000 : 300000, // 30s for short intervals, 5min for longer
    staleTime: config.intervalMinutes < 60 ? 25000 : 240000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Fetch top 50 cryptocurrencies from backend with improved error handling
export function useTop50Cryptocurrencies() {
  const { actor, isFetching } = useActor();

  return useQuery<CoinGeckoPrice[]>({
    queryKey: ['top-50-cryptos'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const response = await actor.getTopCryptos();
      const data = JSON.parse(response);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from backend');
      }
      
      return data;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function usePriceAlerts() {
  const { actor, isFetching } = useActor();

  return useQuery<PriceAlertStatus[]>({
    queryKey: ['price-alerts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const alerts = await actor.getAlerts();
      // Sort by price ascending
      return alerts.sort((a, b) => a.price - b.price);
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
      // Check if alert already exists
      const existingAlerts = await actor.getAlerts();
      const alertExists = existingAlerts.some(alert => Math.abs(alert.price - price) < 0.001);
      
      if (alertExists) {
        throw new Error('Alert already exists for this price');
      }
      
      // Add new alert by toggling (which creates it if it doesn't exist)
      await actor.toggleAlertStatus(price);
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
      
      // Get current alerts
      const alerts = await actor.getAlerts();
      const alertToRemove = alerts.find(a => Math.abs(a.price - price) < 0.001);
      
      if (!alertToRemove) {
        throw new Error('Alert not found');
      }
      
      // Toggle to remove (backend should handle removal logic)
      await actor.toggleAlertStatus(price);
      
      // Optimistically update the cache
      queryClient.setQueryData<PriceAlertStatus[]>(['price-alerts'], (old) => {
        if (!old) return [];
        return old.filter(alert => Math.abs(alert.price - price) >= 0.001);
      });
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
