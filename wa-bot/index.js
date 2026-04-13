require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ==========================================
console.log("Menyalakan mesin Chromium untuk WhatsApp (Mungkin memakan waktu)...");
const waClient = new Client({
  authStrategy: new LocalAuth({ dataPath: "./sessions" }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--js-flags="--max-old-space-size=512"' // Limit internal browser RAM
    ],
  }
});

// ==========================================
// 3. POLLING & PROCESSING LOGIC (REPLACED REDIS PUB/SUB)
// ==========================================
const fs = require('fs');
const path = require('path');

const stateFile = path.join(process.cwd(), '.wa-status.json');
const commandFile = path.join(process.cwd(), '.wa-command');

async function setBotState(state, data = null) {
    try {
        const payload = JSON.stringify({ state, qr: data, timestamp: Date.now() });
        fs.writeFileSync(stateFile, payload, 'utf8');
    } catch(e) { console.error("Gagal save state ke file:", e) }
}

let isWaReady = false;
let isProcessingQueue = false;

waClient.on("qr", (qr) => {
  console.log("SCAN QR CODE INI BILA BELUM TERHUBUNG:");
  qrcode.generate(qr, { small: true });
  setBotState("QR_READY", qr);
});

waClient.on("ready", () => {
  console.log("✅ Whatsapp Bot Berhasil Terhubung!");
  isWaReady = true;
  setBotState("CONNECTED");
  processQueue(); 
});

waClient.on("auth_failure", msg => {
  console.error("❌ Autentikasi Gagal:", msg);
  setBotState("DISCONNECTED");
});

waClient.on("disconnected", (reason) => {
  console.error("❌ Whatsapp Disconnected:", reason);
  isWaReady = false;
  setBotState("DISCONNECTED");
});

waClient.initialize();

async function initDB() {
    try {
        await prisma.$connect();
        console.log("✅ PostgreSQL/Prisma Terhubung");

        setBotState("STARTING"); // Initial state

        // Polling loop to replace wa:trigger_queue pub/sub
        setInterval(() => {
            if (isWaReady && !isProcessingQueue) {
                processQueue();
            }
        }, 10000);

        // Polling loop to replace wa:command pub/sub
        setInterval(async () => {
            if (fs.existsSync(commandFile)) {
                const cmd = fs.readFileSync(commandFile, 'utf8').trim();
                if (cmd === "LOGOUT") {
                    console.log("Loging out client...");
                    setBotState("DISCONNECTED");
                    try { await waClient.logout(); } catch(e){}
                    try { fs.unlinkSync(commandFile); } catch(e) {}
                    setTimeout(() => { process.exit(0); }, 1000); // Biarkan PM2 merestart bot secara bersih
                }
            }
        }, 2000);
        
        // --- 6-Hour Self-Heal Restart ---
        // Browser sessions can leak over time. Auto-restart daily or every 6h cleans memory.
        const SIX_HOURS = 6 * 60 * 60 * 1000;
        setTimeout(() => {
            console.log("🕒 [Self-Heal] Scheduled restart to clear browser memory leaks...");
            process.exit(0); // Let PM2 restart the fork cleanly
        }, SIX_HOURS);

    } catch (err) {
        console.error("Gagal inisialisasi infra:", err);
    }
}

// Utility: Sleep / Random Delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    let pendingCount = await prisma.broadcastQueue.count({ where: { status: "PENDING" } });
    if (pendingCount === 0) {
        isProcessingQueue = false;
        return;
    }
    
    console.log(`Menemukan ${pendingCount} antrean. Memulai proses broadcast...`);

    let sentInBatch = 0;

    while (true) {
      // Cari data terlama dengan transaksi update jika ada
      const topPending = await prisma.broadcastQueue.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
      });

      if (!topPending) break; // Tidak ada lagi yang PENDING

      const queue = await prisma.broadcastQueue.update({
        where: { id: topPending.id },
        data: { status: "PROCESSING" }
      });

      try {
         // Format nomor jadi jid
         const numberId = `${queue.whatsappNumber}@c.us`; 

         // Check isRegisteredUser (hanya kalau ragu, untuk meminimalisir banned, ditiadakan gapapa tapi bagus)
         console.log(`[SIMULASI] Mengetik ke ${queue.whatsappNumber}...`);
         
         const chat = await waClient.getChatById(numberId).catch(() => null);
         if(chat) {
             await chat.sendStateTyping();
         }
         
         // Random delay simulasi orang ngetik (realistis 3 - 6 detik)
         await sleep(randomDelay(3000, 6000));
         
         // Inject zero-width space acak di akhir pesan (Anti-hash Meta filter)
         const zeroWidthChars = ['\u200B', '\u200C', '\u200D', '\uFEFF'];
         const randomHash = zeroWidthChars[Math.floor(Math.random() * zeroWidthChars.length)].repeat(Math.floor(Math.random() * 3));
         
         await waClient.sendMessage(numberId, queue.messageText + randomHash);

         await prisma.broadcastQueue.update({
             where: { id: queue.id },
             data: { status: "SENT" }
         });
         console.log(`✅ Sukses mengirim ke ${queue.whatsappNumber}`);

         sentInBatch++;
         
         // Batch Pause: Tiap 40 pesan, istirahat 5 menit 
         if (sentInBatch >= 40) {
             console.log("⚠️ Istirahat Batch (Anti-Ban)... Menunggu 5 menit.");
             await sleep(5 * 60 * 1000); // 5 menit
             sentInBatch = 0;
         } else {
             // Jeda antar pesan biasa: 10 ~ 20 detik
             const delayTime = randomDelay(10000, 20000);
             console.log(`Menunggu ${delayTime/1000} detik untuk pesan berikutnya...`);
             await sleep(delayTime);
         }

      } catch (err) {
         console.error(`❌ Gagal mengirim ke ${queue.whatsappNumber}:`, err.message);
         await prisma.broadcastQueue.update({
             where: { id: queue.id },
             data: { status: "FAILED", log: err.message }
         });
      }
    }

    console.log("✅ Seluruh antrean batch selesai.");

  } catch (error) {
    console.error("Fatal error saat processQueue:", error);
  } finally {
    isProcessingQueue = false;
    // Check lagikali aja ada yang masuk pas lagi ngerjain
    const remaining = await prisma.broadcastQueue.count({ where: { status: "PENDING" } });
    if (remaining > 0 && isWaReady) {
        processQueue();
    }
  }
}

initDB();

// --- Graceful Shutdown ---
// Memastikan Chromium tertutup bersih saat PM2 mematikan proses ini
const handleLogout = async () => {
    console.log("🛑 Menutup Bot WhatsApp secara bersih...");
    isWaReady = false;
    try {
        await waClient.destroy();
        console.log("✅ Browser Chromium berhasil ditutup.");
    } catch (e) {
        console.error("Gagal menutup browser:", e.message);
    }
    process.exit(0);
};

process.on("SIGINT", handleLogout);
process.on("SIGTERM", handleLogout);


