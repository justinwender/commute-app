import type { LineCondition, AlertItem } from "../app/types";

export type AlertSeverity = "none" | "minor" | "major" | "suspension";

interface LineAlert {
  lineId: string;
  severity: AlertSeverity;
  description: string;
  alertId: string;
}

interface LineCrowding {
  lineId: string;
  level: "not_crowded" | "some_crowding" | "crowded" | "very_crowded" | "extremely_crowded";
}

// Baseline OTP by line (updated monthly from MTA transparency metrics)
const BASELINE_OTP: Record<string, number> = {
  "7": 88,
  E: 78,
  C: 68,
  R: 80,
  W: 76,
  B: 65,
  D: 72,
  F: 70,
  M: 74,
};

export function mapReliability(
  lineId: string,
  severity: AlertSeverity
): { dots: number; color: "green" | "amber" | "red" } {
  const otp = BASELINE_OTP[lineId] ?? 75;

  if (severity === "suspension") return { dots: 5, color: "red" };
  if (severity === "major") return { dots: 4, color: "amber" };
  if (severity === "minor" || (otp >= 65 && otp < 75)) return { dots: 3, color: "amber" };
  if (otp >= 75 && otp < 85) return { dots: 2, color: "green" };
  if (otp >= 85) return { dots: 1, color: "green" };
  return { dots: 3, color: "amber" };
}

export function mapCrowding(
  level: LineCrowding["level"]
): { dots: number; color: "green" | "amber" | "red" } {
  switch (level) {
    case "not_crowded":
      return { dots: 1, color: "green" };
    case "some_crowding":
      return { dots: 2, color: "green" };
    case "crowded":
      return { dots: 3, color: "amber" };
    case "very_crowded":
      return { dots: 4, color: "red" };
    case "extremely_crowded":
      return { dots: 5, color: "red" };
    default:
      return { dots: 2, color: "green" };
  }
}

export function mapEstTimeDelta(severity: AlertSeverity): string | null {
  switch (severity) {
    case "none":
      return null;
    case "minor":
      return "+ delays";
    case "major":
      return "+ delays";
    case "suspension":
      return "service suspended";
  }
}

export function buildConditions(
  alerts: LineAlert[],
  crowding: LineCrowding[]
): { conditions: Record<string, LineCondition>; banner: AlertItem[] } {
  const conditions: Record<string, LineCondition> = {};
  const banner: AlertItem[] = [];

  const alertsByLine = new Map<string, LineAlert>();
  for (const alert of alerts) {
    const existing = alertsByLine.get(alert.lineId);
    if (
      !existing ||
      severityRank(alert.severity) > severityRank(existing.severity)
    ) {
      alertsByLine.set(alert.lineId, alert);
    }
  }

  const crowdingByLine = new Map<string, LineCrowding>();
  for (const c of crowding) {
    crowdingByLine.set(c.lineId, c);
  }

  const allLines = ["7", "E", "C", "R", "W", "B", "D", "F", "M"];

  for (const lineId of allLines) {
    const alert = alertsByLine.get(lineId);
    const severity = alert?.severity ?? "none";
    const crowdLevel = crowdingByLine.get(lineId)?.level;

    const reliability = mapReliability(lineId, severity);
    const crowd = crowdLevel
      ? mapCrowding(crowdLevel)
      : { dots: 2, color: "green" as const };

    conditions[lineId] = {
      reliabilityDots: reliability.dots,
      reliabilityColor: reliability.color,
      crowdingDots: crowd.dots,
      crowdingColor: crowd.color,
      estTimeDelta: mapEstTimeDelta(severity),
    };

    if (alert && severity !== "none") {
      banner.push({ line: alert.lineId, description: alert.description });
    }
  }

  return { conditions, banner };
}

function severityRank(s: AlertSeverity): number {
  switch (s) {
    case "none": return 0;
    case "minor": return 1;
    case "major": return 2;
    case "suspension": return 3;
  }
}
