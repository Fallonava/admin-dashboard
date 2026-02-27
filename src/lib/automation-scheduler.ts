import cron from 'node-cron';
import { runAutomation } from './automation';

let initialized = false;

export function initAutomationScheduler() {
    if (initialized) return;
    initialized = true;

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
