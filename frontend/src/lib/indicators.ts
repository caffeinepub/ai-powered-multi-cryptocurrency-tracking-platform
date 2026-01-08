// Technical Indicators Calculation Library

export interface IndicatorData {
  timestamp: number;
  value: number;
}

export interface MACDData {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface TTMSqueezeData {
  timestamp: number;
  value: number;
  squeeze: boolean; // true if in squeeze
}

/**
 * Calculate RSI (Relative Strength Index)
 * @param data - Array of price data points
 * @param period - RSI period (default: 14)
 * @returns Array of RSI values
 */
export function calculateRSI(
  data: { timestamp: number; price: number }[],
  period: number = 14
): IndicatorData[] {
  if (data.length < period + 1) return [];

  const rsiData: IndicatorData[] = [];
  let gains = 0;
  let losses = 0;

  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].price - data[i - 1].price;
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate RSI for initial period
  let rs = avgGain / (avgLoss || 0.0001);
  let rsi = 100 - 100 / (1 + rs);
  rsiData.push({ timestamp: data[period].timestamp, value: rsi });

  // Calculate RSI for remaining data using smoothed averages
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].price - data[i - 1].price;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgGain / (avgLoss || 0.0001);
    rsi = 100 - 100 / (1 + rs);

    rsiData.push({ timestamp: data[i].timestamp, value: rsi });
  }

  return rsiData;
}

/**
 * Calculate EMA (Exponential Moving Average)
 * @param data - Array of price data points
 * @param period - EMA period
 * @returns Array of EMA values
 */
function calculateEMA(
  data: { timestamp: number; price: number }[],
  period: number
): IndicatorData[] {
  if (data.length < period) return [];

  const emaData: IndicatorData[] = [];
  const multiplier = 2 / (period + 1);

  // Calculate initial SMA as first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].price;
  }
  let ema = sum / period;
  emaData.push({ timestamp: data[period - 1].timestamp, value: ema });

  // Calculate EMA for remaining data
  for (let i = period; i < data.length; i++) {
    ema = (data[i].price - ema) * multiplier + ema;
    emaData.push({ timestamp: data[i].timestamp, value: ema });
  }

  return emaData;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param data - Array of price data points
 * @param fastPeriod - Fast EMA period (default: 12)
 * @param slowPeriod - Slow EMA period (default: 26)
 * @param signalPeriod - Signal line period (default: 9)
 * @returns Array of MACD data
 */
export function calculateMACD(
  data: { timestamp: number; price: number }[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDData[] {
  if (data.length < slowPeriod + signalPeriod) return [];

  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  if (fastEMA.length === 0 || slowEMA.length === 0) return [];

  // Calculate MACD line
  const macdLine: IndicatorData[] = [];
  const startIndex = slowPeriod - fastPeriod;

  for (let i = 0; i < slowEMA.length; i++) {
    const macdValue = fastEMA[i + startIndex].value - slowEMA[i].value;
    macdLine.push({
      timestamp: slowEMA[i].timestamp,
      value: macdValue,
    });
  }

  // Calculate signal line (EMA of MACD)
  const signalLine = calculateEMA(
    macdLine.map((d) => ({ timestamp: d.timestamp, price: d.value })),
    signalPeriod
  );

  // Combine MACD and signal line
  const macdData: MACDData[] = [];
  const signalStartIndex = signalPeriod - 1;

  for (let i = signalStartIndex; i < macdLine.length; i++) {
    const signalIndex = i - signalStartIndex;
    macdData.push({
      timestamp: macdLine[i].timestamp,
      macd: macdLine[i].value,
      signal: signalLine[signalIndex].value,
      histogram: macdLine[i].value - signalLine[signalIndex].value,
    });
  }

  return macdData;
}

/**
 * Calculate Bollinger Bands
 * @param data - Array of price data points
 * @param period - Period for moving average (default: 20)
 * @param stdDev - Standard deviation multiplier (default: 2)
 * @returns Object with upper, middle, and lower bands
 */
function calculateBollingerBands(
  data: { timestamp: number; price: number }[],
  period: number = 20,
  stdDev: number = 2
): { timestamp: number; upper: number; middle: number; lower: number }[] {
  if (data.length < period) return [];

  const bands: { timestamp: number; upper: number; middle: number; lower: number }[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, d) => acc + d.price, 0);
    const mean = sum / period;

    const variance =
      slice.reduce((acc, d) => acc + Math.pow(d.price - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    bands.push({
      timestamp: data[i].timestamp,
      upper: mean + stdDev * standardDeviation,
      middle: mean,
      lower: mean - stdDev * standardDeviation,
    });
  }

  return bands;
}

/**
 * Calculate Keltner Channels
 * @param data - Array of price data with high, low, close
 * @param period - Period for EMA (default: 20)
 * @param atrPeriod - Period for ATR (default: 20)
 * @param multiplier - ATR multiplier (default: 1.5)
 * @returns Object with upper, middle, and lower channels
 */
function calculateKeltnerChannels(
  data: { timestamp: number; high: number; low: number; close: number }[],
  period: number = 20,
  atrPeriod: number = 20,
  multiplier: number = 1.5
): { timestamp: number; upper: number; middle: number; lower: number }[] {
  if (data.length < Math.max(period, atrPeriod)) return [];

  // Calculate EMA of close prices
  const emaData = calculateEMA(
    data.map((d) => ({ timestamp: d.timestamp, price: d.close })),
    period
  );

  // Calculate ATR (Average True Range)
  const atr: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    atr.push(tr);
  }

  // Calculate average ATR
  const atrValues: number[] = [];
  for (let i = atrPeriod - 1; i < atr.length; i++) {
    const slice = atr.slice(i - atrPeriod + 1, i + 1);
    const avgATR = slice.reduce((acc, val) => acc + val, 0) / atrPeriod;
    atrValues.push(avgATR);
  }

  // Combine EMA and ATR to create Keltner Channels
  const channels: { timestamp: number; upper: number; middle: number; lower: number }[] = [];
  const startIndex = Math.max(period - 1, atrPeriod);

  for (let i = 0; i < Math.min(emaData.length, atrValues.length); i++) {
    const emaIndex = i + (atrPeriod - period + 1);
    if (emaIndex >= 0 && emaIndex < emaData.length) {
      const middle = emaData[emaIndex].value;
      const atrValue = atrValues[i];
      channels.push({
        timestamp: emaData[emaIndex].timestamp,
        upper: middle + multiplier * atrValue,
        middle: middle,
        lower: middle - multiplier * atrValue,
      });
    }
  }

  return channels;
}

/**
 * Calculate TTM Squeeze Indicator with adaptive period handling
 * @param data - Array of price data with high, low, close
 * @param bbPeriod - Bollinger Bands period (default: 20)
 * @param bbStdDev - Bollinger Bands standard deviation (default: 2)
 * @param kcPeriod - Keltner Channel period (default: 20)
 * @param kcMultiplier - Keltner Channel multiplier (default: 1.5)
 * @returns Array of TTM Squeeze data
 */
export function calculateTTMSqueeze(
  data: { timestamp: number; high: number; low: number; close: number }[],
  bbPeriod: number = 20,
  bbStdDev: number = 2,
  kcPeriod: number = 20,
  kcMultiplier: number = 1.5
): TTMSqueezeData[] {
  // Adjust periods based on data density to handle varying timeframes
  const dataLength = data.length;
  const adjustedBBPeriod = Math.min(bbPeriod, Math.floor(dataLength / 3));
  const adjustedKCPeriod = Math.min(kcPeriod, Math.floor(dataLength / 3));
  
  if (dataLength < Math.max(adjustedBBPeriod, adjustedKCPeriod) * 2) {
    // Not enough data for meaningful TTM calculation
    return [];
  }

  // For price data without high/low, use close as approximation
  const priceData = data.map((d) => ({
    timestamp: d.timestamp,
    high: d.high || d.close,
    low: d.low || d.close,
    close: d.close,
  }));

  const bollingerBands = calculateBollingerBands(
    priceData.map((d) => ({ timestamp: d.timestamp, price: d.close })),
    adjustedBBPeriod,
    bbStdDev
  );

  const keltnerChannels = calculateKeltnerChannels(
    priceData,
    adjustedKCPeriod,
    adjustedKCPeriod,
    kcMultiplier
  );

  if (bollingerBands.length === 0 || keltnerChannels.length === 0) return [];

  // Calculate momentum (simplified version using linear regression)
  const squeezeData: TTMSqueezeData[] = [];
  const momentumPeriod = Math.min(12, Math.floor(dataLength / 8));

  for (let i = 0; i < Math.min(bollingerBands.length, keltnerChannels.length); i++) {
    const bb = bollingerBands[i];
    const kc = keltnerChannels[i];

    // Squeeze is on when Bollinger Bands are inside Keltner Channels
    const squeeze = bb.lower > kc.lower && bb.upper < kc.upper;

    // Calculate momentum (simplified)
    let momentum = 0;
    if (i >= momentumPeriod) {
      const dataSlice = priceData.slice(
        Math.max(0, i - momentumPeriod),
        i + 1
      );
      if (dataSlice.length > 0) {
        const firstPrice = dataSlice[0].close;
        const lastPrice = dataSlice[dataSlice.length - 1].close;
        momentum = lastPrice - firstPrice;
      }
    }

    squeezeData.push({
      timestamp: bb.timestamp,
      value: momentum,
      squeeze: squeeze,
    });
  }

  return squeezeData;
}

/**
 * Prepare price data for TTM Squeeze calculation
 * Converts simple price data to OHLC format
 */
export function preparePriceDataForTTM(
  data: { timestamp: number; price: number }[]
): { timestamp: number; high: number; low: number; close: number }[] {
  return data.map((d) => ({
    timestamp: d.timestamp,
    high: d.price,
    low: d.price,
    close: d.price,
  }));
}
