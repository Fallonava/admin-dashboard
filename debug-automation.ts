import { runAutomation } from './src/lib/automation';

export default async function req() {
    console.log("Starting automation debug run...");
    const res = await runAutomation();
    console.log("Result:", res);
}
req().catch(console.error);
