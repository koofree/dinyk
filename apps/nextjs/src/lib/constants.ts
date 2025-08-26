// Risk levels
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export const RISK_COLORS = {
  LOW: 'text-green-500',
  MEDIUM: 'text-yellow-500', 
  HIGH: 'text-red-500',
} as const;