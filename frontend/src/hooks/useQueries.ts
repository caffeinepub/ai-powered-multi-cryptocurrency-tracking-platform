import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ICPPortfolio, AlertStatus } from '@/backend';

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

// Fetch ICP current price from backend
export function useICPPrice() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['icp-price'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const response = await actor.getICPLivePrice();
      const data: ICPPriceResponse = JSON.parse(response);
      return data['internet-computer'].usd;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Fetch ICP historical data for chart (7 days) with fallback to cached data
export function useICPHistoricalData() {
  return useQuery<HistoricalDataPoint[]>({
    queryKey: ['icp-historical'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/internet-computer/market_chart?vs_currency=usd&days=7&interval=hourly'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      const data = await response.json();
      return data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price,
      }));
    },
    placeholderData: (previousData) => previousData, // Keep previous data on error
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 240000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Fetch top 50 cryptocurrencies directly from CoinGecko API
export function useTop50Cryptocurrencies() {
  return useQuery<CoinGeckoPrice[]>({
    queryKey: ['top-50-cryptos'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch top cryptocurrencies');
      }
      return response.json();
    },
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

// Fetch price alerts from backend
export function usePriceAlerts() {
  const { actor, isFetching } = useActor();

  return useQuery<AlertStatus[]>({
    queryKey: ['price-alerts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      const alerts = await actor.getAlertList();
      // Sort by price ascending
      return alerts.sort((a, b) => a.price - b.price);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000, // Check alerts every 10 seconds
  });
}

// Toggle alert active status
export function useToggleAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ price, active }: { price: number; active: boolean }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.setAlertActive(price, active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
    },
  });
}

// Add new price alert
export function useAddAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (price: number) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.setAlertActive(price, true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
    },
  });
}

// Delete price alert
export function useDeleteAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (price: number) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteAlert(price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
    },
  });
}
