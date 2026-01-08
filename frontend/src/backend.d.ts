import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ICPPortfolio {
    coins: number;
    avgCost: number;
}
export interface AlertStatus {
    isActive: boolean;
    price: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
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
    deleteAlert(price: number): Promise<void>;
    getAlertList(): Promise<Array<AlertStatus>>;
    getHistoricalPrices(): Promise<Array<number>>;
    getICPLivePrice(): Promise<string>;
    getPortfolioSummary(): Promise<ICPPortfolio>;
    setAlertActive(price: number, active: boolean): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
