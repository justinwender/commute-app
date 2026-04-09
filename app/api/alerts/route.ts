import { NextResponse } from "next/server";
import { kv } from "../../../lib/kv";
import type { ConditionsResponse } from "../../types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cached = await kv.get<ConditionsResponse>("conditions:current");

    if (cached) {
      return NextResponse.json(cached);
    }

    // No cached data — return empty response with old timestamp so client falls back to static
    return NextResponse.json({
      updatedAt: new Date(0).toISOString(),
      banner: null,
      conditions: {},
    });
  } catch {
    return NextResponse.json({
      updatedAt: new Date(0).toISOString(),
      banner: null,
      conditions: {},
    });
  }
}
