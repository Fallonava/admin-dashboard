// Native env loading is handled by esbuild --banner:js in package.json
import { runAutomation } from '../lib/automation';
import connectToDatabase from '../lib/mongodb';
import cron from 'node-cron';

console.log(`[${new Date().toISOString()}] Next-Gen Cron Daemon started (node-cron).`);
console.log(`[${new Date().toISOString()}] Target: Direct DB Execution (Zero HTTP Overhead)`);

// Status flag untuk mencegah eksekusi ganda jika runAutomation berjalan lama
let isRunning = false;

async function triggerAutomation() {
  if (isRunning) {
    console.log(`[${new Date().toISOString()}] Skipping run: previous execution is still running`);
    return;
  }
  
  isRunning = true;
  try {
    // Pastikan koneksi Mongoose terbentuk jika sewaktu-waktu dibutuhkan
    // Walaupun automation utama pakai Prisma, kadang-kadang butuh MongoDB
    await connectToDatabase();
    
    // Eksekusi core logic automation tanpa melalui Fetch URL
    const { applied, failed } = await runAutomation();
    console.log(`[${new Date().toISOString()}] SUCCESS. Applied: ${applied}, Failed: ${failed}`);
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] CRASH/ERROR:`, error.message);
  } finally {
    isRunning = false;
  }
}

// Jalankan segera saat startup (opsional, tapi bagus untuk memastikan jalan langsung)
triggerAutomation();

// Berjalan setiap menit tepat di detik ke-0 (00, 01, 02...)
cron.schedule('* * * * *', () => {
  triggerAutomation();
});
