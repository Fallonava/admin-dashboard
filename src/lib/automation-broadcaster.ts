/**
 * automation-broadcaster.ts
 *
 * In-memory event emitter for real-time updates.
 */

import { EventEmitter } from 'events';

// Simple in-memory broadcaster
class Broadcaster extends EventEmitter {}

export const automationBroadcaster = (global as any).automationBroadcaster || new Broadcaster();

// Ensure it persists globally to bridge Next.js isolated API routes
if (!(global as any).automationBroadcaster) {
  (global as any).automationBroadcaster = automationBroadcaster;
}

// Helper to notify after automation run
export function notifyDoctorUpdates(updates: any) {
  automationBroadcaster.emit('doctors', updates);
}

/**
 * Emit a Socket.IO event to connected clients.
 * Attaches to global.io which is set in server.ts.
 */
export function notifyViaSocket(event: string, data?: any) {
  try {
    const io = (global as any).io;
    if (io) {
      io.emit(event, data ?? null);
    }
  } catch {
    // Graceful no-op
  }
}

/**
 * Specialized sync for Admin Dashboard.
 */
export function syncAdminData(snapshot: any) {
  notifyViaSocket('admin_sync_all', snapshot);
}

/**
 * Trigger dynamic rescheduling. 
 * Since we are in a single-instance environment on Windows, 
 * we just call the trigger directly.
 */
export function triggerSchedulerResync() {
  try {
    if ((global as any).triggerScheduler) {
      (global as any).triggerScheduler().catch(console.error);
    }
  } catch (e) {
    console.error('[broadcaster] Trigger resync error:', e);
  }
}
