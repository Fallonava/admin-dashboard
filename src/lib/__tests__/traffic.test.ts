// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    trafficHit: {
      create: jest.fn().mockResolvedValue({ id: 'hit-1' }),
      count: jest.fn().mockResolvedValue(100),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'hit-1',
          path: '/jadwal',
          device: 'mobile',
          os: 'Android',
          browser: 'Chrome',
          referrer: 'WhatsApp',
          createdAt: new Date(),
        }
      ]),
      groupBy: jest.fn().mockResolvedValue([
        { device: 'mobile', _count: { id: 80 } },
        { device: 'desktop', _count: { id: 20 } }
      ]),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ count: 42 }]),
  },
}));

import { TrafficService } from '@/features/traffic/services/TrafficService';

describe('TrafficService', () => {
  it('should record hit with anonymized IP and parsed user agent', async () => {
    const res = await TrafficService.recordHit({
      path: '/jadwal?ref=test',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      referrer: 'https://wa.me/628123456789',
    });

    expect(res.success).toBe(true);
  });

  it('should get aggregated stats without throwing', async () => {
    const stats = await TrafficService.getStats(7);

    expect(stats).toBeDefined();
    expect(stats.overview).toBeDefined();
    expect(stats.overview.totalViews).toBe(100);
    expect(stats.hourlyTrend).toHaveLength(24);
    expect(stats.dailyTrend).toHaveLength(8);
  });
});
