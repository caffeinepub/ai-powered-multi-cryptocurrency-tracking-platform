import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CryptoId } from '@/components/MultiCryptoDashboard';
import { CRYPTO_CONFIGS } from '@/components/MultiCryptoDashboard';

interface CryptoMarketData {
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  market_cap_rank: number;
}

interface HistoricalDataPoint {
  timestamp: number;
  price: number;
}

export type TimeframeOption = '1m' | '2m' | '3m' | '5m' | '10m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '1d' | '1M' | '3M' | '1y';

// Fetch crypto current price with optimized real-time updates
export function useCryptoPrice(cryptoId: CryptoId) {
  const config = CRYPTO_CONFIGS[cryptoId];

  return useQuery<{ price: number; priceChange24h: number }>({
    queryKey: ['crypto-price', cryptoId],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${config.coingeckoId}&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }
        
        const data = await response.json();
        const price = data?.[config.coingeckoId]?.usd;
        const priceChange24h = data?.[config.coingeckoId]?.usd_24h_change || 0;
        
        if (typeof price !== 'number' || isNaN(price) || price <= 0) {
          throw new Error('Invalid price value received');
        }
        
        return { price, priceChange24h };
      } catch (error) {
        console.error('Live price fetch failed:', error);
        throw error;
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    staleTime: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// Fetch 24-hour high/low with optimized updates
export function useCryptoDailyHighLow(cryptoId: CryptoId) {
  const config = CRYPTO_CONFIGS[cryptoId];

  return useQuery<{ high: number; low: number }>({
    queryKey: ['crypto-daily-high-low', cryptoId],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${config.coingeckoId}/market_chart?vs_currency=usd&days=1&interval=hourly`
        );
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.prices || data.prices.length === 0) {
          throw new Error('No price data returned');
        }
        
        const prices = data.prices.map(([_, price]: [number, number]) => price);
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        
        return { high, low };
      } catch (error) {
        console.error('Failed to fetch daily high/low:', error);
        throw error;
      }
    },
    refetchInterval: 10000,
    staleTime: 5000,
    retry: 2,
    refetchOnMount: true,
  });
}

// Fetch crypto market data from CoinGecko
export function useCryptoMarketData(cryptoId: CryptoId) {
  const config = CRYPTO_CONFIGS[cryptoId];

  return useQuery<CryptoMarketData>({
    queryKey: ['crypto-market-data', cryptoId],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${config.coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`
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
  daysBack: number; 
  coingeckoInterval?: string;
  minDataPoints: number;
  refetchInterval: number;
} {
  const configs: Record<TimeframeOption, { 
    intervalMinutes: number;
    daysBack: number; 
    coingeckoInterval?: string;
    minDataPoints: number;
    refetchInterval: number;
  }> = {
    '1m': { intervalMinutes: 1, daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100, refetchInterval: 15000 },
    '2m': { intervalMinutes: 2, daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100, refetchInterval: 15000 },
    '3m': { intervalMinutes: 3, daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100, refetchInterval: 15000 },
    '5m': { intervalMinutes: 5, daysBack: 1, coingeckoInterval: 'minutely', minDataPoints: 100, refetchInterval: 20000 },
    '10m': { intervalMinutes: 10, daysBack: 2, coingeckoInterval: 'minutely', minDataPoints: 100, refetchInterval: 30000 },
    '15m': { intervalMinutes: 15, daysBack: 2, coingeckoInterval: 'minutely', minDataPoints: 96, refetchInterval: 30000 },
    '30m': { intervalMinutes: 30, daysBack: 3, coingeckoInterval: 'minutely', minDataPoints: 96, refetchInterval: 60000 },
    '1h': { intervalMinutes: 60, daysBack: 7, coingeckoInterval: 'hourly', minDataPoints: 84, refetchInterval: 120000 },
    '2h': { intervalMinutes: 120, daysBack: 14, coingeckoInterval: 'hourly', minDataPoints: 84, refetchInterval: 180000 },
    '4h': { intervalMinutes: 240, daysBack: 30, coingeckoInterval: 'hourly', minDataPoints: 90, refetchInterval: 240000 },
    '6h': { intervalMinutes: 360, daysBack: 60, coingeckoInterval: 'hourly', minDataPoints: 120, refetchInterval: 300000 },
    '1d': { intervalMinutes: 1440, daysBack: 90, coingeckoInterval: 'daily', minDataPoints: 90, refetchInterval: 300000 },
    '1M': { intervalMinutes: 43200, daysBack: 30, coingeckoInterval: 'daily', minDataPoints: 30, refetchInterval: 600000 },
    '3M': { intervalMinutes: 129600, daysBack: 90, coingeckoInterval: 'daily', minDataPoints: 90, refetchInterval: 600000 },
    '1y': { intervalMinutes: 525600, daysBack: 365, coingeckoInterval: 'daily', minDataPoints: 365, refetchInterval: 600000 },
  };
  return configs[timeframe];
}

// Fetch crypto historical data
export function useCryptoHistoricalData(cryptoId: CryptoId, timeframe: TimeframeOption = '1d') {
  const config = CRYPTO_CONFIGS[cryptoId];
  const timeframeConfig = getTimeframeConfig(timeframe);

  return useQuery<HistoricalDataPoint[]>({
    queryKey: ['crypto-historical', cryptoId, timeframe],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${config.coingeckoId}/market_chart?vs_currency=usd&days=${timeframeConfig.daysBack}&interval=${timeframeConfig.coingeckoInterval || 'hourly'}`
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
        
        const resampledData = resampleDataWithSmoothing(rawData, timeframeConfig.intervalMinutes);
        
        if (resampledData.length < timeframeConfig.minDataPoints && rawData.length >= timeframeConfig.minDataPoints) {
          return resampleDataWithSmoothing(rawData, Math.max(1, Math.floor(timeframeConfig.intervalMinutes / 2)));
        }
        
        return resampledData;
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
        throw error;
      }
    },
    refetchInterval: timeframeConfig.refetchInterval,
    staleTime: timeframeConfig.intervalMinutes < 60 ? 10000 : 240000,
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

export function useAIProjections(cryptoId: CryptoId) {
  const config = CRYPTO_CONFIGS[cryptoId];

  return useQuery<AIProjection[]>({
    queryKey: ['ai-projections', cryptoId],
    queryFn: async () => {
      // Simulate AI projection calculations
      // In production, this would call backend endpoints
      const targets = config.targetPrices;
      
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

export function useSentimentAnalytics(cryptoId: CryptoId) {
  return useQuery<SentimentData>({
    queryKey: ['sentiment-analytics', cryptoId],
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
