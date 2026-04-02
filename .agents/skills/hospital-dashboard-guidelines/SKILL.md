---
name: Hospital Dashboard 2026 Core Guidelines
description: Panduan wajib untuk standar arsitektur dan tren desain antarmuka 2026 di project Admin Dashboard Rumah Sakit. Selalu baca dokumen ini sebelum menulis kode atau mengubah tata letak.
---

# 🏥 Hospital Dashboard Core Guidelines

Dokumen ini adalah *"Skill base"* atau otak utama referensi untuk project sistem antrean dan manajemen *Wing/Poliklinik* rumah sakit komersial ini.

Selalu terapkan filosofi dan standar berikut saat Anda diminta mengembangkan fitur baru atau memodifikasi fitur yang ada.

## 🎨 1. Desain Sistem 2026 (UI/UX)
Kita telah meninggalkan gaya kotak dasar dan *"flat design"* murahan. UI menggunakan pendekatan **Mobile-First, "2026 Advanced Aesthetics"**:

- **Ambient Glassmorphism:** Gunakan `bg-white/80` (atau lebih rendah) dipadukan dengan `backdrop-blur-2xl` atau `3xl` untuk komponen utama agar tampilan terkesan tembus pandang menyerupai kaca medis premium.
- **Floating Dynamic Pills:** Ticker, peringatan bawah layar, atau modul navigasi kecil jangan menempel penuh ke tepi ("edge-to-edge"). Gunakan komponen *"floating"* (melayang) seperti kapsul di ambang batas bawah/atas layar.
- **Magnetic Soft Lift (Micro-Interactions):** Semua *card* interaktif atau daftar (seperti list Poli/Dokter) WAJIB menggunakan transisi lengkung khusus:
  ```html
  transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:shadow-xl
  ```
- **Aurora/Mesh Layering:** Untuk panel informasi penting namun tidak mau terlihat agresif (seperti jadwal cuti), gunakan `blur-3xl` pada elemen absolute di latar belakang alih-alih warna *solid*.
- **Horizontal Segmented Swipe:** Gunakan *Segmented Controls* (`flex w-max rounded-full border...`) yang di-*wrap* dengan `overflow-x-auto snap-x touch-pan-x` di versi seluler.

## 📖 2. Standar Istilah Medis (Copywriting)
Gunakan tata bahasa profesional untuk status yang ditampilkan ke pasien atau admin komando:
- **❌ Buka Normal** ➞ **✅ Beroperasi Normal**
- **❌ Belum Buka / Tidak Aktif** ➞ **✅ Off-Duty**
- **❌ Antrean Ramai** ➞ **✅ Antrean Padat**
- **❌ Sibuk** ➞ **✅ Sedang Menangani Pasien / Operasi**

## ⚙️ 3. Pola Kode & State Management
- **Waktu yang Deterministik:** Gunakan menit absolut (`parseTimeToMinutes`) dari jam sistem yang dilemparkan dari atas (*Prop Drilling*) atau Server Date, **bukan** berasumsi dari *Date/Time object* internal fungsi untuk sinkronisasi ketat.
- **Single Source of Truth:** Semua integrasi data *live* merujuk ke parameter `wingsWithStatus` untuk Poliklinik dan fungsi turunan `getRelevantShift(doc, currentTime)` untuk mengekstrak jam dokter saat itu.
- Hindari menyalin ulang logika waktu di beberapa tempat! Semua perhitungan terkait jam praktek harus mengandalkan modul *helper* (seperti utils.ts atau lib/utils).

## 💡 4. Golden Rules
1. Hal pertama sebelum melakukan modifikasi struktural: Lihat kesesuaian margin/padding. Gunakan spasi yang lapang (`p-5`, `rounded-[24px]`).
2. Desain memanjakan mata, tapi tetap perhatikan kontras keterbacaan (*WCAG*) mengingat dokter/admin mungkin kelelahan melihat layar.
3. Selalu periksa bagaimana UI tampak di **mobile/layar sentuh** setiap kali menyelesaikan fitur komponen *desktop*.
