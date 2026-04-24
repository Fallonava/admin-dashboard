import { prisma } from '@/lib/prisma';
import { getAutomationQueue } from '@/lib/automation-queue';

export class QueueService {
  static async resetDoctorQueue() {
    await prisma.doctor.updateMany({
      data: { lastCall: null }
    });
    return { success: true, message: "Queue reset." };
  }

  static async getQueueMetrics() {
    try {
      const queue = getAutomationQueue();
      const metrics = await queue.getMetrics();
      const cbMetrics = queue.getCircuitBreakerState();
      const failedJobs = await queue.getFailedJobs(5);

      return {
        success: true,
        queue: metrics,
        circuitBreaker: cbMetrics,
        failedJobs: failedJobs,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[queue metrics] error:', error);
      return {
        success: false,
        error: error?.message,
        queue: { active: 0, delayed: 0, failed: 0, completed: 0, waiting: 0 }
      };
    }
  }
}
