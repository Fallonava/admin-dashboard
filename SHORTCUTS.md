# SIMED Admin Dashboard — Cheat Sheet Developer

## 🚀 Development Lokal

```bash
npm run dev          # Jalankan dev server (localhost:3000)
npm run build        # Build produksi
npm run lint         # ESLint check
npm test             # Run Jest unit tests
```

## 🐘 Database (Prisma)

```bash
npx prisma studio              # Buka UI visual database
npx prisma migrate dev         # Buat migration file baru (dev)
npx prisma migrate deploy      # Apply migrations ke produksi
npx prisma generate            # Regenerate client (setelah ubah schema)
npx prisma db push             # Sync schema tanpa migration file (dev only)
```

## 🚢 Deployment

```bash
git push origin master         # ⭐ Trigger GitHub Actions otomatis
```

## 🔍 Monitor Server via SSH

```powershell
# Cek status semua proses PM2
ssh srimed "powershell -Command ""pm2 list"""

# Lihat log error dashboard
ssh srimed "powershell -Command ""Get-Content 'C:\simed-production\logs\admin-error.log' -Tail 50"""

# Restart darurat
ssh srimed "powershell -Command ""cd C:\simed-production; pm2 restart ecosystem.config.js --update-env"""

# Install PM2 sebagai service permanen (satu kali saja)
ssh srimed "powershell -ExecutionPolicy Bypass -File C:\simed-production\scripts\install-pm2-service.ps1"
```

## 🔑 Environment Variables Wajib

```env
DATABASE_URL=          # PostgreSQL pooled
DIRECT_URL=            # PostgreSQL non-pooled (migrate)
JWT_SECRET=            # Min 32 karakter
ADMIN_KEY=             # Min 8 karakter
NEXT_PUBLIC_APP_URL=   # https://simed.fallonava.my.id
```

## 🔐 Auth API

| Endpoint | Method | Keterangan |
|---|---|---|
| `/api/auth/login` | POST | Login → set cookie session |
| `/api/auth/logout` | POST | Logout device ini |
| `/api/auth/refresh` | GET | Rotate JWT token |
| `/api/auth/me` | GET | Cek sesi aktif |

## 🗃️ Prisma Soft-Delete

Model yang auto-filter `deletedAt = null`: **Doctor, Shift, User**

```typescript
// Data aktif saja (default)
const doctors = await prisma.doctor.findMany();

// Bypass soft-delete
const all = await prisma.$queryRaw`SELECT * FROM "Doctor"`;

// Pulihkan yang terhapus
await prisma.doctor.update({ where: { id }, data: { deletedAt: null } });
```

## 🐛 Troubleshooting Cepat

| Masalah | Solusi |
|---|---|
| `502 Bad Gateway` | `ssh srimed "pm2 start C:\simed-production\ecosystem.config.js"` |
| PM2 hilang setelah SSH tutup | Jalankan `install-pm2-service.ps1` |
| Build gagal di GH Actions | Cek tab Actions → Step 6 (Build log) |
| `prisma.X does not exist` | `npx prisma generate` |
| WA Bot disconnect | Scan ulang QR di Dashboard |
