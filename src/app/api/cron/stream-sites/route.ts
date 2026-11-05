import { NextRequest, NextResponse } from "next/server";
import { refreshStreamSites } from "@/lib/stream-sites";
import { sweepExpiredAttempts } from "@/lib/attempt-throttle";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [result, swept] = await Promise.all([
      refreshStreamSites(),
      sweepExpiredAttempts(),
    ]);
    return NextResponse.json({ ok: true, swept, ...result });
  } catch (error) {
    console.error("Cron stream-sites refresh failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Refresh failed" },
      { status: 500 },
    );
  }
}
