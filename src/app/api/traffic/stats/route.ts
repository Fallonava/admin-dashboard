import { NextRequest, NextResponse } from "next/server";
import { TrafficService } from "@/features/traffic/services/TrafficService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7", 10);
    const path = searchParams.get("path") || undefined;

    const stats = await TrafficService.getStats(isNaN(days) ? 7 : days, path);
    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    console.error("[Traffic API] Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic stats", details: error?.message },
      { status: 500 }
    );
  }
}
