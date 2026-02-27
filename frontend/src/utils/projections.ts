export interface MonthlyProjection {
  month: number;
  label: string;
  low: number;
  mid: number;
  high: number;
  confidence: number;
}

export function generateProjections(
  currentPrice: number,
  historicalPrices: number[]
): MonthlyProjection[] {
  if (historicalPrices.length < 5) {
    // Fallback: flat projections with low confidence
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: getMonthLabel(i + 1),
      low: currentPrice * (1 - 0.1 * (i + 1) * 0.3),
      mid: currentPrice,
      high: currentPrice * (1 + 0.1 * (i + 1) * 0.3),
      confidence: Math.max(20, 50 - i * 3),
    }));
  }

  const n = historicalPrices.length;

  // Linear regression on log prices for better trend estimation
  const logPrices = historicalPrices.map((p) => Math.log(Math.max(p, 1e-10)));
  const sumX = logPrices.reduce((s, _, i) => s + i, 0);
  const sumY = logPrices.reduce((s, v) => s + v, 0);
  const sumXY = logPrices.reduce((s, v, i) => s + i * v, 0);
  const sumX2 = logPrices.reduce((s, _, i) => s + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Daily momentum (slope per day)
  const dailyMomentum = slope;

  // Volatility: std dev of daily log returns
  const logReturns: number[] = [];
  for (let i = 1; i < logPrices.length; i++) {
    logReturns.push(logPrices[i] - logPrices[i - 1]);
  }
  const avgReturn = logReturns.reduce((s, v) => s + v, 0) / logReturns.length;
  const variance =
    logReturns.reduce((s, v) => s + Math.pow(v - avgReturn, 2), 0) / logReturns.length;
  const dailyVolatility = Math.sqrt(variance);

  // Monthly volatility (approx 30 trading days)
  const monthlyVolatility = dailyVolatility * Math.sqrt(30);

  // Projected log price at end of each month
  const lastLogPrice = logPrices[logPrices.length - 1];

  return Array.from({ length: 12 }, (_, i) => {
    const monthsAhead = i + 1;
    const daysAhead = monthsAhead * 30;

    // Drift-adjusted projection (log-normal model)
    const drift = (dailyMomentum - 0.5 * dailyVolatility * dailyVolatility) * daysAhead;
    const projectedLogMid = lastLogPrice + drift;
    const spreadFactor = monthlyVolatility * Math.sqrt(monthsAhead);

    const mid = Math.exp(projectedLogMid);
    const low = Math.exp(projectedLogMid - 1.5 * spreadFactor);
    const high = Math.exp(projectedLogMid + 1.5 * spreadFactor);

    // Confidence decreases with time and volatility
    const baseConfidence = 85;
    const volatilityPenalty = Math.min(40, dailyVolatility * 100 * monthsAhead * 2);
    const timePenalty = monthsAhead * 2;
    const confidence = Math.max(10, Math.round(baseConfidence - volatilityPenalty - timePenalty));

    return {
      month: monthsAhead,
      label: getMonthLabel(monthsAhead),
      low: Math.max(0, low),
      mid: Math.max(0, mid),
      high: Math.max(0, high),
      confidence,
    };
  });
}

function getMonthLabel(monthsAhead: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  return date.toLocaleString('default', { month: 'short', year: '2-digit' });
}

export function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  if (price >= 0.0001) return `$${price.toFixed(6)}`;
  return `$${price.toExponential(4)}`;
}

export function formatLargeNumber(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return '—';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}
