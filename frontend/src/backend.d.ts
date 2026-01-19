import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PriceCache {
    timestamp: bigint;
    price: number;
}
export interface Coin {
    id: string;
    currentPrice: number;
    marketCap?: number;
    name: string;
    priceChange24h?: number;
    symbol: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PriceRange {
    low: number;
    high: number;
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
export interface PortfolioGoal {
    isCompleted: boolean;
    name: string;
    target: number;
}
export interface UserProfile {
    name: string;
}
export interface http_header {
    value: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTopCryptosToCache(newTopCryptos: Array<Coin>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPriceAlert(price: number): Promise<void>;
    deletePriceAlert(price: number): Promise<void>;
    getAlerts(): Promise<Array<[number, boolean]>>;
    getAllCryptosLiveData(): Promise<string>;
    getCachedPriceHistory(): Promise<Array<PriceCache>>;
    getCachedTopCryptos(): Promise<Array<Coin>>;
    getCachedUNIPriceHistory(): Promise<Array<PriceCache>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyHighLowFromCache(): Promise<PriceRange>;
    getHistoricalDataRange(): Promise<{
        end: bigint;
        start: bigint;
    }>;
    getHistoricalPriceHistory(params: TimeframeParams): Promise<Array<PriceCache>>;
    getICPLivePrice(): Promise<string>;
    getPortfolioGoals(): Promise<Array<PortfolioGoal>>;
    getPortfolioSummary(): Promise<PortfolioSummary>;
    getResampledPriceHistory(intervalNanos: bigint): Promise<Array<PriceCache>>;
    getUNILivePrice(): Promise<string>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    recordNewICPPrice(price: number): Promise<void>;
    recordNewUNIPrice(price: number): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePortfolioGoals(goals: Array<PortfolioGoal>): Promise<void>;
    toggleAlertStatus(price: number): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
