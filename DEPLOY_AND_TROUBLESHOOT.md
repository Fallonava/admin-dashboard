# 🛠️ Panduan Operasional SIMED: Redeploy & Troubleshooting

Dokumen ini adalah panduan standar operasional (SOP) untuk melakukan redeploy aplikasi **SIMED** serta langkah-langkah cepat mengatasi masalah saat service mengalami kendala atau gagal running (*crash/down*).

---

## 📑 Daftar Isi
1. [Akses Remote Server via SSH](#1-akses-remote-server-via-ssh)
2. [Cara Redeploy Aplikasi (Production)](#2-cara-redeploy-aplikasi-production)
   - [Metode A: Otomatis 1-Klik (Sangat Direkomendasikan)](#metode-a-otomatis-1-klik-sangat-direkomendasikan)
   - [Metode B: Manual Step-by-Step](#metode-b-manual-step-by-step)
3. [Panduan Mengatasi Masalah (Troubleshooting Matrix)](#3-panduan-mengatasi-masalah-troubleshooting-matrix)
   - [Masalah 1: PM2 Status `errored` / Port Bentrok `EADDRINUSE 3000` / PID 0](#masalah-1-pm2-status-errored--port-bentrok-eaddrinuse-3000--pid-0)
   - [Masalah 2: Error `Invalid/missing environment variables: DATABASE_URL`](#masalah-2-error-invalidmissing-environment-variables-database_url)
   - [Masalah 3: Tabel Baru Tidak Ditemukan (`The table public.X does not exist`)](#masalah-3-tabel-baru-tidak-ditemukan-the-table-publicx-does-not-exist)
   - [Masalah 4: `git pull` Gagal karena File Lokal Transpilasi](#masalah-4-git-pull-gagal-karena-file-lokal-transpilasi)
   - [Masalah 5: Database PostgreSQL Down / Connection Refused](#masalah-5-database-postgresql-down--connection-refused)
   - [Masalah 6: Cloudflare Tunnel Down (Error 1033 / 502 Bad Gateway)](#masalah-6-cloudflare-tunnel-down-error-1033--502-bad-gateway)
   - [Masalah 7: WhatsApp Bot Worker (`wa-worker`) Terputus](#masalah-7-whatsapp-bot-worker-wa-worker-terputus)
4. [Prosedur Pemulihan Darurat (Emergency Database Rollback)](#4-prosedur-pemulihan-darurat-emergency-database-rollback)
5. [Verifikasi Status Sistem Pasca-Deploy](#5-verifikasi-status-sistem-pasca-deploy)

---

## 1. Akses Remote Server via SSH

Akses remote ke Windows Server menggunakan SSH melalui Cloudflare Tunnel:

```bash
# Dari komputer lokal / Linux Admin:
sshpass -p "qwer" ssh -o StrictHostKeyChecking=no -o ProxyCommand="cloudflared access ssh --hostname %h" "ANTRIAN 1"@srimed.fallonava.my.id
```

> **Informasi Server**:
> * **User**: `ANTRIAN 1`
> * **Password**: `qwer`
> * **Direktori Aplikasi**: `C:\simed-production`
> * **Direktori Backup**: `C:\simed-production\backups` & `C:\backups`
> * **Database**: PostgreSQL 16 (`medcoredb` di `localhost:5432`)
> * **PM2 Profile**: `C:\Users\ANTRIAN 1\.pm2`
> * **Windows Service**: `pm2.exe` (StartMode: `Auto`, runs as background system service immune to user logoff)

---

## 2. Cara Redeploy Aplikasi (Production)

### Metode A: Otomatis 1-Klik (Sangat Direkomendasikan)

Jalankan script deploy otomatis yang sudah dilengkapi pelindung database, non-destructive schema migration, dan zero-downtime reload:

```powershell
# Jalankan di PowerShell server Windows:
cd C:\simed-production
powershell -ExecutionPolicy Bypass -File scripts\deploy-production.ps1
```

Script ini secara otomatis melakukan 6 tahap:
1. 🛡️ **[1/6] Automated Database Safe-Guard**: Snapshot JSON 18 tabel ke `backups/` + `pg_dump` SQL backup.
2. 🔄 **[2/6] Clean Git Sync**: `git fetch origin master; git reset --hard origin/master` (menghindari konflik file lokal).
3. 📦 **[3/6] Prisma Client & DB Sync**: `npx prisma generate` dan `npx prisma db push --skip-generate` (sinkronisasi tabel baru tanpa menghapus data).
4. ⚡ **[4/6] Production Compile**: `npm run build` (Next.js 16 + esbuild bundle `server.js`).
5. 🔁 **[5/6] Zero-Downtime Reload**: `pm2 reload ecosystem.config.js --update-env` (smooth process swap via `process.send('ready')`).
6. 💾 **[6/6] Save PM2 State**: `pm2 save` untuk persistensi state PM2 Windows Service.

---

### Metode B: Manual Step-by-Step

Jika ingin melakukan pembaruan langkah demi langkah secara manual:

```powershell
cd C:\simed-production

# 1. Backup Database terlebih dahulu (PENTING)
npx tsx scripts/backup-db.ts

# 2. Ambil update kode terbaru dan paksa sync
git fetch origin master
git reset --hard origin/master

# 3. Sinkronisasi Prisma & Database Schema
npx prisma generate
npx prisma db push --skip-generate

# 4. Compile build Next.js dan server bundler
npm run build

# 5. Reload PM2 Zero-Downtime dengan environment terbaru
pm2 reload ecosystem.config.js --update-env
pm2 save
```

---

## 3. Panduan Mengatasi Masalah (Troubleshooting Matrix)

### Masalah 1: PM2 Windows Service & Status Proses

**Anti-Kill Background Service**:
PM2 berjalan sebagai Windows Service (`pm2.exe`). Aplikasi tetap berjalan 24/7 di background tanpa bergantung pada login/sesi desktop user Windows.

* Cek status service Windows:
  ```powershell
  Get-Service pm2.exe
  ```
* Restart service jika PM2 daemon berhenti total:
  ```powershell
  Restart-Service pm2.exe
  ```
* Jika terjadi port bentrok atau perlu reset proses bersih:
  ```powershell
  pm2 kill
  Start-Service pm2.exe
  pm2 status
  ```

---

### Masalah 2: Error `Invalid/missing environment variables: DATABASE_URL`

**Gejala**: Log PM2 menampilkan `❌ Invalid/missing environment variables: DATABASE_URL, JWT_SECRET, ADMIN_KEY`.
**Penyebab**: Bundler esbuild me-hoist modul sebelum `dotenv.config()` dijalankan.
**Langkah Penanganan**:
* Pastikan di baris paling atas `src/lib/env.ts` terdapat:
  ```typescript
  import dotenv from 'dotenv';
  dotenv.config();
  ```
* Jalankan ulang `npm run build` dan `pm2 restart ecosystem.config.js`.

---

### Masalah 3: Tabel Baru Tidak Ditemukan (`The table public.X does not exist`)

**Gejala**: Error `PrismaClientKnownRequestError: The table public.TrafficHit does not exist`.
**Penyebab**: Skema Prisma baru belum di-push ke PostgreSQL database.
**Langkah Penanganan**:
```powershell
cd C:\simed-production
npx prisma db push --skip-generate
npx prisma generate
pm2 restart ecosystem.config.js
```

---

### Masalah 4: `git pull` Gagal karena File Lokal Transpilasi

**Gejala**: `error: Your local changes to the following files would be overwritten by merge`.
**Penyebab**: File `.js` hasil kompilasi lokal termodifikasi di server.
**Langkah Penanganan**:
```powershell
cd C:\simed-production
git fetch origin master
git reset --hard origin/master
```

---

### Masalah 5: Database PostgreSQL Down / Connection Refused

**Gejala**: Log menampilkan `Can't reach database server at localhost:5432`.
**Langkah Penanganan**:
1. Cek status service PostgreSQL di Windows Services:
   ```powershell
   Get-Service -Name "*postgres*"
   ```
2. Jika berstatus `Stopped`, jalankan service:
   ```powershell
   Start-Service -Name "postgresql-x64-16"
   ```

---

### Masalah 6: Cloudflare Tunnel Down (Error 1033 / 502 Bad Gateway)

**Gejala**: Domain `simed.fallonava.my.id` menampilkan error Cloudflare 1033 atau 502.
**Langkah Penanganan**:
1. Cek status service Cloudflared di server:
   ```powershell
   Get-Service -Name "cloudflared"
   ```
2. Restart service jika perlu:
   ```powershell
   Restart-Service -Name "cloudflared"
   ```

---

### Masalah 7: WhatsApp Bot Worker (`wa-worker`) Terputus

**Gejala**: Pesan WhatsApp bot tidak terkirim atau status di admin tidak sinkron.
**Langkah Penanganan**:
1. Cek log worker:
   ```powershell
   pm2 logs wa-worker --lines 30
   ```
2. Restart worker:
   ```powershell
   pm2 restart wa-worker
   ```

---

## 4. Arsitektur Multi-Server (Server Utama RS & Server Backup Home)

SIMED menggunakan arsitektur **High Availability (HA) Hybrid**:

| Parameter | Server Utama (Production RS) | Server Backup (Home Server Replica) |
| :--- | :--- | :--- |
| **Lokasi** | Server Windows RS (`ANTRIAN 1`) | Linux Server Docker (`fallonava`) |
| **Akses SSH** | `ssh "ANTRIAN 1"@srimed.fallonava.my.id` | SSH Local / Cloudflare Tunnel |
| **Database** | PostgreSQL 16 Native (`localhost:5432`) | PostgreSQL 16 Docker (`panel-db`) |
| **Aplikasi** | PM2 Fork Mode Port 3000 | Container `navalynk-web` / Docker |
| **Replikasi** | Master Data Publisher | Replica Subscriber (`*/5 * * * *`) |

### Mekanisme Sinkronisasi Database Otomatis:
Crontab di Home Server menjalankan script:
```bash
*/5 * * * * /home/fallonava/simed/scripts/sync-from-rs.sh >/dev/null 2>&1
```
Script tersebut melakukan live non-blocking `pg_dump` dari server RS via Tailscale/VPN (`100.117.70.113:5432`) dan mengimpornya ke database lokal `panel-db`, menjamin data di Home Server selalu mutakhir (maksimal selisih 5 menit).

---

## 5. Prosedur Pemulihan Darurat (Emergency Database Rollback & Failover)

### Skenario A: Rollback Data Lokal di Server RS
1. Buka direktori backup otomatis:
   ```powershell
   Get-ChildItem "C:\simed-production\backups" | Sort-Object CreationTime -Descending
   ```
2. Temukan folder timestamp terakhir (misal: `2026-08-25T...`).
3. Jalankan script restore:
   ```powershell
   npx tsx scripts/restore-from-json.ts backups/<timestamp-folder>
   ```

### Skenario B: Failover jika Server RS Mengalami Pemadaman Listrik / Hardware Down
1. Pada Cloudflare Dashboard, alihkan routing tunnel `simed.fallonava.my.id` ke container `cloudflared-simed-ha` di Home Server.
2. Database di Home Server (`panel-db`) sudah berisi salinan penuh 18 tabel dan siap melayani permintaan secara instan (*Zero Data Loss*).

---

## 6. Verifikasi Status Sistem Pasca-Deploy

Setelah melakukan deploy, lakukan verifikasi cepat:

```bash
# Cek endpoint status & database health:
curl -s https://simed.fallonava.my.id/api/health
# Response: {"status":"ok","db":"ok",...}

# Cek endpoint display (SWR Caching):
curl -I https://simed.fallonava.my.id/api/display

# Cek endpoint Smart TV:
curl -I https://simed.fallonava.my.id/tv.html

# Cek tracking traffic (In-Memory Buffer Ingest):
curl -X POST https://simed.fallonava.my.id/api/traffic/track -H "Content-Type: application/json" -d '{"path":"/jadwal","ref":"verify"}'

# Cek PM2 status di server:
pm2 status
```

Semua endpoint harus mengembalikan status **HTTP 200 OK** dan PM2 berstatus **online**.

