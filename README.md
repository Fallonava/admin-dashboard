# 🏥 SIMED — Sistem Informasi Manajemen Medis & TV Display

> **Sistem Informasi Manajemen Jadwal Dokter, Cuti, dan Integrasi Smart TV Display Rumah Sakit Modern**  
> Dibangun dengan arsitektur **Next.js 15+ (App Router)**, **TypeScript**, **3D Claymorphism Design System**, **Prisma ORM (PostgreSQL)**, dan **Real-time WebSocket Sync**.

---

## 📑 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
3. [Panduan Modul Aplikasi](#-panduan-modul-aplikasi)
   - [1. Modul Dokter (`/doctors`)](#1-modul-dokter-doctors)
   - [2. Modul Jadwal Dokter (`/schedules`)](#2-modul-jadwal-dokter-schedules)
   - [3. Modul Jadwal Cuti & Kalender Nasional (`/leaves`)](#3-modul-jadwal-cuti--kalender-nasional-leaves)
   - [4. Modul Automasi Sistem & TV (`/automation`)](#4-modul-automasi-sistem--tv-automation)
   - [5. Layar TV Display Antrean (`/display`)](#5-layar-tv-display-antrean-display)
4. [Design System 3D Claymorphism](#-design-system-3d-claymorphism)
5. [Instalasi & Menjalankan Lokal](#-instalasi--menjalankan-lokal)
6. [Deployment & Production](#-deployment--production)
7. [API Endpoints](#-api-endpoints)
8. [Struktur Folder Codebase](#-struktur-folder-codebase)

---

## 🌟 Fitur Utama

- ⚡ **Ultra-Smooth 120 FPS Rendering**: GPU hardware acceleration (`translateZ(0)`), SWR *stale-while-revalidate* caching, font preloading, dan non-blocking rendering dengan `useDeferredValue`.
- 📅 **Kalender Nasional Indonesia Terintegrasi**: Built-in SKB 3 Menteri (2025–2027), otomatis menandai **Tanggal Merah** dan Hari Minggu lengkap dengan nama hari libur nasional resmi.
- 📺 **Real-Time Smart TV Display Sync**: Sinkronisasi jadwal, running text, dan siaran darurat ke TV antrean rumah sakit via WebSocket secara instan.
- 🎨 **3D Tactile Claymorphism UI**: Antarmuka visual 3D modern dengan kedalaman bayangan multi-layer, konsisten di seluruh desktop, tablet, dan mobile.
- 🤖 **AI WhatsApp Cuti Importer**: Ekstraksi dan input jadwal cuti dokter secara otomatis dari teks pesan WhatsApp menggunakan AI.
- 📱 **Progressive Web App (PWA)**: Offline caching dengan Serwist Service Worker, siap di-install di perangkat mobile petugas.

---

## 🛠️ Arsitektur & Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend Framework** | [Next.js 15+](https://nextjs.org/) (App Router, Server & Client Components) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + Custom 3D Claymorphism Engine |
| **Data Fetching & Cache** | [SWR](https://swr.vercel.app/) (`stale-while-revalidate`, `keepPreviousData: true`) |
| **Realtime Engine** | [Socket.io](https://socket.io/) (Singleton WebSocket client & server) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM v7](https://www.prisma.io/) |
| **PWA & Offline** | [Serwist](https://serwist.pages.dev/) Service Worker |
| **Icons & Animation** | [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) |
| **Monitoring & Logs** | [Sentry](https://sentry.io/) + Custom Automation Audit Logs |

---

## 📖 Panduan Modul Aplikasi

### 1. Modul Dokter (`/doctors`)
* **Pencarian Cepat & Filter**: Input pencarian dokter non-blocking (`useDeferredValue`), filter kategori (Bedah / Non-Bedah), dan filter status tayang.
* **Dual View Mode**:
  - *Grid Mode*: Kartu 3D Clay dengan avatar inisial, info kuota antrean, spesialisasi, dan drag-and-drop reordering (`@dnd-kit`).
  - *Table Mode*: Tabel ringkas untuk manajemen data massal dengan `.content-visibility-auto` untuk rendering ribuan baris tanpa lag.
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
* **Tab Switcher Terpadu**:
  - *Tanggal Terpilih*: Dokter yang cuti pada tanggal yang diklik + banner libur nasional.
  - *Semua Agenda Cuti*: Daftar lengkap seluruh jadwal cuti dengan fitur cari dan hapus instan.
* **Pilihan Durasi Cepat**: Tombol preset durasi cuti (`Hari Ini (1 Hari)`, `Besok`, `3 Hari`, `1 Minggu`) tanpa repot memilih tanggal dua kali.
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

### 5. Layar TV Display Antrean (`/display`)
* Didesain khusus untuk Smart TV display lobi poliklinik (1080p / 4K).
* Menampilkan matriks dokter praktek hari ini, jam layanan, status antrean, dynamic island headline, dan emergency popup overlay.
* Auto-sync seketika saat ada perubahan di admin tanpa perlu me-refresh browser TV.

---

## 🎨 Design System 3D Claymorphism

Design system SIMED menggunakan class utility kustom berbasis hardware-accelerated CSS di `src/app/globals.css`:

```css
/* Permukaan Kartu 3D */
.clay-surface       /* Permukaan cembung tactile lembut */
.clay-inset         /* Area input cekung (depressed) */
.clay-button        /* Tombol interaktif dengan depth hover & active:scale */

/* Badge & Pill 3D Warna */
.clay-pill-blue     /* Aksen Biru Medis */
.clay-pill-emerald  /* Aksen Hijau Sukses / Aktif */
.clay-pill-amber    /* Aksen Amber Perhatian / Cuti */
.clay-pill-rose     /* Aksen Merah Tanggal Merah / Darurat */
.clay-pill-violet   /* Aksen Ungu Automasi / AI */

/* Icon Clay Bulat */
.clay-icon-blue, .clay-icon-emerald, .clay-icon-amber, .clay-icon-rose, .clay-icon-violet
```

---

## 🚀 Instalasi & Menjalankan Lokal

### Prasyarat
- Node.js 18+ atau Node.js 20+
- PostgreSQL database (lokal atau Docker)

### Langkah Instalasi
```bash
# 1. Clone repository
git clone https://github.com/fallonava/simed.git
cd simed

# 2. Install dependencies
npm install

# 3. Setup environment variable
cp .env.example .env
# Sesuaikan DATABASE_URL di file .env

# 4. Generate & Push Prisma Schema
npx prisma generate
npx prisma db push

# 5. Jalankan server development
npm run dev
```

Buka di browser: `http://localhost:3000`

---

## 🌐 Deployment & Production

### Build & Type-Check
```bash
# Validasi TypeScript
npx tsc --noEmit

# Build production
npm run build

# Jalankan server production
npm run start
```

### Production dengan PM2
```bash
# Start aplikasi via PM2
pm2 start ecosystem.config.js

# Cek log server
pm2 logs simed

# Monitor performa
pm2 monit
```

### Sinkronisasi Server Rumah (Home Server / CasaOS)
```bash
bash scripts/sync-home.sh
```

---

## 🔌 API Endpoints

| Method | Endpoint | Keterangan | Caching |
|---|---|---|---|
| `GET/POST/PUT/DELETE` | `/api/doctors` | Master Data Dokter & Kuota Antrean | `s-maxage=2, SWR=59` |
| `GET/POST/PUT/DELETE` | `/api/shifts` | Jadwal Shift Dokter Harian & Mingguan | `s-maxage=2, SWR=59` |
| `GET/POST/PUT/DELETE` | `/api/leaves` | Pengajuan & Riwayat Cuti Dokter | `Dynamic` |
| `GET/POST/PUT/DELETE` | `/api/automation` | Broadcast Rules & Siaran Darurat TV | `Dynamic` |
| `GET/POST` | `/api/settings` | Pengaturan Dynamic Island & Portal TV | `Dynamic` |
| `GET/POST/PUT/DELETE` | `/api/automation-rules` | Aturan Automasi Pintar Background | `Dynamic` |
| `GET` | `/api/automation-logs` | Log Audit Eksekusi Automasi | `Dynamic` |

---

## 📂 Struktur Folder Codebase

```
simed/
├── public/                 # Static assets & icons
├── src/
│   ├── app/                # Next.js App Router Pages & API Routes
│   │   ├── api/            # REST API endpoints (doctors, shifts, leaves, automation)
│   │   ├── doctors/        # Halaman Master Dokter
│   │   ├── schedules/      # Halaman Jadwal Dokter (Timeline & Matriks)
│   │   ├── leaves/         # Halaman Jadwal Cuti & Kalender Nasional
│   │   ├── automation/     # Halaman Pusat Automasi & TV Display
│   │   ├── display/        # Halaman Layar TV Display Antrean
│   │   ├── globals.css     # 3D Claymorphism & GPU Acceleration Design Tokens
│   │   └── layout.tsx      # Root Layout dengan Font Preload & SWR Provider
│   ├── components/         # Shared UI Components (PageHeader, SearchableSelect, Modals)
│   ├── features/           # Feature-based Components
│   │   ├── doctors/        # Komponen Dokter (DoctorCard, DoctorForm)
│   │   ├── schedules/      # Komponen Jadwal (RealtimeCalendar, UpcomingShifts)
│   │   ├── leaves/         # Komponen Cuti (LeaveCalendar, LeaveRequestModal)
│   │   └── automation/     # Komponen Automasi (BroadcastControl, DynamicIsland, Rules, Logs)
│   ├── hooks/              # Custom Hooks (useDebounce, useSocket, useMobile)
│   └── lib/                # Utilities, Prisma Client, dan Indonesian Holidays Database
├── prisma/
│   └── schema.prisma       # Skema Database PostgreSQL
├── next.config.ts          # Optimasi Tree-shaking & PWA config
└── package.json            # Dependencies & Scripts
```

---

## 📄 Lisensi
Hak Cipta © 2026 **SIMED Team & Fallonava**. Seluruh hak cipta dilindungi undang-undang.
