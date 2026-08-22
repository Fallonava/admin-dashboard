import { NextRequest, NextResponse } from "next/server";
import { TrafficService } from "@/features/traffic/services/TrafficService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const daysParam = searchParams.get("days");
    const parsedDays = daysParam ? parseInt(daysParam, 10) : 7;
    const days = isNaN(parsedDays) ? 7 : parsedDays;
    const path = searchParams.get("path") || undefined;

    const stats = await TrafficService.getStats(days, path);
    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    console.error("[Traffic API] Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic stats", details: error?.message },
      { status: 500 }
    );
  }
}
