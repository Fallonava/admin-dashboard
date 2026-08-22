import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface TrafficHitInput {
  path: string;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}

export class TrafficService {
  /**
   * Hashes IP address with daily salt for anonymized privacy-safe unique visitor counts
   */
  private static hashIp(ip: string | null | undefined): string | null {
    if (!ip) return null;
    const cleanIp = ip.split(',')[0].trim();
    // Daily salt ensures IP cannot be permanently tracked across months
    const dateSalt = new Date().toISOString().slice(0, 10);
    return crypto.createHash("sha256").update(`${cleanIp}-${dateSalt}-simed_salt`).digest("hex").slice(0, 24);
  }

  /**
   * Fast User-Agent parser without heavy dependencies
   */
  private static parseUserAgent(ua: string | null | undefined) {
    if (!ua) {
      return { device: "unknown", os: "Unknown", browser: "Unknown" };
    }

    const uaLower = ua.toLowerCase();

    // Bot detection
    if (
      uaLower.includes("bot") ||
      uaLower.includes("crawler") ||
      uaLower.includes("spider") ||
      uaLower.includes("lighthouse") ||
      uaLower.includes("pingdom")
    ) {
      return { device: "bot", os: "Bot", browser: "Bot" };
    }

    // Device
    let device = "desktop";
    if (uaLower.includes("mobile") || uaLower.includes("iphone") || (uaLower.includes("android") && !uaLower.includes("tablet"))) {
      device = "mobile";
    } else if (uaLower.includes("tablet") || uaLower.includes("ipad")) {
      device = "tablet";
    }

    // OS
    let os = "Other";
    if (uaLower.includes("android")) os = "Android";
    else if (uaLower.includes("iphone") || uaLower.includes("ipad") || uaLower.includes("ios")) os = "iOS";
    else if (uaLower.includes("windows")) os = "Windows";
    else if (uaLower.includes("macintosh") || uaLower.includes("mac os")) os = "macOS";
    else if (uaLower.includes("linux")) os = "Linux";

    // Browser
    let browser = "Other";
    if (uaLower.includes("edg/")) browser = "Edge";
    else if (uaLower.includes("chrome") && !uaLower.includes("edg/")) browser = "Chrome";
    else if (uaLower.includes("safari") && !uaLower.includes("chrome")) browser = "Safari";
    else if (uaLower.includes("firefox")) browser = "Firefox";
    else if (uaLower.includes("samsungbrowser")) browser = "Samsung Browser";
    else if (uaLower.includes("whatsapp")) browser = "WhatsApp Webview";

    return { device, os, browser };
  }

  /**
   * Classify referrer source
   */
  private static parseReferrer(ref: string | null | undefined): string {
    if (!ref || ref === "direct" || ref === "") return "Langsung (Direct)";
    const refLower = ref.toLowerCase();
    if (refLower.includes("whatsapp") || refLower.includes("wa.me")) return "WhatsApp";
    if (refLower.includes("google")) return "Google Search";
    if (refLower.includes("instagram")) return "Instagram";
    if (refLower.includes("facebook") || refLower.includes("fb")) return "Facebook";
    if (refLower.includes("t.co") || refLower.includes("twitter") || refLower.includes("x.com")) return "Twitter / X";
    if (refLower.includes("fallonava.my.id")) return "Internal Portal";
    
    try {
      const url = new URL(ref);
      return url.hostname;
    } catch {
      return "Lainnya";
    }
  }

  /**
   * Record a single hit asynchronously (non-blocking)
   */
  static async recordHit(input: TrafficHitInput) {
    try {
      const ipHash = this.hashIp(input.ip);
      const { device, os, browser } = this.parseUserAgent(input.userAgent);
      const referrer = this.parseReferrer(input.referrer);

      // Normalise path (e.g. remove query strings or trailing slash)
      let cleanPath = input.path.split("?")[0];
      if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
        cleanPath = cleanPath.slice(0, -1);
      }

      await (prisma as any).trafficHit.create({
        data: {
          path: cleanPath,
          ipHash,
          userAgent: input.userAgent ? input.userAgent.slice(0, 500) : null,
          device,
          os,
          browser,
          referrer,
        },
      });
      return { success: true };
    } catch (error) {
      console.error("[TrafficService] Failed to record hit:", error);
      return { success: false };
    }
  }

  /**
   * Aggregate traffic stats for dashboard display
   */
  static async getStats(days = 7, targetPath?: string) {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const whereClause: any = {
      createdAt: { gte: startDate },
    };
    if (targetPath) {
      whereClause.path = targetPath;
    }

    // Fetch hits for the given range
    const hits: any[] = await (prisma as any).trafficHit.findMany({
      where: whereClause,
      select: {
        id: true,
        path: true,
        ipHash: true,
        device: true,
        os: true,
        browser: true,
        referrer: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 1. Overview counts
    const todayHits = hits.filter((h) => h.createdAt >= startOfToday);
    const todayViews = todayHits.length;
    const todayUniques = new Set(todayHits.map((h) => h.ipHash).filter(Boolean)).size;

    const totalViews = hits.length;
    const totalUniques = new Set(hits.map((h) => h.ipHash).filter(Boolean)).size;

    // 2. Hourly breakdown for Today (00:00 - 23:00)
    const hourlyMap: Record<number, { views: number; uniques: Set<string> }> = {};
    for (let h = 0; h < 24; h++) {
      hourlyMap[h] = { views: 0, uniques: new Set() };
    }
    todayHits.forEach((hit) => {
      const hour = new Date(hit.createdAt).getHours();
      hourlyMap[hour].views += 1;
      if (hit.ipHash) hourlyMap[hour].uniques.add(hit.ipHash);
    });

    const hourlyTrend = Object.entries(hourlyMap).map(([hourStr, data]) => ({
      hour: `${hourStr.padStart(2, "0")}:00`,
      views: data.views,
      uniques: data.uniques.size,
    }));

    // Find peak hour today
    let peakHour = "-";
    let maxHourlyViews = 0;
    hourlyTrend.forEach((item) => {
      if (item.views > maxHourlyViews) {
        maxHourlyViews = item.views;
        peakHour = `${item.hour} (${item.views} views)`;
      }
    });

    // 3. Daily breakdown (last N days)
    const dailyMap: Record<string, { views: number; uniques: Set<string> }> = {};
    for (let d = 0; d <= days; d++) {
      const dDate = new Date();
      dDate.setDate(dDate.getDate() - (days - d));
      const key = dDate.toISOString().slice(0, 10);
      dailyMap[key] = { views: 0, uniques: new Set() };
    }

    hits.forEach((hit) => {
      const key = hit.createdAt.toISOString().slice(0, 10);
      if (dailyMap[key]) {
        dailyMap[key].views += 1;
        if (hit.ipHash) dailyMap[key].uniques.add(hit.ipHash);
      }
    });

    const dailyTrend = Object.entries(dailyMap).map(([dateStr, data]) => {
      const dateObj = new Date(dateStr);
      const label = dateObj.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
      return {
        date: dateStr,
        label,
        views: data.views,
        uniques: data.uniques.size,
      };
    });

    // 4. Breakdown by Device
    const deviceCounts: Record<string, number> = {};
    hits.forEach((h) => {
      const dev = h.device || "Lainnya";
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });
    const deviceBreakdown = Object.entries(deviceCounts).map(([name, count]) => ({
      name: name === "mobile" ? "Smartphone" : name === "desktop" ? "Komputer / Laptop" : name === "tablet" ? "Tablet" : "Lainnya",
      count,
      percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
    }));

    // 5. Breakdown by OS
    const osCounts: Record<string, number> = {};
    hits.forEach((h) => {
      const os = h.os || "Lainnya";
      osCounts[os] = (osCounts[os] || 0) + 1;
    });
    const osBreakdown = Object.entries(osCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 6. Breakdown by Referrer
    const referrerCounts: Record<string, number> = {};
    hits.forEach((h) => {
      const ref = h.referrer || "Langsung (Direct)";
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });
    const referrerBreakdown = Object.entries(referrerCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 7. Breakdown by Path
    const pathCounts: Record<string, number> = {};
    hits.forEach((h) => {
      const p = h.path || "/";
      pathCounts[p] = (pathCounts[p] || 0) + 1;
    });
    const pathBreakdown = Object.entries(pathCounts)
      .map(([path, count]) => ({
        path,
        count,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      overview: {
        todayViews,
        todayUniques,
        totalViews,
        totalUniques,
        peakHour,
      },
      hourlyTrend,
      dailyTrend,
      deviceBreakdown,
      osBreakdown,
      referrerBreakdown,
      pathBreakdown,
      recentHits: hits.slice(0, 15).map((h) => ({
        id: h.id,
        path: h.path,
        device: h.device,
        os: h.os,
        browser: h.browser,
        referrer: h.referrer,
        createdAt: h.createdAt,
      })),
    };
  }
}
