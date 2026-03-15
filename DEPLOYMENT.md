# Panduan Deploy MedCore Admin "Zero-to-Hero" 🚀

Dokumen ini adalah panduan lengkap untuk melakukan instalasi dan pembaruan aplikasi MedCore Admin pada peladen (*server*) Ubuntu (direkomendasikan versi 22.04 LTS atau 24.04 LTS).

Arsitektur aplikasi ini menggunakan:
- **Next.js (Standalone Mode)** untuk efisiensi memori.
- **PM2 (Cluster Mode)** untuk memanfaatkan seluruh inti CPU server yang tersedia guna memastikan performa maksimal.
- **Node/TSX Cron Daemon** sebagai pekerja mandiri yang mengurus sistem otomatisasi latar belakang database.
- **Socket.io + Upstash Redis Adapter** untuk fitur real-time *broadcasting* berskala multi-CPU.

---

## 🛠️ Opsi 1: Instalasi Kilat (Server Kosong Baru) - *Disarankan*

Jika Anda baru menyewa VPS/Cloud (misal AWS EC2, DigitalOcean, dsb) dengan OS Ubuntu dan ingin langsung menginstall semuanya:

1. **Akses Server via SSH:**
   ```bash
   ssh -i kunci-server.pem ubuntu@IP_SERVER_ANDA
   ```

2. **Jalankan Skrip Instalasi 1-Klik:**
   Cukup salin dan tempel satu baris kode di bawah ini, mesin akan otomatis mengunduh repositori, memasang Node.js, PM2, Nginx, hingga merangkai aplikasi dan menjalankannya:
   ```bash
   bash <(curl -s https://raw.githubusercontent.com/Fallonava/admin-dashboard/master/scripts/quick-install.sh)
   ```

3. **Langkah Wajib Terakhir:**
   Skrip di atas akan berjalan dengan lancar, namun Anda **WAJIB** memasukkan password database sebelum aplikasi bisa dipakai.
   ```bash
   # Buka konfigurasi rahasia
   nano /home/ubuntu/admin-dashboard/.env
   
   # Isi parameter MONGODB_URI, DATABASE_URL, dan REDIS_URL.
   # Simpan (Ctrl+O, Enter, Ctrl+X)
   
   # Lakukan Sinkronisasi Database
   cd /home/ubuntu/admin-dashboard
   npx prisma migrate deploy
   ```

---

## 🏗️ Opsi 2: Instalasi Manual (Tahap demi Tahap)

Gunakan metode ini jika Anda ingin mempelajari atau mendiagnosa kendala tiap lapisan perakitan.

### 1. Kloning Source Code
```bash
cd /home/ubuntu
git clone https://github.com/Fallonava/admin-dashboard.git
cd admin-dashboard
```

### 2. Setup Library Dasar Server (Nginx, Node20, PM2)
```bash
# Otomasi instalasi dependency OS akan dilakukan oleh script ini
bash scripts/setup-ec2.sh
```

### 3. File Rahasia (.env)
Anda harus membuat file `.env` di dalam folder `admin-dashboard`.
Jangan pernah melakukan `git commit` pada file berisi rahasia ini.
```bash
nano .env
```
*(Tempel URL Database Neon, Secret JWT, dan URL Redis Upstash)*

### 4. Build dan Migrasi Database
```bash
# Unduh dependency NPM
npm ci

# Beritahu database tentang tabel-tabel baru
npx prisma generate
npx prisma migrate deploy

# Bangun file optimasi produksi (Standalone)
npm run build

# Salin aset statis ke folder keluaran NextJS
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

### 5. Jalankan PM2 (Cluster + Daemon Mode)
```bash
pm2 start ecosystem.config.js --env production
pm2 save

# Mendaftarkan auto-start agar nyala otomatis saat server restart
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## 🔄 Cara Melakukan Pembaruan (Update) Versi
Bila peladen sudah aktif, dan sewaktu-waktu Anda / Tim *developer* baru saja mem-*push* fitur baru ke GitHub `master` branch:

Anda TIDAK PERLU lagi melakukan ulang panduan dari awal. Cukup _login_ ke server dan jalankan:
```bash
cd /home/ubuntu/admin-dashboard
bash scripts/update-server.sh
```
Skrip `update-server.sh` akan menarik (`git pull`) fitur baru, *rebuild* sistem *standalone*, dan melakukan Zero-Downtime Reload pada PM2. Anda bahkan tidak perlu memutus *client* di rumah sakit! 🥂

## 🚨 Status Troubleshooting Penting
Jika aplikasi mengalami _crash_, Anda bisa memeriksa lalu-lintas _error_ menggunakan:
```bash
# Menengok log spesifik aplikasi API Web:
pm2 logs medcore-admin

# Menengok log khusus pekerja Automasi di latar belakang:
pm2 logs medcore-cron-worker

# Mengetahui status CPU dan Memori
pm2 monit
```
