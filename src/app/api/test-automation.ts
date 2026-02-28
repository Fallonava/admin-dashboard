import { runAutomation } from '../../lib/automation';

async function test() {
    console.log("Starting automation test...");
    try {
        const { applied, failed } = await runAutomation();
        console.log(`Test complete. Applied: ${applied}, Failed: ${failed}`);
    } catch (e) {
        console.error("Test error:", e);
    }
}

test();
