---
name: Hospital Dashboard 2026 Core Guidelines
description: Panduan wajib untuk standar arsitektur dan tren desain antarmuka 2026 di project Admin Dashboard Rumah Sakit. Selalu baca dokumen ini sebelum menulis kode atau mengubah tata letak.
---

# 🏥 Hospital Dashboard Core Guidelines (2026 Edition)

Dokumen ini adalah *"Skill base"* atau otak utama referensi untuk project sistem antrean dan manajemen *Wing/Poliklinik* rumah sakit komersial ini.

Selalu terapkan filosofi dan standar berikut saat Anda diminta mengembangkan fitur baru atau memodifikasi fitur yang ada.

## 🎨 1. Desain Sistem 2026+ (Spatial & Hyper-Aesthetics)
Kita telah meninggalkan gaya kotak dasar dan *"flat design"* murahan. Web App 2.0 harus mengadopsi kaidah **Spatial UI & Apple-inspired Minimalism**:

- **Bento Box Layouts:** Hindari deretan form/tabel yang membosankan. Gunakan grid asimetris ala widget ("Bento Grids") untuk memecah informasi padat (kunjungan, pendapatan, rekap) menjadi modul-modul visual yang mudah dipindai.
- **Spatial Glassmorphism (Depth + Blur):** Gunakan `bg-white/60` (atau lebih rendah) dipadukan dengan `backdrop-blur-3xl` dan border setipis helai rambut (`border-white/50`). Antarmuka harus terasa seperti lembaran kaca yang melayang berlapis-lapis.
- **Spring Physics > Linear Animations:** Tinggalkan animasi kaku. Gunakan kurva bezier yang memantul lembut atau *spring physics* untuk setiap *hover* state.
  ```html
  transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:shadow-2xl
  ```
- **Luminance & Mesh Layering:** Untuk panel metrik, sematkan titik-titik gradasi cahaya (`bg-indigo-500/20 blur-3xl`) di *absolute background* untuk memberikan ilusi bahwa antarmuka memancarkan cahayanya sendiri.
- **Floating Dynamic Pills:** Ticker, peringatan bawah layar, atau modul navigasi jangan menempel penuh ke tepi ("edge-to-edge"). Gunakan komponen *"floating"* berbentuk kapsul yang terisolasi di area bawah (seperti Dynamic Island).
- **[NEW] 3D Tilt & Cursor Glow:** Gunakan efek rotasi 3D ringan pada kartu yang berinteraksi dengan pergerakan kursor (mouse tracking), serta efek *glowing orb* (spotlight) di sekeliling kursor untuk nuansa futuristik.
- **[NEW] Data-Dense Micro-Widgets:** Gunakan widget berukuran kecil dengan kepadatan informasi tinggi (contoh: "ER Wait Time: 4 mins", "Bed Availability: 85%") dilengkapi dengan *sparklines* atau *progress ring* yang dirender secara *real-time*.

## 📖 2. Standar Istilah Medis (Copywriting)
Gunakan tata bahasa profesional untuk status yang ditampilkan ke pasien atau admin komando:
- **❌ Buka Normal** ➞ **✅ Beroperasi Normal**
- **❌ Belum Buka / Tidak Aktif** ➞ **✅ Off-Duty / Inaktif**
- **❌ Antrean Ramai** ➞ **✅ Operasional Padat**
- **❌ Sibuk** ➞ **✅ Sedang Menangani Pasien / Tindakan Medis**

## ⚙️ 3. Pola Kode & Arsitektur 2.0
- **AI-Ready Components:** Bangun komponen yang bersifat *stateless* dan mudah disuntikkan data JSON, bersiap untuk masa depan di mana AI (seperti analisis anomali SEP) dapat memberikan konteks langsung ke layar.
- **Waktu yang Deterministik:** Gunakan menit absolut (`parseTimeToMinutes`) dari jam sistem yang dilemparkan dari atas (*Prop Drilling* atau *Context/Zustand*) untuk menghindari ketidaksinkronan jam di klien pengakses.
- **Optimistic UI Updates:** Saat Admin mengubah status (klik batal/selesai), antarmuka WAJIB merespon seketika tanpa menunggu *loading spinner* dari server. Lakukan POST/UPDATE di latar belakang (*swr* atau *React Query mutations*).
- **[NEW] Generative UI (Agentic UI):** Respon AI Assistant tidak boleh sekadar teks. AI harus dapat merender komponen React secara dinamis (*streaming UI*), seperti menampilkan kalender *booking* langsung di dalam chat.
- **[NEW] Ambient & Voice-First Readiness:** Struktur aplikasi harus mendukung *Zero-UI* (interaksi tanpa layar) melalui perintah suara, menjadikannya "Medical Concierge" yang asisten-sentris.

## 💡 4. Golden Rules WebApp 2.0
1. **Ruang Nafas (White Space) adalah Kemewahan**: Gunakan margin dan padding yang ekstrem secara vertikal (`p-6` hingga `p-10`, `rounded-[32px]`).
2. **Typography is UI**: Gunakan ketebalan *font* secara ekstrem (kombinasi `font-black` untuk angka metrik dan `font-medium` berukuran kecil `text-[10px]` untuk label).
3. **Sentuhan Sensori**: Semua komponen di Mobile harus *snap-tastic* (gunakan `snap-x mandatory` untuk *slider* horizontal).
4. **[NEW] Context-Aware:** UI harus beradaptasi berdasarkan *intent* pengguna dan waktu (misalnya mode senyap/gelap otomatis di malam hari, atau menonjolkan darurat UGD di panel paling atas).
