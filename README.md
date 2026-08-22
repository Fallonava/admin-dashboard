# 🏥 SIMED — Sistem Informasi Manajemen Medis & TV Display

> **Sistem Informasi Manajemen Jadwal Dokter, Cuti, Monitoring Trafik Publik, dan Integrasi Smart TV Display Rumah Sakit Modern**  
> Dibangun dengan arsitektur **Next.js 16 (App Router & Turbopack)**, **TypeScript**, **Apple iOS 2026 Claymorphism Design System**, **Prisma ORM v7 (PostgreSQL)**, dan **Real-time WebSocket / SSE Sync**.

---

## 📑 Daftar Isi

1. [Fitur Unggulan](#-fitur-unggulan)
2. [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
3. [Panduan Modul & Halaman Aplikasi](#-panduan-modul--halaman-aplikasi)
   - [1. Portal Publik Jadwal Dokter (`/jadwal` / `jadwal.html`)](#1-portal-publik-jadwal-dokter-jadwal--jadwalhtml)
   - [2. Modul Direktori Dokter (`/doctors`)](#2-modul-direktori-dokter-doctors)
   - [3. Modul Jadwal Praktek Dokter (`/schedules`)](#3-modul-jadwal-praktek-dokter-schedules)
   - [4. Modul Jadwal Cuti & Kalender Nasional (`/leaves`)](#4-modul-jadwal-cuti--kalender-nasional-leaves)
   - [5. Modul Automasi Sistem & TV Antrean (`/automation`)](#5-modul-automasi-sistem--tv-antrean-automation)
   - [6. Modul Monitoring Trafik Real-Time (`/traffic`)](#6-modul-monitoring-trafik-real-time-traffic)
   - [7. Layar Smart TV Display Poliklinik (`/display` / `/tv.html`)](#7-layar-smart-tv-display-poliklinik-display--tvhtml)
4. [Design System Apple iOS 2026 Claymorphic](#-design-system-apple-ios-2026-claymorphic)
5. [Anti-Deadlock & High-Performance Architecture](#-anti-deadlock--high-performance-architecture)
6. [Instalasi & Menjalankan Lokal](#-instalasi--menjalankan-lokal)
7. [Deployment & Production Server](#-deployment--production-server)
8. [API Endpoints](#-api-endpoints)
9. [Struktur Folder Codebase](#-struktur-folder-codebase)

---

## 🌟 Fitur Unggulan

- ⚡ **Instant Zero-Lag 120 FPS GPU Rendering**: Drawer menu instan tanpa layout reflow (`0ms CPU stall`), transisi berbasis GPU hardware acceleration (`translateZ(0)`), memoized DOM caching, dan non-blocking rendering.
- 📱 **Apple iOS 2026 Native Claymorphic Feel**: Koin 3D extruded dengan specular light reflections, track rel berbayang ke dalam (*inset sunken wells*), kartu bento kesehatan dengan active corner aura glow, dan respon sentuh berpegas (*iOS spring physics*).
- 📳 **Web Haptic Touch Feedback**: Konfirmasi getar mikro fisik (*light / medium / success*) pada setiap aksi tombol, filter, dan modal pilihan.
- 🏥 **3-in-1 Modal Pendaftaran & Konsultasi**:
  - 🟢 **BPJS Kesehatan**: Integrasi ke aplikasi resmi **Mobile JKN**.
  - 🔵 **Pasien Non-BPJS**: Booking antrean via aplikasi **Nuha**.
  - 💬 **WhatsApp Customer Service**: Direct WhatsApp dengan template pesan kontekstual dokter terpilih otomatis.
- 📅 **1-Tap Google Calendar Sync**: Pasien dapat menyimpan jadwal dokter ke Google Calendar hanya dengan 1 sentuhan.
- 🌓 **Dual Theme Porcelain vs Obsidian**: Mode Terang (*Porcelain Crisp*) dan Mode Gelap (*Obsidian Sapphire Cyber Clay*) dengan kontras tinggi tanpa silau bayangan putih.
- 📊 **Zero-Overhead Real-Time Traffic Analytics**: Monitoring pengunjung publik anonim tanpa database bloat, salted SHA-256 IP hashing (GDPR/HIPAA compliant), deteksi perangkat/OS/browser, dan jam teramai.
- 🤖 **AI WhatsApp Cuti Importer**: Ekstraksi dan input jadwal cuti dokter secara otomatis dari teks pesan WhatsApp menggunakan AI parser.

---

## 🛠️ Arsitektur & Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server & Client Components) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Custom 3D Apple Claymorphism Engine |
| **Realtime Engine** | [Socket.io](https://socket.io/) (Admin Sync) + Server-Sent Events / SSE (`/api/stream/live`) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) + [Prisma ORM v7](https://www.prisma.io/) |
| **Process Manager** | [PM2](https://pm2.keymetrics.io/) (Fork mode singleton di Windows Server) |
| **PWA & Caching** | [Serwist](https://serwist.pages.dev/) Service Worker + Per-Container DOM Memoization |
| **Icons & Typography** | [Material Icons Round](https://fonts.google.com/icons), [Outfit](https://fonts.google.com/specimen/Outfit), [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans), [JetBrains Mono](https://www.jetbrains.com/lp/mono/) |
| **Monitoring & Logs** | [Sentry](https://sentry.io/) + Automated Database Safe-Guard Backups |

---

## 📖 Panduan Modul & Halaman Aplikasi

### 1. Portal Publik Jadwal Dokter (`/jadwal` / `jadwal.html`)
Halaman portal publik utama yang diakses pasien via smartphone atau scan QR code resmi RS di lobi:
* **Brand Header Prestisius**: 3D Logo Coin dengan lapisan pantulan cahaya sudut (*specular glass shine*), badge kota `PBG`, dan live real-time pulsing dot.
* **Bento Health Stats Widgets**:
  - 🟢 **Praktek**: Counter live poli buka dengan lampu pendar emerald.
  - 🟠 **Penuh**: Counter dokter dengan kuota pendaftaran maksimal.
  - 🔴 **Cuti / Izin**: Counter dokter yang sedang berhalangan/izin dinas.
  - *Interaksi*: Sentuhan pada kartu langsung memfilter daftar dokter, dengan pendaran aura aktif halus di pojok kanan bawah (*compact corner aura glow*).
* **Spotlight Search & Live Text Highlighting**:
  - Pencarian nama dokter, poliklinik, dan spesialisasi secara instan dengan penandaan warna kuning terang (*highlight mark*).
  - Empty state dilengkapi tombol cepat 1-tap **"Bersihkan Pencarian"**.
* **Zero-Typing Quick Specialty Chips**:
  - Filter 1-sentuh (✨ Semua Poli, Sp. Anak, Sp. Bedah, Sp. Penyakit Dalam, dll.) di dalam track rel berkapsul *inset sunken well*.
* **Segmented Control Bar**:
  - Pilihan kategori: *Semua Poli*, *🏥 Bedah*, *🩺 Non-Bedah*, dan *ℹ️ Khusus*.
* **Kartu Dokter (Doctor Platter Cards)**:
  - Avatar inisial 3D Clay, nama dokter, spesialisasi, status ketersediaan (*Praktek, Pendaftaran, Cuti, Penuh, Operasi*), dan jam pelayanan.
  - Indikator panah chevron berputar halus `180°` saat kartu disentuh.
  - Drawer menu instan berkecepatan 120 FPS dengan tombol **Tanya / Daftar** dan **Ingatkan (Google Calendar)**.
* **Modal Pendaftaran Next-Gen 3-in-1**:
  - Menampilkan konteks nama dokter, spesialis, dan jam praktek yang dipilih.
  - Jalur BPJS (Mobile JKN), Non-BPJS (Nuha App), dan direct WhatsApp CS.
* **Tab Jadwal Keseluruhan (Master Weekly Shift)**:
  - Matriks jadwal praktek Senin s/d Minggu dengan filter hari dan spesialisasi.
* **Tab Kalender Cuti Dokter**:
  - Kalender interaktif dengan dot penanda cuti, rincian tanggal mulai/selesai, dan pencarian agenda.

---

### 2. Modul Direktori Dokter (`/doctors`)
* **Pencarian Cepat & Filter**: Input pencarian dokter non-blocking (`useDeferredValue`), filter kategori (Bedah / Non-Bedah), dan filter status tayang.
* **Dual View Mode**:
  - *Grid Mode*: Kartu 3D Clay dengan avatar inisial, info kuota antrean, spesialisasi, dan drag-and-drop reordering (`@dnd-kit`).
  - *Table Mode*: Tabel ringkas untuk manajemen data massal dengan `.content-visibility-auto` untuk rendering cepat.
* **Master CRUD**: Tambah/edit data dokter, foto profil, poliklinik, dan kode antrean.

---

### 3. Modul Jadwal Praktek Dokter (`/schedules`)
* **Strip Tanggal 7 Hari Responsif**: Selector tanggal interaktif dengan penanda tanggal merah dan hari Minggu.
* **Tombol "Hari Ini"**: Melompat ke tanggal hari ini dalam 1 klik.
* **Dual View**:
  - *Timeline Harian (24 Jam)*: Baris slot waktu per jam dengan kartu shift 3D dan tombol cepat "+ Tambah Shift" pada jam kosong.
  - *Matriks Mingguan (Senin–Minggu)*: Rekap shift dokter selama 7 hari dalam 1 layar.
* **Dokter Bertugas Hari Ini**: Sidebar aktif menampilkan dokter yang sedang bertugas pada tanggal yang dipilih.

---

### 4. Modul Jadwal Cuti & Kalender Nasional (`/leaves`)
* **3D Clay KPI Statistics**:
  - 🟢 *Cuti Hari Ini*: Live counter dokter yang sedang tidak praktek.
  - 📅 *Total Cuti Bulan Ini*: Rekapitulasi pengajuan cuti bulan berjalan.
  - 🏖️ *Agenda Mendatang*: Agenda cuti dokter ke depan.
* **Integrasi Tanggal Merah Indonesia**:
  - Otomatis menandai tanggal merah dan hari Minggu dengan warna merah cerah berdasarkan SKB 3 Menteri resmi.
  - Banner informasi resmi hari libur nasional muncul otomatis saat tanggal merah diklik.
* **Pilihan Durasi Cepat**: Preset durasi cuti (`Hari Ini (1 Hari)`, `Besok`, `3 Hari`, `1 Minggu`).
* **Input Cerdas (AI dari WA)**: Tempel pesan pengajuan cuti dari grup WhatsApp untuk diproses otomatis.

---

### 5. Modul Automasi Sistem & TV Antrean (`/automation`)
* **Top 4 KPI Cards**:
  - 🟢 *Status TV Sync*: Indikator heartbeat WebSocket live + tombol 1-klik *"Sync Display TV"*.
  - 📢 *Siaran Darurat TV*: Counter siaran popup aktif.
  - 🏝️ *Pesan Bergilir TV*: Counter headline running text TV.
  - ⚡ *Aturan Automasi*: Counter auto-rules aktif.
* **Tab Control Center**:
  - **Tab 1 (📢 Siaran Darurat TV)**: Template cepat (*Gangguan Sistem, Maintenance, Darurat, Custom*), Live TV preview screen, tombol *Stop All*.
  - **Tab 2 (🏝️ Pesan Bergilir TV)**: Kelola berita & pengumuman bergilir pada Dynamic Island TV antrean.
  - **Tab 3 (⚡ Aturan Automasi Pintar)**: Pasang aturan otomatis (*Auto-Hide Dokter Cuti di TV*, *Auto-Selesai Shift*, dll.).
  - **Tab 4 (📜 Log Aktivitas)**: Audit log eksekusi background engine real-time.

---

### 6. Modul Monitoring Trafik Real-Time (`/traffic`)
* **Live Engine Tracking**: Mengukur volume kunjungan publik (`/jadwal` dan `/mobile.html`) secara non-blocking via navigator beacon API.
* **Top 4 KPI Cards (Apple Claymorphism)**:
  - 👁️ *Views Hari Ini*: Total tayangan + counter pengunjung unik harian.
  - 📈 *Total Views (7/30 Hari)*: Total hits kumulatif dan rata-rata hits per hari.
  - 👥 *Pengunjung Unik*: Rasio audiens baru vs returning visitor.
  - ⏰ *Jam Teramai (Peak Hour)*: Jam puncak kunjungan pasien (WIB).
* **Interactive Breakdown & Charts**:
  - *Distribusi Trafik*: Area Chart per jam (mode Hari Ini) dan Bar Chart harian (mode 7/30 Hari).
  - *Donut Perangkat*: Proporsi Smartphone vs Desktop vs Tablet.
  - *Sumber Referrer*: Asal kunjungan (WhatsApp, Instagram, Google, Direct).
  - *Sistem Operasi*: Distribusi Android, iOS, Windows, macOS.

---

### 7. Layar Smart TV Display Poliklinik (`/display` / `/tv.html`)
* Didesain khusus untuk Smart TV display lobi poliklinik (1080p / 4K).
* Menampilkan matriks dokter praktek hari ini, jam layanan, status antrean, dynamic island headline, dan emergency popup overlay.
* Auto-sync seketika via WebSocket tanpa perlu me-refresh browser TV.

---

## 🎨 Design System Apple iOS 2026 Claymorphic

SIMED menerapkan standar desain **Apple iOS 2026 Claymorphism**:

| Token Class | Deskripsi | Efek Fisika |
|---|---|---|
| `.platter` | Kartu dokter utama | Porcelain / obsidian surface dengan bevel border `2px` dan aksen status `::before` |
| `.ios-bento-card` | Kartu statistik bento | Sudut `22px`, 3D coin icon, micro capsule, dan active corner glow aura `::after` |
| `.spec-chip` | Tombol filter poli cepat | Sunken capsule well (`inactive`) ➔ Elevated 3D clay pill (`active`) |
| `.clay-choice-tile` | Pilihan pendaftaran modal | Kartu berbayang 3D dengan haptic `:active` scale `0.95` |
| `.dynamic-island` | Kapsul notifikasi atas | Obsidian island capsule dengan expand spring bounce animation |
| `.clay-empty-coin` | Koin status kosong | Koin melayang 3D dengan gelombang pulse radial berputar halus |

---

## 🛡️ Anti-Deadlock & High-Performance Architecture

Untuk menjamin keandalan `99.99%` pada lingkungan produksi:

1. **🔒 Fetch Mutex Lock (`_isFetching`)**:
   - Mencegah penumpukan request HTTP concurrent di latar belakang saat koneksi internet pasien mengalami latensi tinggi.
2. **🔄 Dynamic Island Queue Safety (`try ... catch ... finally`)**:
   - Seluruh siklus hidup antrean animasi Dynamic Island diproteksi dengan auto-reset timer `500ms` di blok `finally`, mencegah deadlock animasi.
3. **⚡ Instant Drawer Zero-Reflow (120 FPS)**:
   - Menggantikan transisi `max-height` (penyebab layout reflow 60–120x/detik) dengan GPU hardware-composited `opacity` & `transform: translateY` instan.
4. **🪶 Per-Container DOM Memoization (`_lastRenderedHTML`)**:
   - Mencegah penghancuran dan pembuatan ulang elemen DOM pada setiap polling stream, mengeliminasi glitch kedip (*flickering*) pada status kosong 100%.

---

## 🚀 Instalasi & Menjalankan Lokal

### Prasyarat
- Node.js 20+ / 24+
- PostgreSQL 15+ / 16+
- Git

### Langkah Instalasi
```bash
# 1. Clone repository
git clone https://github.com/Fallonava/admin-dashboard.git
cd admin-dashboard

# 2. Install dependensi
npm install

# 3. Konfigurasi file environment
cp .env.example .env
# Edit .env sesuai konfigurasi PostgreSQL lokal Anda

# 4. Generate Prisma Client & Push Database Schema
npx prisma generate
npx prisma db push

# 5. Jalankan development server
npm run dev
```

Aplikasi akan berjalan di:
- **Admin Dashboard**: `http://localhost:3005`
- **Portal Publik Jadwal**: `http://localhost:3005/jadwal`
- **Smart TV Display**: `http://localhost:3005/tv.html`

---

## 🚢 Deployment & Production Server

### Script Deploy Otomatis (Windows Server)
Server produksi menggunakan PowerShell script dengan automated database safe-guard:

```powershell
# Jalankan di PowerShell server Windows:
cd C:\simed-production
powershell -ExecutionPolicy Bypass -File scripts\deploy-production.ps1
```

Tahapan yang dijalankan otomatis (Zero Downtime):
1. 🛡️ **[1/6] Automated Backup**: JSON snapshot 18 tabel ke `backups/` + `pg_dump` SQL backup.
2. 🔄 **[2/6] Clean Git Sync**: `git fetch origin master; git reset --hard origin/master`.
3. 📦 **[3/6] Prisma Sync**: `npx prisma generate` dan `npx prisma db push --skip-generate`.
4. ⚡ **[4/6] Production Compile**: `npm run build` (Next.js 16 + esbuild bundle `server.js`).
5. 🔁 **[5/6] PM2 Clean Restart**: `pm2 restart ecosystem.config.js --update-env`.
6. 💾 **[6/6] Save PM2 State**: `pm2 save`.

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check status server |
| `POST` | `/api/auth/login` | Public | Autentikasi user & generate JWT cookie |
| `POST` | `/api/auth/logout` | Protected | Hapus session auth |
| `GET/POST/PUT/DELETE` | `/api/doctors` | Protected | CRUD data master dokter |
| `GET/POST/PUT/DELETE` | `/api/shifts` | Protected | Manajemen shift jadwal praktek |
| `GET/POST/DELETE` | `/api/leaves` | Protected | Manajemen jadwal cuti dokter |
| `GET/POST` | `/api/automation` | Protected | Konfigurasi rules & siaran TV |
| `GET/POST` | `/api/settings` | Protected | Pengaturan umum & dynamic island TV |
| `POST` | `/api/traffic/track` | Public | Ingest beacon kunjungan publik |
| `GET` | `/api/traffic/stats` | Protected | Agregasi data analitik trafik |
| `GET` | `/api/display` | Public | Data snapshot dokter & shift display publik |
| `GET` | `/api/stream/live` | Public | Server-Sent Events (SSE) stream data real-time |

---

## 📁 Struktur Folder Codebase

```
simed/
├── prisma/
│   └── schema.prisma          # Skema database Prisma (18 model tabel)
├── public/
│   ├── jadwal.html            # Portal mobile publik jadwal dokter (/jadwal)
│   ├── mobile.html            # Synced mirror portal mobile publik
│   ├── tv.html                # Display Smart TV poliklinik (/display)
│   └── sw.js                  # PWA Service Worker caching
├── scripts/
│   ├── deploy-production.ps1  # Script deploy otomatis Windows Server
│   └── backup-db.ts           # Script automated JSON snapshot database
├── src/
│   ├── app/
│   │   ├── api/               # Next.js API route handlers
│   │   ├── automation/        # Modul Automasi Sistem
│   │   ├── doctors/           # Modul Direktori Dokter
│   │   ├── leaves/            # Modul Jadwal Cuti & Kalender Nasional
│   │   ├── schedules/         # Modul Jadwal Praktek Dokter
│   │   ├── traffic/           # Modul Monitoring Trafik Publik
│   │   ├── globals.css        # 3D Claymorphism styling engine
│   │   └── layout.tsx         # Root layout & sidebar navigation
│   ├── components/            # Shared UI components (PageHeader, Dropdown, etc.)
│   ├── features/              # Feature modules (traffic, automation, leaves, doctors)
│   ├── lib/                   # Core utilities, prisma client, env validation, scheduler
│   └── middleware.ts          # Edge authentication & clean URL rewrite engine
├── ecosystem.config.js        # Konfigurasi PM2 Process Manager
├── next.config.ts             # Konfigurasi Next.js 16, Serwist PWA, Sentry, & Rewrites
├── server.ts                  # Custom HTTP & Socket.IO server entrypoint
└── package.json
```

---

© 2026 **SIMED Fallonava**. All Rights Reserved.
