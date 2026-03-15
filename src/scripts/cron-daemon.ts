import { runAutomation } from '../lib/automation';
import connectToDatabase from '../lib/mongodb';

const INTERVAL_MS = 60 * 1000; // 1 menit

console.log(`[${new Date().toISOString()}] Next-Gen Cron Daemon started.`);
console.log(`[${new Date().toISOString()}] Target: Direct DB Execution (Zero HTTP Overhead)`);

async function triggerAutomation() {
  try {
    // Pastikan koneksi Mongoose terbentuk jika sewaktu-waktu dibutuhkan
    // Walaupun automation utama pakai Prisma, kadang-kadang butuh MongoDB
    await connectToDatabase();
    
    // Eksekusi core logic automation tanpa melalui Fetch URL
    const { applied, failed } = await runAutomation();
    console.log(`[${new Date().toISOString()}] SUCCESS. Applied: ${applied}, Failed: ${failed}`);
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] CRASH/ERROR:`, error.message);
  }
}

// Jalankan segera saat startup
triggerAutomation();

// Set interval untuk eksekusi rutin
setInterval(triggerAutomation, INTERVAL_MS);
