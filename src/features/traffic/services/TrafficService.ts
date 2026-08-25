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

  private static buffer: any[] = [];
  private static flushTimer: NodeJS.Timeout | null = null;
  private static isFlushing = false;

  private static ensureFlushTimer() {
    if (!this.flushTimer) {
      this.flushTimer = setInterval(() => {
        this.flushBuffer().catch((err) => console.error("[TrafficService] Auto-flush error:", err));
      }, 3000);
      if (this.flushTimer.unref) {
        this.flushTimer.unref(); // Allow Node process to exit gracefully
      }
    }
  }

  static async flushBuffer() {
    if (this.isFlushing || this.buffer.length === 0) return;
    this.isFlushing = true;
    const toFlush = [...this.buffer];
    this.buffer = [];

    try {
      await (prisma as any).trafficHit.createMany({
        data: toFlush,
        skipDuplicates: false,
      });
    } catch (error) {
      console.error("[TrafficService] Batch flush error:", error);
      // Re-insert failed items back into buffer if not overflowing
      if (this.buffer.length < 500) {
        this.buffer.unshift(...toFlush);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Record a single hit asynchronously (buffered non-blocking)
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

      this.buffer.push({
        path: cleanPath,
        ipHash,
        userAgent: input.userAgent ? input.userAgent.slice(0, 500) : null,
        device,
        os,
        browser,
        referrer,
      });

      this.ensureFlushTimer();

      // If buffer threshold reached, trigger immediate flush
      if (this.buffer.length >= 25) {
        this.flushBuffer().catch(() => {});
      }

      return { success: true };
    } catch (error) {
      console.error("[TrafficService] Failed to record hit:", error);
      return { success: false };
    }
  }

  /**
   * Aggregate traffic stats for dashboard display using SQL aggregation (No memory OOM)
   */
  static async getStats(days = 7, targetPath?: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const whereClause: any = {
      createdAt: { gte: startDate },
    };
    const todayWhereClause: any = {
      createdAt: { gte: startOfToday },
    };
    if (targetPath) {
      whereClause.path = targetPath;
      todayWhereClause.path = targetPath;
    }

    try {
      // 1. Overview counts using DB count & aggregations
      const [totalViews, todayViews, recentHits] = await Promise.all([
        (prisma as any).trafficHit.count({ where: whereClause }),
        (prisma as any).trafficHit.count({ where: todayWhereClause }),
        (prisma as any).trafficHit.findMany({
          where: whereClause,
          select: {
            id: true,
            path: true,
            device: true,
            os: true,
            browser: true,
            referrer: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 15,
        }),
      ]);

      // Unique counts via native SQL or distinct query
      let totalUniques = 0;
      let todayUniques = 0;

      try {
        const totalUniquesRes: any = targetPath
          ? await (prisma as any).$queryRaw`
              SELECT COUNT(DISTINCT "ipHash") as count FROM "TrafficHit" 
              WHERE "createdAt" >= ${startDate} AND "path" = ${targetPath} AND "ipHash" IS NOT NULL
            `
          : await (prisma as any).$queryRaw`
              SELECT COUNT(DISTINCT "ipHash") as count FROM "TrafficHit" 
              WHERE "createdAt" >= ${startDate} AND "ipHash" IS NOT NULL
            `;
        totalUniques = Number(totalUniquesRes?.[0]?.count ?? 0);

        const todayUniquesRes: any = targetPath
          ? await (prisma as any).$queryRaw`
              SELECT COUNT(DISTINCT "ipHash") as count FROM "TrafficHit" 
              WHERE "createdAt" >= ${startOfToday} AND "path" = ${targetPath} AND "ipHash" IS NOT NULL
            `
          : await (prisma as any).$queryRaw`
              SELECT COUNT(DISTINCT "ipHash") as count FROM "TrafficHit" 
              WHERE "createdAt" >= ${startOfToday} AND "ipHash" IS NOT NULL
            `;
        todayUniques = Number(todayUniquesRes?.[0]?.count ?? 0);
      } catch (err) {
        totalUniques = totalViews;
        todayUniques = todayViews;
      }

      // 2. Hourly breakdown for Today
      const hourlyMap: Record<number, { views: number; uniques: number }> = {};
      for (let h = 0; h < 24; h++) {
        hourlyMap[h] = { views: 0, uniques: 0 };
      }

      try {
        const hourlyData: any[] = targetPath
          ? await (prisma as any).$queryRaw`
              SELECT EXTRACT(HOUR FROM "createdAt")::int as hour, 
                     COUNT(*)::int as views, 
                     COUNT(DISTINCT "ipHash")::int as uniques
              FROM "TrafficHit"
              WHERE "createdAt" >= ${startOfToday} AND "path" = ${targetPath}
              GROUP BY 1 ORDER BY 1 ASC
            `
          : await (prisma as any).$queryRaw`
              SELECT EXTRACT(HOUR FROM "createdAt")::int as hour, 
                     COUNT(*)::int as views, 
                     COUNT(DISTINCT "ipHash")::int as uniques
              FROM "TrafficHit"
              WHERE "createdAt" >= ${startOfToday}
              GROUP BY 1 ORDER BY 1 ASC
            `;

        if (Array.isArray(hourlyData)) {
          for (const row of hourlyData) {
            const h = Number(row.hour);
            if (hourlyMap[h] !== undefined) {
              hourlyMap[h] = { views: Number(row.views || 0), uniques: Number(row.uniques || 0) };
            }
          }
        }
      } catch (e) {}

      const hourlyTrend = Object.entries(hourlyMap).map(([hourStr, data]) => ({
        hour: `${hourStr.padStart(2, "0")}:00`,
        views: data.views,
        uniques: data.uniques,
      }));

      let peakHour = "-";
      let maxHourlyViews = 0;
      hourlyTrend.forEach((item) => {
        if (item.views > maxHourlyViews) {
          maxHourlyViews = item.views;
          peakHour = `${item.hour} (${item.views} views)`;
        }
      });

      // 3. Daily breakdown (last N days)
      const dailyMap: Record<string, { views: number; uniques: number }> = {};
      for (let d = 0; d <= days; d++) {
        const dDate = new Date();
        dDate.setDate(dDate.getDate() - (days - d));
        const key = dDate.toISOString().slice(0, 10);
        dailyMap[key] = { views: 0, uniques: 0 };
      }

      try {
        const dailyData: any[] = targetPath
          ? await (prisma as any).$queryRaw`
              SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, 
                     COUNT(*)::int as views, 
                     COUNT(DISTINCT "ipHash")::int as uniques
              FROM "TrafficHit"
              WHERE "createdAt" >= ${startDate} AND "path" = ${targetPath}
              GROUP BY 1 ORDER BY 1 ASC
            `
          : await (prisma as any).$queryRaw`
              SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, 
                     COUNT(*)::int as views, 
                     COUNT(DISTINCT "ipHash")::int as uniques
              FROM "TrafficHit"
              WHERE "createdAt" >= ${startDate}
              GROUP BY 1 ORDER BY 1 ASC
            `;

        if (Array.isArray(dailyData)) {
          for (const row of dailyData) {
            if (dailyMap[row.date] !== undefined) {
              dailyMap[row.date] = { views: Number(row.views || 0), uniques: Number(row.uniques || 0) };
            }
          }
        }
      } catch (e) {}

      const dailyTrend = Object.entries(dailyMap).map(([dateStr, data]) => {
        const dateObj = new Date(dateStr);
        const label = dateObj.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
        return {
          date: dateStr,
          label,
          views: data.views,
          uniques: data.uniques,
        };
      });

      // 4. Breakdown by Device, OS, Referrer, Path using Prisma groupBy
      const [deviceGroup, osGroup, referrerGroup, pathGroup] = await Promise.all([
        (prisma as any).trafficHit.groupBy({
          by: ["device"],
          _count: { id: true },
          where: whereClause,
        }),
        (prisma as any).trafficHit.groupBy({
          by: ["os"],
          _count: { id: true },
          where: whereClause,
        }),
        (prisma as any).trafficHit.groupBy({
          by: ["referrer"],
          _count: { id: true },
          where: whereClause,
        }),
        (prisma as any).trafficHit.groupBy({
          by: ["path"],
          _count: { id: true },
          where: whereClause,
        }),
      ]);

      const deviceBreakdown = (deviceGroup as any[])
        .map((g) => {
          const name = g.device === "mobile" ? "Smartphone" : g.device === "desktop" ? "Komputer / Laptop" : g.device === "tablet" ? "Tablet" : "Lainnya";
          const count = g._count.id;
          return {
            name,
            count,
            percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
          };
        })
        .sort((a, b) => b.count - a.count);

      const osBreakdown = (osGroup as any[])
        .map((g) => ({
          name: g.os || "Lainnya",
          count: g._count.id,
          percentage: totalViews > 0 ? Math.round((g._count.id / totalViews) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const referrerBreakdown = (referrerGroup as any[])
        .map((g) => ({
          name: g.referrer || "Langsung (Direct)",
          count: g._count.id,
          percentage: totalViews > 0 ? Math.round((g._count.id / totalViews) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const pathBreakdown = (pathGroup as any[])
        .map((g) => ({
          path: g.path || "/",
          count: g._count.id,
          percentage: totalViews > 0 ? Math.round((g._count.id / totalViews) * 100) : 0,
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
        recentHits,
      };
    } catch (error) {
      console.error("[TrafficService] getStats error:", error);
      return {
        overview: { todayViews: 0, todayUniques: 0, totalViews: 0, totalUniques: 0, peakHour: "-" },
        hourlyTrend: [],
        dailyTrend: [],
        deviceBreakdown: [],
        osBreakdown: [],
        referrerBreakdown: [],
        pathBreakdown: [],
        recentHits: [],
      };
    }
  }
}
