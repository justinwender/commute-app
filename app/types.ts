export interface AlertItem {
  line: string;
  description: string;
}

export interface LineCondition {
  reliabilityDots: number;
  reliabilityColor: "green" | "amber" | "red";
  crowdingDots: number;
  crowdingColor: "green" | "amber" | "red";
  estTimeDelta: string | null;
}

export interface ConditionsResponse {
  updatedAt: string;
  banner: AlertItem[] | null;
  conditions: Record<string, LineCondition>;
}
