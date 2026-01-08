import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PriceAlertStatus {
    isTriggered: boolean;
    price: number;
}
export interface PortfolioSummary {
    coins: number;
    avgCost: number;
}
export interface backendInterface {
    getAlerts(): Promise<Array<PriceAlertStatus>>;
    getPortfolioSummary(): Promise<PortfolioSummary>;
    toggleAlertStatus(price: number): Promise<void>;
}
