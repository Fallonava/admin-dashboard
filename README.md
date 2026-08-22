# 🏥 SIMED — Sistem Informasi Manajemen Medis & TV Display

> **Sistem Informasi Manajemen Jadwal Dokter, Cuti, Monitoring Trafik Publik, dan Integrasi Smart TV Display Rumah Sakit Modern**  
> Dibangun dengan arsitektur **Next.js 16 (App Router & Turbopack)**, **TypeScript**, **3D Claymorphism Design System**, **Prisma ORM v7 (PostgreSQL)**, dan **Real-time WebSocket Sync**.

---

## 📑 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
3. [Panduan Modul Aplikasi](#-panduan-modul-aplikasi)
   - [1. Modul Dokter (`/doctors`)](#1-modul-dokter-doctors)
   - [2. Modul Jadwal Dokter (`/schedules`)](#2-modul-jadwal-dokter-schedules)
   - [3. Modul Jadwal Cuti & Kalender Nasional (`/leaves`)](#3-modul-jadwal-cuti--kalender-nasional-leaves)
   - [4. Modul Automasi Sistem & TV (`/automation`)](#4-modul-automasi-sistem--tv-automation)
   - [5. Modul Monitoring Trafik Real-time (`/traffic`)](#5-modul-monitoring-trafik-real-time-traffic)
   - [6. Layar TV Display Antrean (`/display` / `/tv.html`)](#6-layar-tv-display-antrean-display--tvhtml)
   - [7. Portal Publik Jadwal Dokter (`/jadwal` / `/mobile.html`)](#7-portal-publik-jadwal-dokter-jadwal--mobilehtml)
4. [Design System 3D Claymorphism](#-design-system-3d-claymorphism)
5. [Instalasi & Menjalankan Lokal](#-instalasi--menjalankan-lokal)
6. [Deployment & Production Server](#-deployment--production-server)
7. [API Endpoints](#-api-endpoints)
8. [Struktur Folder Codebase](#-struktur-folder-codebase)

---

## 🌟 Fitur Utama

- ⚡ **Ultra-Smooth 120 FPS Rendering**: GPU hardware acceleration (`translateZ(0)`), SWR *stale-while-revalidate* caching, font preloading, dan non-blocking rendering dengan `useDeferredValue`.
- 📅 **Kalender Nasional Indonesia Terintegrasi**: Built-in SKB 3 Menteri (2025–2027), otomatis menandai **Tanggal Merah** dan Hari Minggu lengkap dengan nama hari libur nasional resmi.
- 📺 **Real-Time Smart TV Display Sync**: Sinkronisasi jadwal, running text, dan siaran darurat ke TV antrean rumah sakit via WebSocket secara instan.
- 📊 **Zero-Overhead Traffic Analytics**: Monitoring pengunjung publik real-time tanpa database bloat, salted SHA-256 IP hashing (GDPR/HIPAA compliant), deteksi perangkat/OS/browser, dan jam teramai.
- 🎨 **3D Tactile Claymorphism UI**: Antarmuka visual 3D modern dengan kedalaman bayangan multi-layer, konsisten di seluruh desktop, tablet, dan mobile.
- 🤖 **AI WhatsApp Cuti Importer**: Ekstraksi dan input jadwal cuti dokter secara otomatis dari teks pesan WhatsApp menggunakan AI.
- 📱 **Progressive Web App (PWA)**: Offline caching dengan Serwist Service Worker, siap di-install di perangkat mobile petugas.

---

## 🛠️ Arsitektur & Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server & Client Components) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Custom 3D Claymorphism Engine |
| **Data Fetching & Cache** | [SWR](https://swr.vercel.app/) (`stale-while-revalidate`, `keepPreviousData: true`) |
| **Realtime Engine** | [Socket.io](https://socket.io/) (Singleton WebSocket client & server) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) + [Prisma ORM v7](https://www.prisma.io/) |
| **Process Manager** | [PM2](https://pm2.keymetrics.io/) (Fork mode singleton on Windows Server) |
| **PWA & Offline** | [Serwist](https://serwist.pages.dev/) Service Worker |
| **Icons & Animation** | [Lucide React](https://lucide.dev/), Apple iOS Spring Transitions |
| **Monitoring & Logs** | [Sentry](https://sentry.io/) + Custom Automation Audit Logs |

---

## 📖 Panduan Modul Aplikasi

### 1. Modul Dokter (`/doctors`)
* **Pencarian Cepat & Filter**: Input pencarian dokter non-blocking (`useDeferredValue`), filter kategori (Bedah / Non-Bedah), dan filter status tayang.
* **Dual View Mode**:
  - *Grid Mode*: Kartu 3D Clay dengan avatar inisial, info kuota antrean, spesialisasi, dan drag-and-drop reordering (`@dnd-kit`).
  - *Table Mode*: Tabel ringkas untuk manajemen data massal dengan `.content-visibility-auto` untuk rendering cepat.
* **Master CRUD**: Tambah/edit data dokter, foto profil, poliklinik, dan kode antrean.

### 2. Modul Jadwal Dokter (`/schedules`)
* **Strip Tanggal 7 Hari Responsif**: Selector tanggal interaktif dengan penanda tanggal merah dan hari Minggu.
* **Tombol "Hari Ini"**: Melompat ke tanggal hari ini dalam 1 klik.
* **Dual View**:
  - *Timeline Harian (24 Jam)*: Baris slot waktu per jam dengan kartu shift 3D dan tombol cepat "+ Tambah Shift" pada jam kosong.
  - *Matriks Mingguan (Senin–Minggu)*: Rekap shift dokter selama 7 hari dalam 1 layar.
* **Dokter Bertugas Hari Ini**: Sidebar aktif menampilkan dokter yang sedang bertugas pada tanggal yang dipilih.

### 3. Modul Jadwal Cuti & Kalender Nasional (`/leaves`)
* **3D Clay KPI Statistics**:
  - 🟢 *Cuti Hari Ini*: Live counter dokter yang sedang tidak praktek.
  - 📅 *Total Cuti Bulan Ini*: Rekapitulasi pengajuan cuti bulan berjalan.
  - 🏖️ *Agenda Mendatang*: Agenda cuti dokter ke depan.
* **Integrasi Tanggal Merah Indonesia**:
  - Otomatis menandai tanggal merah dan hari Minggu dengan warna merah cerah.
  - Banner informasi resmi hari libur nasional muncul otomatis saat tanggal merah diklik.
* **Pilihan Durasi Cepat**: Preset durasi cuti (`Hari Ini (1 Hari)`, `Besok`, `3 Hari`, `1 Minggu`).
* **Input Cerdas (AI dari WA)**: Tempel pesan pengajuan cuti dari grup WhatsApp untuk diproses otomatis.

### 4. Modul Automasi Sistem & TV (`/automation`)
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

### 5. Modul Monitoring Trafik Real-time (`/traffic`)
* **Live Engine Tracking**: Mengukur volume kunjungan publik (`/jadwal` dan `/mobile.html`) secara non-blocking.
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
  - *Halaman Terpopuler*: Rute yang paling sering diakses.
* **Live Activity Feed**: Stream 15 hit pengunjung teranyar dengan auto-refresh setiap 8 detik.

### 6. Layar TV Display Antrean (`/display` / `/tv.html`)
* Didesain khusus untuk Smart TV display lobi poliklinik (1080p / 4K).
* Menampilkan matriks dokter praktek hari ini, jam layanan, status antrean, dynamic island headline, dan emergency popup overlay.
* Auto-sync seketika via WebSocket tanpa perlu me-refresh browser TV.

### 7. Portal Publik Jadwal Dokter (`/jadwal` / `/mobile.html`)
* Halaman jadwal dokter publik yang diakses pasien via smartphone atau scan QR code di rumah sakit.
* Dilengkapi beacon tracking script otomatis ke `/api/traffic/track`.

---

## 🎨 Design System 3D Claymorphism

SIMED menggunakan custom 3D Claymorphism tokens:

| Token Class | Kegunaan | Visual Effect |
|---|---|---|
| `clay-surface` | Container utama, Card KPI, Panel | Depth porcelain / obsidian matte dengan bayangan 3D |
| `clay-inset` | Search bar, Input field, Segmented control | Sunken / recessed tactile cavity |
| `clay-button` | Tombol interaktif | 3D extruded dengan efek press membal (`:active`) |
| `clay-pill-blue` | Tab aktif, Primary badge | Blue vibrant 3D pill |
| `clay-pill-emerald` | Status Online, Success badge | Emerald vibrant 3D pill |
| `clay-pill-amber` | Peringatan, Jam puncak, Warning | Amber vibrant 3D pill |
| `clay-pill-violet` | Dynamic Island, Secondary badge | Violet vibrant 3D pill |
| `clay-pill-rose` | Status Bahaya, Siaran darurat | Rose red vibrant 3D pill |
| `clay-icon-*` | Avatar inisial, Ikon header | 3D extruded icon box dengan specular top highlight |

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
# Edit .env sesuai konfigurasi database lokal Anda

# 4. Generate Prisma Client & Migrate
npx prisma generate
npx prisma db push

# 5. Jalankan development server
npm run dev
```

Aplikasi akan berjalan di:
- **Admin Dashboard**: `http://localhost:3005`
- **TV Display**: `http://localhost:3005/tv.html`
- **Portal Mobile**: `http://localhost:3005/mobile.html`

---

## 🚢 Deployment & Production Server

### Script Deploy Otomatis (Windows Server)
Server produksi menggunakan PowerShell script dengan automated database safe-guard:

```powershell
# Jalankan di PowerShell server:
cd C:\simed-production
powershell -ExecutionPolicy Bypass -File scripts\deploy-production.ps1
```

Tahapan yang dijalankan otomatis:
1. 🛡️ **Automated Backup**: JSON snapshot 18 tabel + PostgreSQL `.sql` dump ke `C:\backups\`.
2. 🔄 **Git Sync Paksa**: `git fetch origin master; git reset --hard origin/master`.
3. 📦 **Prisma Sync**: `npx prisma generate` dan `npx prisma db push --skip-generate`.
4. ⚡ **Production Compile**: `npm run build` (Next.js + esbuild `server.js`).
5. 🔁 **PM2 Clean Restart**: `pm2 restart ecosystem.config.js --update-env`.

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

---

## 📁 Struktur Folder Codebase

```
simed/
├── prisma/
│   └── schema.prisma          # Skema database Prisma (18 model tabel)
├── public/
│   ├── mobile.html            # Portal mobile publik jadwal dokter (/jadwal)
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
│   │   ├── leaves/            # Modul Jadwal Cuti
│   │   ├── schedules/         # Modul Jadwal Praktek Dokter
│   │   ├── traffic/           # Modul Monitoring Trafik Publik
│   │   ├── globals.css        # 3D Claymorphism styling engine
│   │   └── layout.tsx         # Root layout & sidebar navigation
│   ├── components/            # Shared UI components (PageHeader, Dropdown, etc.)
│   ├── features/              # Feature modules (traffic, automation, leaves, doctors)
│   └── lib/                   # Core utilities, prisma client, env validation, scheduler
├── ecosystem.config.js        # Konfigurasi PM2 Process Manager
├── server.ts                  # Custom HTTP & Socket.IO server entrypoint
└── package.json
```

---

© 2026 **SIMED Fallonava**. All Rights Reserved.
