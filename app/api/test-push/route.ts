import { NextResponse } from "next/server";
import { kv } from "../../../lib/kv";
import { sendPush } from "../../../lib/push";
import type { PushSubscription } from "web-push";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const subscription = await kv.get<PushSubscription>("push:subscription");

    if (!subscription) {
      return NextResponse.json(
        { error: "No push subscription found" },
        { status: 404 }
      );
    }

    await sendPush(subscription, {
      title: "Commute — Test",
      body: "Push notifications are working!",
      url: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Test push error:", err);
    return NextResponse.json({ error: "Push failed" }, { status: 500 });
  }
}
