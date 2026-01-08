import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PriceCache {
    timestamp: bigint;
    price: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TimeframeParams {
    timeframe: string;
    intervalNanos: bigint;
    priceData: Array<PriceCache>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface PortfolioSummary {
    coins: number;
    profitLossDollar: number;
    avgCost: number;
    currentValue: number;
    profitLossPercent: number;
}
export interface PriceAlertStatus {
    isTriggered: boolean;
    price: number;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface backendInterface {
    getAlerts(): Promise<Array<PriceAlertStatus>>;
    getCachedPriceHistory(): Promise<Array<PriceCache>>;
    getHistoricalDataRange(): Promise<{
        end: bigint;
        start: bigint;
    }>;
    getHistoricalPriceHistory(params: TimeframeParams): Promise<Array<PriceCache>>;
    getICPLivePrice(): Promise<string>;
    getPortfolioSummary(): Promise<PortfolioSummary>;
    getResampledPriceHistory(intervalNanos: bigint): Promise<Array<PriceCache>>;
    getTopCryptos(): Promise<string>;
    recordNewICPPrice(price: number): Promise<void>;
    toggleAlertStatus(price: number): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
