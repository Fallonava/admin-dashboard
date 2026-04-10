# Perencanaan Sistem Notifikasi WhatsApp Otomatis (SIMRS) - Enterprise Architecture

## 1. Arsitektur Sistem & Tech Stack
Sistem ini menggunakan arsitektur **Microservices** yang decouple (terpisah) dari Next.js utama untuk menjaga stabilitas memori. Karena bot WhatsApp (`whatsapp-web.js`) menjalankan *headless browser* (Chromium), bot WA **wajib berjalan sebaga *Singleton Process* (1 instance)**, berbeda dengan Next.js kita yang berjalan di PM2 *Cluster Mode*.

* **GUI & Manajemen Data:** Next.js (Main App), Tailwind, shadcn/ui.
* **Database (Queue):** PostgreSQL dengan Prisma ORM (Tabel `BroadcastQueue`).
* **Message Broker & Trigger:** Redis Pub/Sub (Mencegah konflik *polling*).
* **WhatsApp Microservice:** Node.js murni (*Standalone Worker*) + `whatsapp-web.js`.
* **State Sync (Real-time):** Bot menembak Redis Pub/Sub -> Next.js meneruskan UI via Socket.io yang sudah ada, **tanpa perlu membuat server WebSocket baru**.

---

## 2. Tahapan Pengembangan (Phases)

### Fase 1: Persiapan Database (Prisma PostgreSQL)
Membangun wadah persisten untuk antrean. Ini memastikan jika bot mati, pesan tidak akan pernah hilang (*Fault Tolerant*).

* [ ] Buat model `BroadcastQueue` di Prisma:
    * `id` (String UUID)
    * `patientName`, `whatsappNumber`, `doctorName`, `clinicName` (String)
    * `status` (Enum: `PENDING`, `PROCESSING`, `SENT`, `FAILED`)
    * `messageText` (String/Text)
    * `log` (String - alasan gagal/keterangan)
    * `sendAt` (DateTime - untuk penjadwalan)
    * `createdAt`, `updatedAt`
* [ ] Jalankan `npx prisma db push`.

### Fase 2: Service Worker WA Bot (Standalone Node.js)
Aplikasi terpisah yang didedikasikan sepenuhnya untuk mengawal mesin Chromium WA.

* [ ] Inisialisasi project terpisah (misal folder `./wa-bot`).
* [ ] **Konfigurasi Spesifik:** Setup `whatsapp-web.js` dengan `LocalAuth` (Autentikasi sesi persisten). Generate QR Code di terminal (*atau kirim via Webbook untuk UI*).
* [ ] **Komunikasi Intelegensi (Tanpa Express):** 
    * Bot **tidak perlu** menggunakan Express.js. 
    * Bot langsung terkoneksi ke **PostgreSQL (Prisma)** dan **Redis**.
    * Bot mendengarkan event Redis: `redis.subscribe('wa:trigger_queue')`.
* [ ] **Logika Anti-Banned (Human Emulation):**
    * *Dynamic Delay*: Jeda acak antar pesan (12 hingga 30 detik).
    * *Cool-down Period*: Istirahat 5 menit setiap pengiriman sukses 50 pesan berturut-turut.
    * *Typing Simulator*: Mengirim event *typing* 3-5 detik sebelum teks dikirim.
    * Pembersihan spasi dan injeksi karakter unik transparan *random* (zero-width characters) agar *hash* teks tiap pesan tidak identik 100% di mata bot filter Meta.

### Fase 3: UI/UX Master Control di Next.js
Halaman operasional (*Dashboard*) yang digunakan staf RS untuk memasok data.

* [ ] **Upload & Parser:** *Drag-and-Drop* via `react-dropzone`. Parsing Excel klien menggunakan library `xlsx`.
* [ ] **Data Sanitization:** Fungsi pembersih nomor HP (Ubah awalan `0` / `+62` menjadi format universal `628xxx` wajib tanpa spasi).
* [ ] **Dynamic Templating (Live Preview):**
    * Sistem templating variabel `{{Nama Pasien}}`, `{{Poli}}`.
    * View UI yang menampilkan desain *chat bubble* WA untuk *preview*.
* [ ] **Pengiriman Data:** *Submit* list pesan ke database Prisma, lalu Next.js menembakkan *signal* Redis `wa:trigger_queue` untuk membangunkan Bot WA.

### Fase 4: Integrasi Real-Time UI (Socket.io)
Menggunakan ekosistem Socket.io yang **sudah berjalan** di proyek Next.js. 

* [ ] Saat Bot selesai memproses 1 antrean:
    1. Bot update status `SENT` ke PostgreSQL.
    2. Bot `redis.publish('medcore:socket_broadcast', { event: 'wa_status', data: ... })`
* [ ] Next.js Server (`server.js`) menerima Redis pub/sub dan memancarkannya (`io.emit('wa_status')`) ke *browser* Admin.
* [ ] Progress bar di halaman Admin bergerak terisi tanpa perlu *refresh* halaman.

### Fase 5: Deployment & PM2 Orchestration
* [ ] Gabungkan konfigurasi bot ke dalam `ecosystem.config.js`:
    ```javascript
    {
      name: 'wa-worker',
      script: './wa-bot/index.js',
      instances: 1, // WAJIB 1 (Singleton)
      exec_mode: 'fork', // Bukan cluster
      max_memory_restart: '1G'
    }
    ```
* [ ] **Keamanan:** Pasang peringatan via Telegram/Dashboard jika proses WA *disconnected* dari server Meta (WhatsApp Web ditutup paksa via HP).

---

## 3. Protokol Keamanan Ekstra (SOP Rumah Sakit)
1. **Nomor Dedicated:** Gunakan nomor "Customer Service" resmi yang Profil Google Maps & Jam Bukanya sudah diverifikasi Meta (Sangat mengurangi resiko blokir).
2. **Opt-Out (Penolakan):** Selalu berikan kaki (*footer*) di akhir pesan: *"Ketik STOP untuk berhenti menerima notifikasi otomatis"*. Jika pasien membalas STOP, masukkan nomornya ke tabel `Blacklist` Prisma.
3. **Limitasi Warm-Up:** Minggu ke-1 maksimal 50 pesan/hari. Minggu ke-2 bertahap rilis hingga maksimal aman (200-500 pesan/hari).