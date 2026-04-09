import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import type { AlertSeverity } from "./conditions";

const MTA_API_KEY = process.env.MTA_API_KEY || "";
const ALERTS_URL = "https://api-endpoint.mta.info/Feeds/nyct%2Fgtfs-ace";
const ALERTS_FEED_URL =
  "https://api-endpoint.mta.info/Feeds/nyct%2Fgtfs";

// Service alerts feed
const SERVICE_ALERTS_URL =
  "https://api-endpoint.mta.info/Feeds/camsys%2Fsubway-alerts";

const WATCHED_LINES = new Set(["7", "E", "C", "R", "W", "B", "D", "F", "M"]);
const HIGH_PRIORITY_LINES = new Set(["7", "E", "C", "R"]);

export interface ParsedAlert {
  alertId: string;
  lineId: string;
  severity: AlertSeverity;
  description: string;
}

export interface ParsedCrowding {
  lineId: string;
  level: "not_crowded" | "some_crowding" | "crowded" | "very_crowded" | "extremely_crowded";
}

function routeIdToLine(routeId: string): string | null {
  // MTA route IDs: "MTASBWY:7", "MTASBWY:E", etc. or just "7", "E"
  const line = routeId.replace("MTASBWY:", "").trim();
  return WATCHED_LINES.has(line) ? line : null;
}

function mapMtaEffect(effect: number | undefined): AlertSeverity {
  // GTFS-RT Alert Effect enum
  // 1 = NO_SERVICE, 2 = REDUCED_SERVICE, 3 = SIGNIFICANT_DELAYS
  // 6 = MODIFIED_SERVICE, 7 = OTHER_EFFECT, 8 = STOP_MOVED
  switch (effect) {
    case 1: // NO_SERVICE
      return "suspension";
    case 2: // REDUCED_SERVICE
    case 3: // SIGNIFICANT_DELAYS
      return "major";
    case 6: // MODIFIED_SERVICE
    case 7: // OTHER_EFFECT
      return "minor";
    default:
      return "minor";
  }
}

export async function fetchAlerts(): Promise<ParsedAlert[]> {
  try {
    const res = await fetch(SERVICE_ALERTS_URL, {
      headers: { "x-api-key": MTA_API_KEY },
    });
    if (!res.ok) {
      console.error("MTA alerts fetch failed:", res.status);
      return [];
    }

    const buffer = await res.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    const alerts: ParsedAlert[] = [];

    for (const entity of feed.entity) {
      if (!entity.alert) continue;

      const alert = entity.alert;
      const affectedLines = new Set<string>();

      for (const ie of alert.informedEntity || []) {
        const routeId = ie.routeId;
        if (routeId) {
          const line = routeIdToLine(routeId);
          if (line) affectedLines.add(line);
        }
      }

      if (affectedLines.size === 0) continue;

      const severity = mapMtaEffect(alert.effect as number | undefined);
      const descText =
        alert.headerText?.translation?.[0]?.text || "Service alert";

      // Filter out non-commute-hours planned work
      const now = Date.now() / 1000;
      const activePeriods = alert.activePeriod || [];
      const isCurrentlyActive = activePeriods.length === 0 || activePeriods.some(
        (p) => {
          const start = Number(p.start ?? 0);
          const end = Number(p.end ?? Infinity);
          return now >= start && now <= end;
        }
      );

      if (!isCurrentlyActive) continue;

      for (const line of affectedLines) {
        alerts.push({
          alertId: entity.id || `alert-${line}-${Date.now()}`,
          lineId: line,
          severity,
          description: severity === "suspension"
            ? "Suspended"
            : severity === "major"
            ? "Delays"
            : "Service Change",
        });
      }
    }

    return alerts;
  } catch (err) {
    console.error("Error fetching MTA alerts:", err);
    return [];
  }
}

export async function fetchCrowding(): Promise<ParsedCrowding[]> {
  // MTA real-time crowding data
  // Try the GTFS-RT crowding endpoint first, fall back to empty
  try {
    const res = await fetch(
      "https://api.mta.info/gtfs-rt/crowding/nyct%2Fsubway",
      { headers: { "x-api-key": MTA_API_KEY } }
    );

    if (!res.ok) {
      // Crowding data unavailable — fall back to static values
      return [];
    }

    const data = await res.json();

    // Parse crowding response — shape varies by endpoint
    const crowding: ParsedCrowding[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        const line = item.route_id || item.routeId || item.line;
        const lineId = line ? routeIdToLine(String(line)) : null;
        if (!lineId) continue;

        const occupancy = item.occupancy_status ?? item.occupancyStatus ?? item.crowding;
        crowding.push({
          lineId,
          level: mapOccupancyToLevel(occupancy),
        });
      }
    }

    return crowding;
  } catch {
    return [];
  }
}

function mapOccupancyToLevel(
  occupancy: number | string | undefined
): ParsedCrowding["level"] {
  // GTFS-RT OccupancyStatus: 0=EMPTY, 1=MANY_SEATS, 2=FEW_SEATS, 3=STANDING_ROOM, 4=CRUSHED, 5=FULL
  const n = typeof occupancy === "string" ? parseInt(occupancy, 10) : occupancy;
  if (n === undefined || n === null || isNaN(Number(n))) return "some_crowding";
  if (n <= 1) return "not_crowded";
  if (n === 2) return "some_crowding";
  if (n === 3) return "crowded";
  if (n === 4) return "very_crowded";
  return "extremely_crowded";
}

export function isHighPriorityAlert(alert: ParsedAlert): boolean {
  return (
    HIGH_PRIORITY_LINES.has(alert.lineId) &&
    (alert.severity === "major" || alert.severity === "suspension")
  );
}
