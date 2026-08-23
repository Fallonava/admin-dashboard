import { NextRequest, NextResponse } from "next/server";
import { TrafficService } from "@/features/traffic/services/TrafficService";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "unknown";

    // Rate limit: max 60 track hits per minute per IP to prevent spam DoS
    const isAllowed = await checkRateLimit(`traffic_${ip}`, 60, 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
    }

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
