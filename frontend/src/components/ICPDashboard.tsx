import { ICPPriceOverview } from '@/components/ICPPriceOverview';
import { ICPPriceChart } from '@/components/ICPPriceChart';
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
      <ICPPriceOverview />

      {/* Market Metrics */}
      <MarketMetrics />

      {/* AI Projections */}
      <AIProjections />

      {/* Sentiment Analytics */}
      <SentimentAnalytics />

      {/* Interactive Chart */}
      <ICPPriceChart />
    </div>
  );
}
