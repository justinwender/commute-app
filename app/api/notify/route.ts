import { NextRequest, NextResponse } from "next/server";
import { kv } from "../../../lib/kv";
import { fetchAlerts, fetchCrowding, isHighPriorityAlert } from "../../../lib/mta";
import { buildConditions } from "../../../lib/conditions";
import { sendPush } from "../../../lib/push";
import type { PushSubscription } from "web-push";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch MTA data in parallel
    const [alerts, crowding] = await Promise.all([
      fetchAlerts(),
      fetchCrowding(),
    ]);

    // Build conditions
    const { conditions, banner } = buildConditions(
      alerts.map((a) => ({
        lineId: a.lineId,
        severity: a.severity,
        description: a.description,
        alertId: a.alertId,
      })),
      crowding.map((c) => ({ lineId: c.lineId, level: c.level }))
    );

    // Store in KV
    const conditionsData = {
      updatedAt: new Date().toISOString(),
      banner: banner.length > 0 ? banner : null,
      conditions,
    };
    await kv.set("conditions:current", conditionsData, { ex: 3600 }); // 1hr TTL

    // Check for new significant alerts and push
    const seenAlertIds = (await kv.smembers("alerts:seen")) as string[] || [];
    const seenSet = new Set(seenAlertIds);

    const newHighPriorityAlerts = alerts.filter(
      (a) => isHighPriorityAlert(a) && !seenSet.has(a.alertId)
    );

    if (newHighPriorityAlerts.length > 0) {
      // Get push subscription
      const subscription = await kv.get<PushSubscription>("push:subscription");

      if (subscription) {
        const alertSummary = newHighPriorityAlerts
          .map((a) => `${a.lineId}: ${a.description}`)
          .join(" · ");

        try {
          await sendPush(subscription, {
            title: "Commute Alert",
            body: alertSummary,
            url: "/",
          });
        } catch (err) {
          console.error("Push send failed:", err);
        }
      }

      // Mark alerts as seen
      for (const a of newHighPriorityAlerts) {
        await kv.sadd("alerts:seen", a.alertId);
      }
    }

    // Clear old seen alerts (older than 24h) — simple approach: clear and re-add current
    // Since alert IDs change with each incident, periodic cleanup prevents unbounded growth
    const currentAlertIds = alerts.map((a) => a.alertId);
    if (seenAlertIds.length > 100) {
      await kv.del("alerts:seen");
      for (const id of currentAlertIds) {
        await kv.sadd("alerts:seen", id);
      }
    }

    return NextResponse.json({
      ok: true,
      alertCount: alerts.length,
      pushed: newHighPriorityAlerts.length,
    });
  } catch (err) {
    console.error("Notify cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
