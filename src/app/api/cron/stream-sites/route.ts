import { NextRequest, NextResponse } from "next/server";
import { refreshStreamSites } from "@/lib/stream-sites";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await refreshStreamSites();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Cron stream-sites refresh failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Refresh failed" },
      { status: 500 },
    );
  }
}
