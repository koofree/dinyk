export interface TrancheSpec {
  productId: number;
  name: string;
  triggerType: number;
  threshold: bigint;
  premiumRateBps: number;
  trancheCap: bigint;
  maturityTimestamp: number;
  perAccountMin: bigint;
  perAccountMax: bigint;
  active: boolean;
  oracleRouteId: number;
}
