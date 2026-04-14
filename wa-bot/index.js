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

  // ─── [1] CEK JAM OPERASI (Anti-Ban: tidak mengirim tengah malam) ───────────
  const now = new Date();
  // Konversi ke WIB (UTC+7)
  const wibHour = (now.getUTCHours() + 7) % 24;
  if (wibHour < 7 || wibHour >= 20) {
    console.log(`[FAKT-Bot] Di luar jam operasi (${wibHour}:xx WIB). Bot tidak akan mengirim. Menunggu...`);
    return;
  }

  isProcessingQueue = true;

  try {
    let pendingCount = await prisma.broadcastQueue.count({ where: { status: "PENDING" } });
    if (pendingCount === 0) {
        isProcessingQueue = false;
        return;
    }
    
    console.log(`[FAKT-Bot] Menemukan ${pendingCount} antrean. Jam operasi aktif. Memulai broadcast...`);

    let sentInBatch = 0;

    while (true) {
      const topPending = await prisma.broadcastQueue.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
      });

      if (!topPending) break;

      const queue = await prisma.broadcastQueue.update({
        where: { id: topPending.id },
        data: { status: "PROCESSING" }
      });

      try {
         const numberId = `${queue.whatsappNumber}@c.us`;

         // ─── [2] VALIDASI NOMOR WA AKTIF (Anti-Ban: tidak kirim ke nomor invalid) ─
         console.log(`[FAKT-Bot] Memvalidasi nomor ${queue.whatsappNumber}...`);
         const isRegistered = await waClient.isRegisteredUser(numberId).catch(() => false);
         if (!isRegistered) {
           console.warn(`[FAKT-Bot] ⚠️ Nomor ${queue.whatsappNumber} BUKAN pengguna WhatsApp aktif. Dilewati.`);
           await prisma.broadcastQueue.update({
               where: { id: queue.id },
               data: { status: "FAILED", log: "Nomor tidak terdaftar di WhatsApp." }
           });
           // Jeda singkat setelah skip agar tidak terlihat bot
           await sleep(randomDelay(2000, 4000));
           continue;
         }

         // Simulasi mengetik (humanisasi)
         const chat = await waClient.getChatById(numberId).catch(() => null);
         if (chat) await chat.sendStateTyping();
         
         // Jeda simulasi manusia mengetik
         await sleep(randomDelay(4000, 8000));
         
         // Inject zero-width space untuk variasi hash konten (Anti-filter Meta)
         const zeroWidthChars = ['\u200B', '\u200C', '\u200D', '\uFEFF'];
         const randomHash = zeroWidthChars[Math.floor(Math.random() * zeroWidthChars.length)].repeat(Math.floor(Math.random() * 3) + 1);
         
         await waClient.sendMessage(numberId, queue.messageText + randomHash);

         await prisma.broadcastQueue.update({
             where: { id: queue.id },
             data: { status: "SENT" }
         });
         console.log(`✅ [FAKT-Bot] Pesan terkirim ke ${queue.whatsappNumber}`);

         sentInBatch++;
         
         // ─── [3] THROTTLING CERDAS (Batas 30/batch, istirahat 8 menit) ──────────
         if (sentInBatch >= 30) {
             console.log("⚠️ [FAKT-Bot] Batas batch tercapai (30 pesan). Istirahat 8 menit (Anti-Ban)...");
             await sleep(8 * 60 * 1000); // 8 menit
             sentInBatch = 0;

             // Periksa jam operasi lagi setelah istirahat
             const nowCheck = new Date();
             const wibHourCheck = (nowCheck.getUTCHours() + 7) % 24;
             if (wibHourCheck < 7 || wibHourCheck >= 20) {
               console.log("[FAKT-Bot] Jam operasi habis saat istirahat. Menghentikan batch.");
               break;
             }
         } else {
             // Jeda antar pesan: 12–25 detik (lebih acak dari sebelumnya)
             const delayTime = randomDelay(12000, 25000);
             console.log(`[FAKT-Bot] Jeda ${(delayTime/1000).toFixed(1)} detik sebelum pesan berikutnya...`);
             await sleep(delayTime);
         }

      } catch (err) {
         console.error(`❌ [FAKT-Bot] Gagal mengirim ke ${queue.whatsappNumber}:`, err.message);
         await prisma.broadcastQueue.update({
             where: { id: queue.id },
             data: { status: "FAILED", log: err.message }
         });
      }
    }

    console.log("[FAKT-Bot] ✅ Seluruh batch selesai diproses.");

  } catch (error) {
    console.error("[FAKT-Bot] Fatal error processQueue:", error);
  } finally {
    isProcessingQueue = false;
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


