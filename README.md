# 🏥 SIMED — Sistem Informasi Manajemen Medis & TV Display

> **Sistem Informasi Manajemen Jadwal Dokter, Cuti, Monitoring Trafik Publik, dan Integrasi Smart TV Display Rumah Sakit Modern**  
> Dibangun dengan arsitektur **Next.js 16 (App Router & Turbopack)**, **TypeScript**, **Apple iOS 2026 Claymorphism Design System**, **Prisma ORM v7 (PostgreSQL)**, **Real-time WebSocket / SSE Sync**, serta **High-Availability (HA) Hybrid Dual-Server Failover**.

---

## 📑 Daftar Isi

1. [Fitur Unggulan](#-fitur-unggulan)
2. [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
3. [Arsitektur Multi-Server & High Availability (HA)](#-arsitektur-multi-server--high-availability-ha)
   - [Skema Aliran Trafik & Failover Otomatis](#skema-aliran-trafik--failover-otomatis)
   - [Matriks Peran Server (RS vs Home Backup)](#matriks-peran-server-rs-vs-home-backup)
   - [Mekanisme Replikasi Database](#mekanisme-replikasi-database)
4. [Panduan Akses Remote Server (SSH & Jaringan)](#-panduan-akses-remote-server-ssh--jaringan)
   - [Akses ke Server Windows RS (Production Utama)](#1-akses-ke-server-windows-rs-production-utama)
   - [Akses ke Server Linux Home (Backup / Standby)](#2-akses-ke-server-linux-home-backup--standby)
   - [Akses Langsung via Tailscale Privat](#3-akses-langsung-via-tailscale-privat)
5. [Panduan Deployment (Production & Backup)](#-panduan-deployment-production--backup)
   - [A. Deploy ke Server Utama Windows RS (1-Klik)](#metode-a-deploy-ke-server-utama-windows-rs-1-klik)
   - [B. Deploy ke Server Backup Linux Home (1-Klik)](#metode-b-deploy-ke-server-backup-linux-home-1-klik)
   - [C. Deploy Manual Step-by-Step](#metode-c-deploy-manual-step-by-step)
6. [Panduan Modul & Halaman Aplikasi](#-panduan-modul--halaman-aplikasi)
   - [1. Portal Publik Jadwal Dokter (`/jadwal` / `jadwal.html`)](#1-portal-publik-jadwal-dokter-jadwal--jadwalhtml)
   - [2. Layar Smart TV Display Poliklinik (`/display` / `/tv.html`)](#2-layar-smart-tv-display-poliklinik-display--tvhtml)
   - [3. Modul Direktori Dokter (`/doctors`)](#3-modul-direktori-dokter-doctors)
   - [4. Modul Jadwal Praktek Dokter (`/schedules`)](#4-modul-jadwal-praktek-dokter-schedules)
   - [5. Modul Jadwal Cuti & Kalender Nasional (`/leaves`)](#5-modul-jadwal-cuti--kalender-nasional-leaves)
   - [6. Modul Automasi Sistem & TV Antrean (`/automation`)](#6-modul-automasi-sistem--tv-antrean-automation)
   - [7. Modul Monitoring Trafik Real-Time (`/traffic`)](#7-modul-monitoring-trafik-real-time-traffic)
7. [Design System Apple iOS 2026 Claymorphic](#-design-system-apple-ios-2026-claymorphic)
8. [Panduan Mengatasi Masalah (Troubleshooting Matrix)](#-panduan-mengatasi-masalah-troubleshooting-matrix)
   - [Masalah 1: SSH Permission Denied / Nyasar ke Server Linux Lokal](#masalah-1-ssh-permission-denied--nyasar-ke-server-linux-lokal)
   - [Masalah 2: Slide Smart TV (`tv.html`) Blank / Tidak Tampil Data](#masalah-2-slide-smart-tv-tvhtml-blank--tidak-tampil-data)
   - [Masalah 3: Data Cuti Dokter Tidak Muncul](#masalah-3-data-cuti-dokter-tidak-muncul)
   - [Masalah 4: PM2 Status `errored` / Port Bentrok `3000 / 3008`](#masalah-4-pm2-status-errored--port-bentrok-3000--3008)
   - [Masalah 5: Error `Invalid/missing environment variables: DATABASE_URL`](#masalah-5-error-invalidmissing-environment-variables-database_url)
   - [Masalah 6: PostgreSQL Connection Refused / Service Down](#masalah-6-postgresql-connection-refused--service-down)
   - [Masalah 7: Cloudflare Tunnel Down (Error 1033 / 502)](#masalah-7-cloudflare-tunnel-down-error-1033--502)
9. [Prosedur Pemulihan Darurat (Disaster Recovery & Failback)](#-prosedur-pemulihan-darurat-disaster-recovery--failback)
10. [Instalasi Lokal (Development)](#-instalasi-lokal-development)
11. [Daftar API Endpoints](#-daftar-api-endpoints)
12. [Struktur Folder Codebase](#-struktur-folder-codebase)

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

| Layer | Teknologi | Deskripsi |
|---|---|---|
| **Frontend Framework** | Next.js 16 | App Router, React 19, Turbopack, Server & Client Components |
| **Language** | TypeScript 5 | Strict typing, Interface contract validation |
| **Styling Engine** | Tailwind CSS v4 | Custom 3D Apple Claymorphism & Spatial Glass Design Tokens |
| **Realtime Engine** | Socket.io + SSE | Dual protocol (Socket.io untuk Admin & SSE `/api/stream/live` untuk Display) |
| **Database & ORM** | PostgreSQL 16 + Prisma v7 | Relational models dengan pg adapter pool connection singleton |
| **Process Manager** | PM2 | Daemon system management (Windows Service `pm2.exe` & Linux PM2) |
| **PWA & Offline** | Serwist | Service worker runtime caching & offline state fallback |
| **Security & Routing** | Cloudflare Zero Trust | Anycast Edge Tunnels, Access Policies, WAF, DNS management |
| **Private Mesh VPN** | Tailscale | Point-to-point WireGuard inter-server sync connection |

---

## 🔄 Arsitektur Multi-Server & High Availability (HA)

SIMED menerapkan sistem **Hybrid Dual-Server High-Availability (Active-Passive Auto-Failover)** untuk memastikan operasional antrean klinik dan Smart TV berjalan 24/7 tanpa downtime:

### Skema Aliran Trafik & Failover Otomatis

```
                  [ Pengguna / Pasien / Smart TV ]
                                │
                                ▼
                   Cloudflare Edge Network
                     (Tunnel ID: srimed)
                                │
        ┌───────────────────────┴───────────────────────┐
        │ [Kondisi Normal: Primary Aktif]                │ [Kondisi Darurat: RS Offline]
        ▼                                               ▼
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│   Server Utama RS (Production)  │           │   Server Backup (Home Server)   │
│   Host: ANTRIAN 1 (Windows)     │           │   Host: fallonava (Linux Docker)│
│                                 │           │                                 │
│ • PM2: simed (Port 3000)        │           │ • PM2: simed (Port 3008)        │
│ • Database: PostgreSQL Native   │           │ • Container: cloudflared-simed-ha│
│ • Master Data (Publisher)       │           │ • Database: Docker (panel-db)   │
└────────────────┬────────────────┘           └────────────────▲────────────────┘
                 │                                             │
                 │ Live pg_dump sync via Tailscale (tiap 5 mnt)│
                 └─────────────────────────────────────────────┘
```

### Matriks Peran Server (RS vs Home Backup)

| Parameter | Server Utama (Production RS) | Server Backup (Home Server Replica) |
| :--- | :--- | :--- |
| **Lokasi Fisik** | Server Windows RS (`ANTRIAN 1`) | Linux Server Docker (`fallonava`) |
| **Sistem Operasi** | Windows Server 64-bit | Linux Ubuntu / Debian 64-bit |
| **Akses SSH** | `ssh "ANTRIAN 1"@srimed.fallonava.my.id` | `ssh fallonava@ssh.fallonava.my.id` |
| **Database** | PostgreSQL 16 Native (`localhost:5432`) | PostgreSQL 16 Docker (`panel-db`) |
| **Aplikasi Web** | PM2 Fork Mode Port 3000 | PM2 Fork Mode Port 3008 |
| **Peran Replikasi** | Master Data Publisher | Replica Subscriber (`*/5 * * * *`) |
| **Koneksi Privat** | Tailscale IP: `100.117.70.113` | Tailscale IP: `100.72.180.95` |

### Mekanisme Replikasi Database

Crontab di Home Server menjalankan script:
```bash
*/5 * * * * /home/fallonava/simed/scripts/sync-from-rs.sh >/dev/null 2>&1
```
Script tersebut melakukan non-blocking snapshot `pg_dump` dari server RS via jaringan privat Tailscale (`100.117.70.113:5432`) dan mengimpornya ke database `panel-db`, menjamin data di Home Server selalu mutakhir (maksimal selisih 5 menit).

---

## 🔑 Panduan Akses Remote Server (SSH & Jaringan)

### 1. Akses ke Server Windows RS (Production Utama)
Akses remote ke Windows Server menggunakan SSH melalui Cloudflare Tunnel:
```bash
sshpass -p "qwer" ssh -o StrictHostKeyChecking=no -o ProxyCommand="cloudflared access ssh --hostname %h" "ANTRIAN 1"@srimed.fallonava.my.id
```
> **Info Kredensial Server RS**:
> - **User**: `ANTRIAN 1`
> - **Password**: `qwer`
> - **Direktori Aplikasi**: `C:\simed-production`
> - **Direktori Backup**: `C:\simed-production\backups` & `C:\backups`
> - **Database**: PostgreSQL 16 (`medcoredb` di `localhost:5432`)
> - **Service Daemon**: `pm2.exe` (Windows System Background Service)

### 2. Akses ke Server Linux Home (Backup / Standby)
Akses remote ke Home Server Linux lokal melalui tunnel `homeserver-panel`:
```bash
ssh -o StrictHostKeyChecking=no -o ProxyCommand="cloudflared access ssh --hostname %h" fallonava@ssh.fallonava.my.id
```
> **Info Server Linux**:
> - **User**: `fallonava`
> - **Direktori Aplikasi**: `/home/fallonava/simed`
> - **Port Web Backup**: `3008` (PM2 process `simed`)
> - **Container Database**: `panel-db` (Port `5432`)

### 3. Akses Langsung via Tailscale Privat (Bypass Cloudflare)
Jika Anda terhubung ke jaringan Tailscale:
- **SSH langsung ke Windows RS**: `ssh "ANTRIAN 1"@100.117.70.113`
- **SSH langsung ke Linux Home**: `ssh fallonava@100.72.180.95`

---

## 🚀 Panduan Deployment (Production & Backup)

### Metode A: Deploy ke Server Utama Windows RS (1-Klik)
Jalankan script deploy otomatis di PowerShell server Windows (Zero-Downtime + Automated Database Safe-Guard):
```powershell
cd C:\simed-production
powershell -ExecutionPolicy Bypass -File scripts\deploy-production.ps1
```

**Tahapan Otomatis Script Deploy RS**:
1. 🛡️ **[1/6] Automated DB Safe-Guard**: Ekspor JSON snapshot 18 tabel ke `backups/` + `pg_dump` SQL backup.
2. 🔄 **[2/6] Clean Git Sync**: `git fetch origin master; git reset --hard origin/master`.
3. 📦 **[3/6] Prisma Sync**: `npx prisma generate` dan `npx prisma db push --skip-generate`.
4. ⚡ **[4/6] Production Compile**: `npm run build` (Next.js 16 + esbuild bundle `server.js`).
5. 🔁 **[5/6] Zero-Downtime Reload**: `pm2 reload ecosystem.config.js --update-env`.
6. 💾 **[6/6] Save PM2 State**: `pm2 save` untuk persistensi state Windows Service.

---

### Metode B: Deploy ke Server Backup Linux Home (1-Klik)
Jalankan script deploy otomatis di terminal Linux Home Server:
```bash
/home/fallonava/simed/scripts/deploy-homeserver.sh
```

**Tahapan Otomatis Script Deploy Linux**:
1. 🔄 `git fetch origin master && git reset --hard origin/master`
2. 📦 `npm install --no-audit && npx prisma generate && npx prisma db push --skip-generate`
3. ⚡ `npm run build`
4. 🔁 `pm2 reload simed || pm2 restart simed`

---

### Metode C: Deploy Manual Step-by-Step
Jika ingin melakukan update langkah demi langkah:
```bash
# 1. Masuk ke direktori
cd /path/to/simed

# 2. Ambil update kode terbaru
git fetch origin master
git reset --hard origin/master

# 3. Sinkronisasi dependensi & schema Prisma
npm install --no-audit
npx prisma generate
npx prisma db push --skip-generate

# 4. Build Next.js & Server
npm run build

# 5. Reload proses PM2
pm2 reload ecosystem.config.js --update-env
pm2 save
```

---

## 📖 Panduan Modul & Halaman Aplikasi

### 1. Portal Publik Jadwal Dokter (`/jadwal` / `jadwal.html`)
Halaman portal publik utama yang diakses pasien via smartphone atau scan QR code resmi RS di lobi:
* **Bento Health Stats Widgets**: Live counter dokter Praktek (🟢), Kuota Penuh (🟠), dan Sedang Cuti (🔴).
* **Spotlight Search & Live Text Highlighting**: Pencarian instan nama dokter dan poliklinik.
* **Quick Specialty Chips**: Filter cepat (Semua Poli, Sp. Anak, Sp. Bedah, Sp. Penyakit Dalam, dll.).
* **Kartu Dokter 3D Clay**: Detail dokter, status praktek, jam pendaftaran, dan drawer menu instan 120 FPS.
* **Modal Pendaftaran 3-in-1**: Pilihan jalur BPJS (Mobile JKN), Non-BPJS (Nuha App), dan direct WhatsApp CS.
* **Tab Master Weekly Shift & Kalender Cuti**: Tampilan mingguan penuh dan agenda cuti dokter.

---

### 2. Layar Smart TV Display Poliklinik (`/display` / `/tv.html`)
* **10-Foot tvOS 18 Full HD (1080p) & 4K Canvas**: Didesain khusus untuk jarak pandang ruang tunggu poliklinik.
* **Apple Dynamic Island Interactive System**: Menampilkan identitas RS, live pulsing status, jam tabular, running text, dan siaran darurat.
* **Sidebar Carousel Widget**:
  - Slide 1: Cuaca Purbalingga Live BMKG (Suhu, Kelembaban, Kondisi Cuaca).
  - Slide 2..N: Kartu Status Khusus (Dokter Sedang Cuti, Tindakan Operasi di IBS, dan Kuota Penuh).
* **Split-Tree Flow Node**: Panduan alur pendaftaran pasien (Jalur Online Fast Track vs Jalur Reguler Kios).
* **GPU Render Containment**: Kartu dokter menggunakan `content-visibility: auto` untuk efisiensi CPU/GPU Smart TV box.

---

### 3. Modul Direktori Dokter (`/doctors`)
* **Pencarian Cepat & Filter**: Filter kategori Bedah/Non-Bedah dan status aktif.
* **Dual View**: Grid Mode (Kartu 3D Clay + Drag-and-drop reorder) dan Table Mode (Manajemen cepat).
* **Master CRUD**: Tambah/edit data dokter, foto profil, poliklinik, dan kode antrean.

---

### 4. Modul Jadwal Praktek Dokter (`/schedules`)
* **Strip Tanggal 7 Hari Responsif**: Selector tanggal interaktif dengan penanda tanggal merah SKB 3 Menteri.
* **Dual View**: Timeline Harian (24 Jam) dan Matriks Mingguan (Senin–Minggu).
* **Dokter Bertugas Hari Ini**: Sidebar aktif menampilkan dokter yang bertugas pada hari terpilih.

---

### 5. Modul Jadwal Cuti & Kalender Nasional (`/leaves`)
* **3D Clay KPI Statistics**: Counter Cuti Hari Ini, Total Cuti Bulan Ini, dan Agenda Mendatang.
* **Input Cerdas (AI dari WA)**: Tempel pesan pengajuan cuti dari grup WhatsApp untuk diproses otomatis.
* **Preset Durasi Cepat**: `Hari Ini (1 Hari)`, `Besok`, `3 Hari`, `1 Minggu`.

---

### 6. Modul Automasi Sistem & TV Antrean (`/automation`)
* **Control Center Siaran Darurat TV**: Template broadcast cepat (*Gangguan Sistem, Maintenance, Darurat, Custom*).
* **Pesan Bergilir Dynamic Island**: Kelola pengumuman running text pada layar TV.
* **Aturan Automasi Pintar**: Auto-Hide dokter cuti, auto-selesai shift berdasarkan jam praktek.
* **Audit Log Eksekusi**: Log aktivitas background scheduler real-time.

---

### 7. Modul Monitoring Trafik Real-Time (`/traffic`)
* **Non-Blocking Beacon Ingest**: Tracking volume kunjungan publik tanpa membebani database utama.
* **KPI Metrics**: Total Tayangan, Pengunjung Unik, Jam Teramai (Peak Hour WIB).
* **Breakdown Visual**: Distribusi jam sibuk, tipe perangkat (Mobile vs Desktop), browser, dan sumber rujukan.

---

## 🎨 Design System Apple iOS 2026 Claymorphic

SIMED menerapkan standar desain **Apple iOS 2026 Claymorphism**:

| Token Class | Deskripsi | Efek Fisika |
|---|---|---|
| `.platter` | Kartu dokter utama | Porcelain / obsidian surface dengan GPU containment, bevel border `2px`, dan aksen status `::before` |
| `.ios-bento-card` | Kartu statistik bento | Sudut `22px`, 3D coin icon, micro capsule, dan active corner glow aura `::after` |
| `.spec-chip` | Tombol filter poli cepat | Sunken capsule well (`inactive`) ➔ Elevated 3D clay pill (`active`) |
| `.clay-choice-tile` | Pilihan pendaftaran modal | Kartu berbayang 3D dengan haptic `:active` scale `0.95` |
| `.dynamic-island` | Kapsul notifikasi atas tvOS 18 | Obsidian spatial glass dengan 4 state adaptive morphing & organic equalizer |
| `.complication-status-pass`| Kartu status khusus di TV | Apple Wallet pass style dengan aksen warna status dan footer jadwal kembali |

---

## 🛡️ Panduan Mengatasi Masalah (Troubleshooting Matrix)

### Masalah 1: SSH Permission Denied / Nyasar ke Server Linux Lokal

**Gejala**: Menjalankan `ssh "ANTRIAN 1"@srimed.fallonava.my.id` menghasilkan `Permission denied` atau `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED`.  
**Penyebab**: Server Windows RS sedang offline. Container backup `cloudflared-simed-ha` di Linux aktif dan mengambil alih tunnel, sehingga SSH diarahkan ke Linux lokal (yang tidak memiliki user `ANTRIAN 1`).  
**Solusi**:
1. Pastikan Server Windows di RS menyala dan terkoneksi internet.
2. Jika server RS sudah online, matikan container backup di Linux: `docker stop cloudflared-simed-ha`.
3. Bersihkan cache host key di komputer lokal:
   ```bash
   ssh-keygen -f ~/.ssh/known_hosts -R srimed.fallonava.my.id
   ```
4. Coba koneksi SSH ulang ke Windows RS.

---

### Masalah 2: Slide Smart TV (`tv.html`) Blank / Tidak Tampil Data

**Gejala**: Carousel sidebar Smart TV berputar/bergeser, tetapi tampilannya kosong putih (blank void).  
**Penyebab**: Bug kalkulasi CSS `translateX(-${window._sidebarCarouselIdx * 100}%)` yang menggeser 100% dari total panjang track (300%), sehingga kartu terlempar keluar layar.  
**Solusi (Sudah Diperbaiki)**:
Gunakan formula pergeseran proporsional:
```javascript
track.style.width = `${totalSlides * 100}%`;
const stepPercent = (window._sidebarCarouselIdx * 100) / totalSlides;
track.style.transform = `translateX(-${stepPercent}%)`;
```

---

### Masalah 3: Data Cuti Dokter Tidak Muncul

**Gejala**: Dokter yang sedang cuti tidak muncul di tab Cuti atau di sidebar Smart TV.  
**Penyebab**: Data pengajuan cuti belum diinput di tabel `LeaveRequest` atau status dokter belum diset `CUTI`.  
**Solusi**:
1. Buka menu admin `/leaves` (`https://simed.fallonava.my.id/leaves`).
2. Tambahkan pengajuan cuti untuk dokter terkait dan tentukan tanggal mulai s/d selesai.
3. Simpan data; WebSocket akan otomatis memperbarui tampilan TV dan portal publik secara live.

---

### Masalah 4: PM2 Status `errored` / Port Bentrok `3000 / 3008`

**Penyebab**: Proses lama masih mengunci port.  
**Solusi**:
- **Di Windows Server**:
  ```powershell
  pm2 kill
  Start-Service pm2.exe
  pm2 status
  ```
- **Di Linux Home Server**:
  ```bash
  pm2 restart simed --update-env
  ```

---

### Masalah 5: Error `Invalid/missing environment variables: DATABASE_URL`

**Penyebab**: Bundler esbuild me-hoist modul sebelum `dotenv.config()` dijalankan.  
**Solusi**:
Pastikan di baris paling atas `src/lib/env.ts` terdapat:
```typescript
import dotenv from 'dotenv';
dotenv.config();
```
Lalu jalankan ulang `npm run build` dan reload PM2.

---

### Masalah 6: PostgreSQL Connection Refused / Service Down

**Penyebab**: Service PostgreSQL stopped atau container database down.  
**Solusi**:
- **Di Windows Server**:
  ```powershell
  Get-Service -Name "*postgres*"
  Start-Service -Name "postgresql-x64-16"
  ```
- **Di Linux Home Server**:
  ```bash
  docker start panel-db
  ```

---

### Masalah 7: Cloudflare Tunnel Down (Error 1033 / 502)

**Solusi**:
- Cek status service di server Windows: `Get-Service -Name "cloudflared"`
- Cek status container di Linux: `docker ps | grep cloudflared`
- Restart service jika diperlukan: `Restart-Service -Name "cloudflared"`

---

## 🆘 Prosedur Pemulihan Darurat (Disaster Recovery & Failback)

### Skenario A: Rollback Database Lokal di Server RS
1. Buka folder backup: `C:\simed-production\backups` atau `C:\backups`.
2. Temukan folder timestamp terakhir (misal: `pre-deploy_20260825_...`).
3. Jalankan script restore:
   ```powershell
   npx tsx scripts/restore-from-json.ts backups/<timestamp-folder>
   ```

### Skenario B: Failback Setelah Server RS Menyala Kembali
Jika selama server RS mati sempat terjadi transaksi atau penambahan antrean di server Linux Home:
1. Ekspor dump data terbaru dari Linux:
   ```bash
   docker exec panel-db pg_dump -U admin -d medcoredb --clean --if-exists --no-owner --no-privileges > backup_linux_terbaru.sql
   ```
2. Salin dan pulihkan file `.sql` ke server Windows RS menggunakan script:
   ```powershell
   powershell scripts\manual-db-restore.ps1 -File backup_linux_terbaru.sql
   ```
3. Pastikan crontab replikasi di Linux aktif kembali.

---

## 💻 Instalasi Lokal (Development)

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
# Sesuaikan DATABASE_URL di .env

# 4. Generate Prisma Client & Push Database Schema
npx prisma generate
npx prisma db push

# 5. Jalankan development server
npm run dev
```

Aplikasi development akan berjalan di:
- **Admin Dashboard**: `http://localhost:3005`
- **Portal Publik Jadwal**: `http://localhost:3005/jadwal`
- **Smart TV Display**: `http://localhost:3005/tv.html`

---

## 🌐 Daftar API Endpoints

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check status server & database |
| `POST` | `/api/auth/login` | Public | Autentikasi user & generate JWT cookie |
| `POST` | `/api/auth/logout` | Protected | Hapus session auth |
| `GET/POST/PUT/DELETE` | `/api/doctors` | Protected | CRUD data master dokter |
| `GET/POST/PUT/DELETE` | `/api/shifts` | Protected | Manajemen shift jadwal praktek |
| `GET/POST/PUT/DELETE` | `/api/leaves` | Protected | Manajemen jadwal cuti dokter |
| `GET/POST` | `/api/automation` | Protected | Konfigurasi rules & siaran TV |
| `GET/POST` | `/api/settings` | Protected | Pengaturan umum & dynamic island TV |
| `POST` | `/api/traffic/track` | Public | Ingest beacon kunjungan publik |
| `GET` | `/api/traffic/stats` | Protected | Agregasi data analitik trafik |
| `GET/POST` | `/api/display` | Public/Protected | Data snapshot dokter & shift display publik |
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
│   ├── deploy-homeserver.sh   # Script deploy otomatis Linux Home Server
│   ├── sync-from-rs.sh        # Script replikasi cron PostgreSQL via Tailscale
│   ├── backup-db.ts           # Automated JSON snapshot generator
│   └── restore-from-json.ts   # Emergency JSON rollback utility
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
