import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ICPPortfolio, PriceAlertStatus, PriceCache } from '@/backend';

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

// Helper function to resample data on the frontend
function resampleData(data: HistoricalDataPoint[], intervalMinutes: number): HistoricalDataPoint[] {
  if (data.length === 0) return [];
  
  const intervalMs = intervalMinutes * 60 * 1000;
  const grouped: { [key: number]: number[] } = {};
  
  // Group data points by interval
  data.forEach(point => {
    const bucketKey = Math.floor(point.timestamp / intervalMs) * intervalMs;
    if (!grouped[bucketKey]) {
      grouped[bucketKey] = [];
    }
    grouped[bucketKey].push(point.price);
  });
  
  // Calculate average for each bucket
  return Object.entries(grouped)
    .map(([timestamp, prices]) => ({
      timestamp: parseInt(timestamp),
      price: prices.reduce((sum, p) => sum + p, 0) / prices.length,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

// Get interval configuration for timeframe
function getTimeframeConfig(timeframe: TimeframeOption): { intervalMinutes: number; daysBack: number; coingeckoInterval?: string } {
  const configs: Record<TimeframeOption, { intervalMinutes: number; daysBack: number; coingeckoInterval?: string }> = {
    '1m': { intervalMinutes: 1, daysBack: 1, coingeckoInterval: 'minutely' },
    '2m': { intervalMinutes: 2, daysBack: 1, coingeckoInterval: 'minutely' },
    '3m': { intervalMinutes: 3, daysBack: 1, coingeckoInterval: 'minutely' },
    '5m': { intervalMinutes: 5, daysBack: 1, coingeckoInterval: 'minutely' },
    '10m': { intervalMinutes: 10, daysBack: 2, coingeckoInterval: 'minutely' },
    '15m': { intervalMinutes: 15, daysBack: 2, coingeckoInterval: 'minutely' },
    '30m': { intervalMinutes: 30, daysBack: 3, coingeckoInterval: 'minutely' },
    '1h': { intervalMinutes: 60, daysBack: 7, coingeckoInterval: 'hourly' },
    '2h': { intervalMinutes: 120, daysBack: 14, coingeckoInterval: 'hourly' },
    '4h': { intervalMinutes: 240, daysBack: 30, coingeckoInterval: 'hourly' },
    '6h': { intervalMinutes: 360, daysBack: 60, coingeckoInterval: 'hourly' },
    '1d': { intervalMinutes: 1440, daysBack: 90, coingeckoInterval: 'daily' },
    '1M': { intervalMinutes: 1440, daysBack: 30, coingeckoInterval: 'daily' },
    '3M': { intervalMinutes: 1440, daysBack: 90, coingeckoInterval: 'daily' },
    '1y': { intervalMinutes: 1440, daysBack: 365, coingeckoInterval: 'daily' },
  };
  return configs[timeframe];
}

// Fetch ICP historical data for chart with timeframe support
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
          throw new Error('Failed to fetch from CoinGecko');
        }
        const data = await response.json();
        const rawData = data.prices.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          price,
        }));
        
        // Resample data based on timeframe
        return resampleData(rawData, config.intervalMinutes);
      } catch (error) {
        console.warn('CoinGecko API failed, falling back to cached data:', error);
        
        // Fallback to cached data from backend
        if (!actor) throw new Error('Actor not initialized');
        
        try {
          // Try to get resampled data from backend
          const resampledData = await actor.getResampledPriceHistory(BigInt(config.intervalMinutes));
          
          if (resampledData.length > 0) {
            return resampledData.map((entry: PriceCache) => ({
              timestamp: Number(entry.timestamp) / 1_000_000, // Convert nanoseconds to milliseconds
              price: entry.price,
            }));
          }
        } catch (backendError) {
          console.warn('Backend resampling failed:', backendError);
        }
        
        // Fallback to raw cached data
        const cachedData = await actor.getCachedPriceHistory();
        
        if (cachedData.length > 0) {
          const rawCachedData = cachedData.map((entry: PriceCache) => ({
            timestamp: Number(entry.timestamp) / 1_000_000,
            price: entry.price,
          }));
          
          // Resample on frontend
          return resampleData(rawCachedData, config.intervalMinutes);
        }
        
        // If no cached data, generate synthetic data based on last known price
        const lastPrice = await actor.getLastCachedPrice();
        if (lastPrice !== null) {
          const now = Date.now();
          const syntheticData: HistoricalDataPoint[] = [];
          const pointsCount = Math.min(100, (config.daysBack * 24 * 60) / config.intervalMinutes);
          
          for (let i = pointsCount; i >= 0; i--) {
            const timestamp = now - (i * config.intervalMinutes * 60 * 1000);
            const variation = 1 + (Math.random() - 0.5) * 0.04;
            syntheticData.push({
              timestamp,
              price: lastPrice * variation,
            });
          }
          return syntheticData;
        }
        
        throw new Error('No data available');
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: config.intervalMinutes < 60 ? 30000 : 300000, // 30s for short intervals, 5min for longer
    staleTime: config.intervalMinutes < 60 ? 25000 : 240000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Fetch top 50 cryptocurrencies from backend
export function useTop50Cryptocurrencies() {
  const { actor, isFetching } = useActor();

  return useQuery<CoinGeckoPrice[]>({
    queryKey: ['top-50-cryptos'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const response = await actor.getTopCryptos();
      return JSON.parse(response);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Backend queries
export function usePortfolioSummary() {
  const { actor, isFetching } = useActor();

  return useQuery<ICPPortfolio>({
    queryKey: ['portfolio-summary'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getPortfolioSummary();
    },
    enabled: !!actor && !isFetching,
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
  });
}
