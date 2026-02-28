import cron from 'node-cron';
import { runAutomation } from './automation';
import { initializeAutomationQueue } from './automation-queue';

let initialized = false;

export async function initAutomationScheduler() {
    if (initialized) return;
    initialized = true;

    try {
        // Initialize queue system (with Redis)
        await initializeAutomationQueue();
    } catch (err) {
        console.warn('[automation scheduler] queue init failed, will use direct updates:', err);
        // Continue without queue - fallback to direct Prisma updates
    }

    // run every 30 seconds (or adjust as needed)
    cron.schedule('*/30 * * * * *', async () => {
        try {
            const { applied, failed } = await runAutomation();
            if (applied || failed) {
                console.log(`[automation scheduler] applied=${applied} failed=${failed}`);
            }
        } catch (err) {
            console.error('[automation scheduler] error', err);
        }
    });
    console.log('[automation scheduler] initialized');
}
