import { CryptoPriceOverview } from '@/components/CryptoPriceOverview';
import { CryptoPriceChart } from '@/components/CryptoPriceChart';
import { AIProjections } from '@/components/AIProjections';
import { SentimentAnalytics } from '@/components/SentimentAnalytics';
import { MarketMetrics } from '@/components/MarketMetrics';

export function ICPDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Internet Computer (ICP)
        </h2>
        <p className="text-lg text-muted-foreground">
          Real-time price tracking with AI-powered projections and sentiment analysis
        </p>
      </div>

      {/* Price Overview */}
      <CryptoPriceOverview cryptoId="icp" />

      {/* Market Metrics */}
      <MarketMetrics cryptoId="icp" />

      {/* AI Projections */}
      <AIProjections cryptoId="icp" />

      {/* Sentiment Analytics */}
      <SentimentAnalytics cryptoId="icp" />

      {/* Interactive Chart */}
      <CryptoPriceChart cryptoId="icp" />
    </div>
  );
}
