import { useState } from 'react';
import { CryptoSelector } from '@/components/CryptoSelector';
import { CryptoPriceOverview } from '@/components/CryptoPriceOverview';
import { CryptoPriceChart } from '@/components/CryptoPriceChart';
import { AIProjections } from '@/components/AIProjections';
import { SentimentAnalytics } from '@/components/SentimentAnalytics';
import { MarketMetrics } from '@/components/MarketMetrics';

export type CryptoId = 'icp' | 'uni' | 'plume';

export interface CryptoConfig {
  id: CryptoId;
  name: string;
  symbol: string;
  coingeckoId: string;
  targetPrices: number[];
  description: string;
}

export const CRYPTO_CONFIGS: Record<CryptoId, CryptoConfig> = {
  icp: {
    id: 'icp',
    name: 'Internet Computer',
    symbol: 'ICP',
    coingeckoId: 'internet-computer',
    targetPrices: [3.567, 4.885, 5.152, 6.152, 9.828],
    description: 'Real-time price tracking with AI-powered projections and sentiment analysis',
  },
  uni: {
    id: 'uni',
    name: 'Uniswap',
    symbol: 'UNI',
    coingeckoId: 'uniswap',
    targetPrices: [9.831, 10.276],
    description: 'Leading decentralized exchange protocol with comprehensive analytics',
  },
  plume: {
    id: 'plume',
    name: 'Plume',
    symbol: 'PLUME',
    coingeckoId: 'plume-2', // Updated to correct CoinGecko ID
    targetPrices: [0.02, 0.04, 0.06, 0.08, 0.10],
    description: 'Emerging blockchain platform with AI-driven price forecasting',
  },
};

export function MultiCryptoDashboard() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoId>('icp');
  const config = CRYPTO_CONFIGS[selectedCrypto];

  return (
    <div className="space-y-8">
      {/* Crypto Selector */}
      <CryptoSelector
        selectedCrypto={selectedCrypto}
        onSelectCrypto={setSelectedCrypto}
      />

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          {config.name} ({config.symbol})
        </h2>
        <p className="text-lg text-muted-foreground">
          {config.description}
        </p>
      </div>

      {/* Price Overview */}
      <CryptoPriceOverview cryptoId={selectedCrypto} />

      {/* Market Metrics */}
      <MarketMetrics cryptoId={selectedCrypto} />

      {/* AI Projections */}
      <AIProjections cryptoId={selectedCrypto} />

      {/* Sentiment Analytics */}
      <SentimentAnalytics cryptoId={selectedCrypto} />

      {/* Interactive Chart */}
      <CryptoPriceChart cryptoId={selectedCrypto} />
    </div>
  );
}
