export enum RoundState {
  ANNOUNCED = 0,
  OPEN = 1,
  MATCHED = 2,
  ACTIVE = 3,
  MATURED = 4,
  SETTLED = 5,
  CANCELED = 6
}

export const ROUND_STATE_LABELS: Record<RoundState, string> = {
  [RoundState.ANNOUNCED]: "Announced",
  [RoundState.OPEN]: "Open",
  [RoundState.MATCHED]: "Matched",
  [RoundState.ACTIVE]: "Active",
  [RoundState.MATURED]: "Matured",
  [RoundState.SETTLED]: "Settled",
  [RoundState.CANCELED]: "Canceled"
};

export const ROUND_STATE_COLORS: Record<RoundState, string> = {
  [RoundState.ANNOUNCED]: "bg-blue-500",
  [RoundState.OPEN]: "bg-green-500",
  [RoundState.MATCHED]: "bg-yellow-500",
  [RoundState.ACTIVE]: "bg-purple-500",
  [RoundState.MATURED]: "bg-orange-500",
  [RoundState.SETTLED]: "bg-gray-500",
  [RoundState.CANCELED]: "bg-red-500"
};

export const ROUND_STATE_TEXT_COLORS: Record<RoundState, string> = {
  [RoundState.ANNOUNCED]: "text-blue-400",
  [RoundState.OPEN]: "text-green-400",
  [RoundState.MATCHED]: "text-yellow-400",
  [RoundState.ACTIVE]: "text-purple-400",
  [RoundState.MATURED]: "text-orange-400",
  [RoundState.SETTLED]: "text-gray-400",
  [RoundState.CANCELED]: "text-red-400"
};

export function getRoundStateLabel(state: number): string {
  return ROUND_STATE_LABELS[state as RoundState] || "Unknown";
}

export function getRoundStateColor(state: number): string {
  return ROUND_STATE_COLORS[state as RoundState] || "bg-gray-500";
}

export function getRoundStateTextColor(state: number): string {
  return ROUND_STATE_TEXT_COLORS[state as RoundState] || "text-gray-400";
}

export const RISK_LEVELS = {
  LOW: { label: "Low Risk", color: "text-green-400", bgColor: "bg-green-500/20" },
  MEDIUM: { label: "Medium Risk", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  HIGH: { label: "High Risk", color: "text-red-400", bgColor: "bg-red-500/20" }
} as const;

export function getRiskLevel(triggerBps: number) {
  if (triggerBps <= 500) return RISK_LEVELS.LOW;
  if (triggerBps <= 1000) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.HIGH;
}