# 🛠️ Panduan Operasional SIMED: Redeploy & Troubleshooting

Dokumen ini adalah panduan standar operasional (SOP) untuk melakukan redeploy aplikasi **SIMED** serta langkah-langkah cepat mengatasi masalah saat service mengalami kendala atau gagal running (*crash/down*).

---

## 📑 Daftar Isi
1. [Akses Remote Server via SSH](#1-akses-remote-server-via-ssh)
2. [Cara Redeploy Aplikasi (Production)](#2-cara-redeploy-aplikasi-production)
   - [Metode A: Otomatis 1-Klik (Rekomendasi)](#metode-a-otomatis-1-klik-rekomendasi)
   - [Metode B: Manual Step-by-Step](#metode-b-manual-step-by-step)
3. [Panduan Mengatasi Masalah (Troubleshooting Matrix)](#3-panduan-mengatasi-masalah-troubleshooting-matrix)
   - [Masalah 1: PM2 Status `errored` / Terus Menerus Restart](#masalah-1-pm2-status-errored--terus-menerus-restart)
   - [Masalah 2: Database PostgreSQL Down / Connection Refused](#masalah-2-database-postgresql-down--connection-refused)
   - [Masalah 3: Port 3000 / 3002 Bentrok (Port In Use / Zombie Process)](#masalah-3-port-3000--3002-bentrok-port-in-use--zombie-process)
   - [Masalah 4: Cloudflare Tunnel Down (Error 1033 / 502 Bad Gateway)](#masalah-4-cloudflare-tunnel-down-error-1033--502-bad-gateway)
   - [Masalah 5: WhatsApp Bot Worker (`wa-worker`) Terputus](#masalah-5-whatsapp-bot-worker-wa-worker-terputus)
   - [Masalah 6: Next.js Build Gagal / TypeScript Error](#masalah-6-nextjs-build-gagal--typescript-error)
4. [Prosedur Pemulihan Darurat (Emergency Database Rollback)](#4-prosedur-pemulihan-darurat-emergency-database-rollback)

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
> * **Direktori Backup**: `C:\simed-production\backups` & `C:\simed-backups`
> * **Database**: PostgreSQL 16 (`medcoredb` di `localhost:5432`)

---

## 2. Cara Redeploy Aplikasi (Production)

### Metode A: Otomatis 1-Klik (Rekomendasi)

Jalankan script deploy otomatis yang sudah dilengkapi pelindung database, non-destructive schema migration, dan zero-downtime rolling reload:

```powershell
# Jalankan di PowerShell server Windows:
cd C:\simed-production
powershell -ExecutionPolicy Bypass -File scripts\deploy-production.ps1
```

Script ini secara otomatis melakukan:
1. 🛡️ **Level 1 Pre-deploy Backup**: Snapshot JSON seluruh tabel (Dokter, Shift, Cuti, User, Broadcast) ke folder `backups/`.
2. 🔄 **Git Sync**: Mengambil commit terbaru dari `origin/master`.
3. 📦 **Prisma Client & DB Sync**: Memperbarui schema database tanpa menghapus data yang ada (`npx prisma db push`).
4. ⚡ **Production Compile**: Mengompilasi bundle Next.js yang dioptimalkan (`npm run build`).
5. 🔁 **Zero-Downtime Reload**: Me-reload cluster PM2 secara bertahap (`pm2 reload ecosystem.config.js`).

---

### Metode B: Manual Step-by-Step

Jika ingin melakukan pembaruan langkah demi langkah secara manual:

```powershell
cd C:\simed-production

# 1. Backup Database terlebih dahulu
npx tsx -r dotenv/config scripts\backup-db.ts

# 2. Ambil update kode terbaru dari repository Git
git fetch origin master
git reset --hard origin/master

# 3. Sinkronisasi dependensi dan skema database
npm install
npx prisma generate
npx prisma db push

# 4. Compile build Next.js
npm run build

# 5. Reload PM2 cluster tanpa downtime
pm2 reload ecosystem.config.js --update-env
pm2 save
```

---

## 3. Panduan Mengatasi Masalah (Troubleshooting Matrix)

### Masalah 1: PM2 Status `errored` / Terus Menerus Restart

**Gejala**: `pm2 status` menampilkan status `errored` atau angka restart (`↺`) terus bertambah.

**Langkah Penanganan**:
1. Cek penyebab error secara langsung melalui log:
   ```bash
   pm2 logs simed --lines 50 --err
   ```
2. Cek berkas log fisik di:
   ```cmd
   type C:\simed-production\logs\simed-error.log
   ```
3. **Penyebab & Solusi Umum**:
   * **Out of Memory**: Jika memori melebihi batas, pastikan di `ecosystem.config.js` diset `max_memory_restart: '1G'`.
   * **Environment Variable Hilang**: Pastikan berkas `.env` ada di `C:\simed-production\.env` dan memuat `DATABASE_URL`, `JWT_SECRET`, `ADMIN_KEY`, dan `PORT=3000`.
   * **Server.js Crash**: Hapus proses lama dan restart ulang:
     ```bash
     pm2 delete simed
     pm2 start ecosystem.config.js
     pm2 save
     ```

---

### Masalah 2: Database PostgreSQL Down / Connection Refused

**Gejala**: Muncul pesan `Can't reach database server at localhost:5432` atau halaman login tidak dapat memproses autentikasi.

**Langkah Penanganan**:
1. Cek status service PostgreSQL di Windows:
   ```powershell
   Get-Service postgresql*
   ```
2. Jika status `Stopped`, jalankan kembali service:
   ```powershell
   Start-Service postgresql-x64-16
   ```
3. Cek port PostgreSQL apakah sudah listening:
   ```cmd
   netstat -ano | findstr :5432
   ```

---

### Masalah 3: Port 3000 / 3002 Bentrok (Port In Use / Zombie Process)

**Gejala**: Muncul error `EADDRINUSE: address already in use :::3000`.

**Langkah Penanganan**:
1. Cari PID yang sedang menduduki port:
   ```cmd
   netstat -ano | findstr :3000
   ```
2. Matikan proses zombie yang memblokir port tersebut (ganti `1234` dengan PID yang ditemukan):
   ```cmd
   taskkill /F /PID 1234
   ```
3. Jalankan kembali aplikasi via PM2:
   ```bash
   pm2 restart simed
   ```

---

### Masalah 4: Cloudflare Tunnel Down (Error 1033 / 502 Bad Gateway)

**Gejala**: Akses ke domain `https://simed.fallonava.my.id` menghasilkan error Cloudflare 1033 atau 502.

**Langkah Penanganan**:
1. Cek status koneksi Cloudflared di Windows Server:
   ```powershell
   Get-Service cloudflared
   ```
2. Restart service Cloudflared:
   ```powershell
   Restart-Service cloudflared
   ```
3. Jika dijalankan manual via CLI, cek log:
   ```cmd
   cloudflared tunnel run
   ```

---

### Masalah 5: WhatsApp Bot Worker (`wa-worker`) Terputus

**Gejala**: Pesan notifikasi WhatsApp tidak terkirim atau bot berstatus offline.

**Langkah Penanganan**:
1. Cek status bot di PM2:
   ```bash
   pm2 logs wa-worker --lines 30
   ```
2. Jika session expired / butuh scan QR ulang:
   ```powershell
   pm2 stop wa-worker
   # Hapus cache session lama
   Remove-Item -Recurse -Force C:\simed-production\.wwebjs_cache
   Remove-Item -Recurse -Force C:\simed-production\wa-bot\.wwebjs_auth
   # Jalankan kembali
   pm2 start wa-worker
   ```
3. Scan QR code yang muncul di terminal log.

---

### Masalah 6: Next.js Build Gagal / TypeScript Error

**Gejala**: Perintah `npm run build` berhenti dengan pesan error merah.

**Langkah Penanganan**:
1. Lakukan pengecekan tipe data tanpa build:
   ```bash
   npx tsc --noEmit
   ```
2. Bersihkan cache build `.next` yang korup:
   ```powershell
   Remove-Item -Recurse -Force C:\simed-production\.next
   ```
3. Jalankan ulang build:
   ```bash
   npm run build
   ```

---

## 4. Prosedur Pemulihan Darurat (Emergency Database Rollback)

Jika terjadi kesalahan data fatal atau tabel terhapus, database dapat dipulihkan secara instan:

### Opsi 1: Restore dari JSON Snapshot Terbaru
Setiap deployment secara otomatis membuat backup tabel di `C:\simed-production\backups\<TIMESTAMP>\`.

Untuk me-restore data tabel:
```powershell
npx tsx scripts\backup-db.ts --restore=C:\simed-production\backups\<TIMESTAMP>
```

### Opsi 2: Restore dari Level 2 `pg_dump` SQL
```powershell
# Mengembalikan full database dari dump SQL di C:\simed-backups:
$env:PGPASSWORD="medcore_local_password"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d medcoredb -f "C:\simed-backups\medcore_manual_backup.sql"
```

---

## 📞 Checklist Harian Administrator

| Pengecekan | Perintah | Status Normal |
|---|---|---|
| **Status PM2** | `pm2 status` | Semua `online`, memori `< 400MB` |
| **Koneksi Database** | `powershell "Get-Service postgresql*"` | `Running` |
| **Endpoint Web** | `curl -I https://simed.fallonava.my.id/login` | `HTTP/2 200` |
| **Display TV Antrean** | `curl -I https://simed.fallonava.my.id/tv.html` | `HTTP/2 200` |
| **Backup Otomatis** | `dir C:\simed-production\backups` | Ada folder backup hari ini |
