import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PortfolioSummary, PriceAlertStatus } from '@/backend';

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

// Fetch ICP current price from CoinGecko
export function useICPPrice() {
  return useQuery<CoinGeckoPrice>({
    queryKey: ['icp-price'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=internet-computer&order=market_cap_desc&sparkline=false&price_change_percentage=24h'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch ICP price');
      }
      const data = await response.json();
      return data[0];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
  });
}

// Fetch ICP historical data for chart (7 days)
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
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 240000,
  });
}

// Fetch top 50 cryptocurrencies
export function useTop50Cryptocurrencies() {
  return useQuery<CoinGeckoPrice[]>({
    queryKey: ['top-50-cryptos'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch top 50 cryptocurrencies');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
  });
}

// Backend queries
export function usePortfolioSummary() {
  const { actor, isFetching } = useActor();

  return useQuery<PortfolioSummary>({
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
