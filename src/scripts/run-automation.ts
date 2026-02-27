#!/usr/bin/env ts-node

import { runAutomation } from '@/lib/automation';

(async () => {
    try {
        const { applied, failed } = await runAutomation();
        console.log(`automation complete: applied=${applied} failed=${failed}`);
        process.exit(0);
    } catch (err) {
        console.error('automation worker error', err);
        process.exit(1);
    }
})();
