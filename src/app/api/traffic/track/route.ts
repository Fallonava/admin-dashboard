import { NextRequest, NextResponse } from "next/server";
import { TrafficService } from "@/features/traffic/services/TrafficService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json") || contentType.includes("text/plain")) {
      try {
        const text = await req.text();
        if (text) body = JSON.parse(text);
      } catch {
        // Ignore json parse error for malformed beacons
      }
    }

    const ip =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      null;

    const userAgent = req.headers.get("user-agent") || null;
    const referrer = body.referrer || body.ref || req.headers.get("referer") || null;
    const path = body.path || "/jadwal";

    // Non-blocking write to prevent blocking client
    TrafficService.recordHit({
      path,
      ip,
      userAgent,
      referrer,
    }).catch((err) => console.error("[Traffic API] recordHit error:", err));

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Traffic tracker endpoint active" });
}
