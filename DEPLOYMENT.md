# 🏥 SIMED — Panduan Deployment Lengkap (Windows Server)

> **Arsitektur Aktif**: Windows Server + PM2 Cluster + PostgreSQL + Socket.IO  
> **CI/CD**: GitHub Actions → Self-Hosted Runner → `C:\simed-production`

---

## 📋 Daftar Isi
1. [Alur Deployment Sehari-hari](#1-alur-deployment-sehari-hari)
2. [Setup Awal Server (Satu Kali)](#2-setup-awal-server-satu-kali)
3. [Mengunci PM2 agar Kebal Restart](#3-mengunci-pm2-agar-kebal-restart)
4. [Perintah SSH Penting](#4-perintah-ssh-penting)
5. [Troubleshooting](#5-troubleshooting)
6. [Variabel Environment (.env)](#6-variabel-environment-env)

---

## 1. Alur Deployment Sehari-hari

Setelah setup awal selesai, alur pengembangan Anda **cukup satu perintah**:

```
Edit kode → git push origin master → Selesai ✅
```

GitHub Actions yang akan **otomatis** menjalankan:

| Langkah | Keterangan |
|---|---|
| `npm ci` | Install dependensi |
| `npx prisma migrate deploy` | Sinkronisasi schema database |
| `npm run build` | Bangun aplikasi produksi |
| Robocopy | Salin ke `C:\simed-production` |
| `pm2 start ecosystem.config.js` | Nyalakan ulang aplikasi |
| Verify | Pastikan `admin-dashboard` & `wa-worker` **Online** |

> ⚠️ **Anda TIDAK perlu SSH manual setiap kali update.**

---

## 2. Setup Awal Server (Satu Kali)

> Lakukan langkah ini hanya saat pertama kali migasi ke server baru atau reset total.

### 2.1 Prasyarat di Windows Server
Pastikan sudah terinstal:
- [Node.js v20+](https://nodejs.org/)
- [PM2](https://pm2.keymetrics.io/) — `npm install -g pm2`
- [PostgreSQL 16](https://www.postgresql.org/)
- [GitHub Actions Self-Hosted Runner](https://github.com/Fallonava/admin-dashboard/settings/actions/runners)

### 2.2 Konfigurasi Runner
Runner harus berjalan sebagai service di server `srimed` dan terdaftar di repo GitHub dengan label `[self-hosted, Windows]`.

### 2.3 Buat Folder Produksi
```powershell
New-Item -ItemType Directory -Path "C:\simed-production\logs" -Force
```

### 2.4 Push Kode Pertama Kali
```bash
git push origin master
```
GitHub Actions akan otomatis melakukan deployment pertama.

---

## 3. Mengunci PM2 agar Kebal Restart

> Setelah deployment pertama selesai, jalankan **satu kali** saja untuk membuat PM2 bertahan meski server mati listrik atau SSH ditutup.

```powershell
ssh srimed "powershell -ExecutionPolicy Bypass -File C:\simed-production\scripts\install-pm2-service.ps1"
```

**Yang dilakukan skrip ini:**
- Memulai ulang semua aplikasi dari `ecosystem.config.js`
- Membuat `C:\simed-production\start-pm2.bat` sebagai launcher
- Mendaftarkan Task Scheduler Windows: **SIMED_PM2_Autostart** (berjalan saat boot)

> ✅ Setelah ini, PM2 adalah **roh abadi** di server — kebal dari logout SSH dan restart server.

---

## 4. Perintah SSH Penting

### Cek Status Aplikasi
```powershell
ssh srimed "powershell -Command ""pm2 list"""
```

### Lihat Log Error Dashboard
```powershell
ssh srimed "powershell -Command ""Get-Content 'C:\simed-production\logs\admin-error.log' -Tail 50"""
```

### Lihat Log Real-time
```powershell
ssh srimed "powershell -Command ""pm2 logs admin-dashboard --lines 50"""
```

### Restart Manual (Emergency)
```powershell
ssh srimed "powershell -Command ""pm2 restart ecosystem.config.js --update-env"""
```

### Cek Resource Server
```powershell
ssh srimed "powershell -Command ""pm2 list; Get-Process node | Measure-Object -Property WorkingSet -Sum"""
```

---

## 5. Troubleshooting

### ❌ `502 Bad Gateway`
Aplikasi tidak mendengar di port 3000.
```powershell
# Cek apakah port terbuka
ssh srimed "powershell -Command ""netstat -ano | findstr :3000"""

# Cek log error
ssh srimed "powershell -Command ""Get-Content 'C:\simed-production\logs\admin-error.log' -Tail 30"""

# Nyalakan ulang darurat
ssh srimed "powershell -Command ""cd C:\simed-production; pm2 start ecosystem.config.js --update-env"""
```

### ❌ PM2 hilang setelah SSH ditutup
Berarti Task Scheduler belum terpasang. Jalankan skrip instalasi:
```powershell
ssh srimed "powershell -ExecutionPolicy Bypass -File C:\simed-production\scripts\install-pm2-service.ps1"
```

### ❌ GitHub Actions gagal di Step PM2
Periksa log di tab **Actions** GitHub. Kemungkinan penyebab:
- `ecosystem.config.js` tidak ditemukan di `C:\simed-production` → Cek Robocopy berhasil
- Port 3000 bentrok → Jalankan `taskkill /F /IM node.exe` via SSH lalu restart

### ❌ Database error saat startup
```powershell
# Cek PostgreSQL berjalan
ssh srimed "powershell -Command ""Get-Service postgresql*"""

# Jalankan migrasi manual jika perlu
ssh srimed "powershell -Command ""cd C:\simed-production; npx prisma migrate deploy"""
```

### ❌ WA Bot tidak tersambung
```powershell
ssh srimed "powershell -Command ""pm2 logs wa-worker --lines 30"""
```
Bot membutuhkan scan QR ulang lewat Dashboard → Halaman WA Bot Management.

---

## 6. Variabel Environment (.env)

File `.env` dibuat **otomatis** oleh GitHub Actions setiap deployment. Variabel dikonfigurasi langsung di file `deploy-windows.yml`.

### Variabel Wajib

| Variabel | Deskripsi |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL connection string (non-pooled, untuk migrate) |
| `JWT_SECRET` | Token rahasia untuk autentikasi (min 32 karakter) |
| `ADMIN_KEY` | Kunci master admin |
| `NEXT_PUBLIC_APP_URL` | URL publik aplikasi (`https://simed.fallonava.my.id`) |
| `AGENT_EXEC_TOKEN` | Token akses AI Agent Bridge (internal, jangan disebarkan) |

### Variabel Opsional

| Variabel | Deskripsi |
|---|---|
| `CRON_SECRET` | Autentikasi endpoint cron internal |
| `SENTRY_DSN` | Error tracking via Sentry |
| `NODE_NO_WARNINGS` | Set `1` untuk membungkam DeprecationWarning Node.js |

---

## 📁 Struktur File Penting

```
admin-dashboard/
├── ecosystem.config.js          # Konfigurasi PM2 (instances, RAM, log path)
├── server.ts / server.js        # Custom Next.js server dengan Socket.IO
├── next.config.ts               # Konfigurasi Next.js (tanpa standalone mode)
├── scripts/
│   ├── install-pm2-service.ps1  # ⭐ Skrip "Jurus Keabadian" (jalankan 1x)
│   └── restart-production.ps1  # Restart darurat manual
├── .github/workflows/
│   ├── deploy-windows.yml       # Pipeline deployment utama ke srimed
│   └── ci.yml                   # Pipeline CI (lint, test, build check)
└── src/app/api/system/control/  # 🤖 AI Agent Bridge (akses terminal via HTTP)
```

---

*Panduan ini berlaku untuk server `srimed` (Windows Server) dengan Cloudflare Tunnel ke domain `simed.fallonava.my.id`.*  
*Diperbarui: April 2026*
