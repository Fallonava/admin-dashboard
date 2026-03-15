# Changelog

Semua perubahan yang mencolok pada proyek ini akan didokumentasikan di berkas ini.

Formatnya didasarkan pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/),
dan proyek ini mematuhi [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-10

### Added

- Staging environment pipeline (`staging.yml`).
- Skrip health check untuk restart PM2 otomatis.
- Winston logger untuk pencatatan log (logging) terpusat pada service automation.
- Skrip rollback untuk mundur ke commit sebelumnya di server.
- Focus trap di modal form.
- Keyboard accessible Drag-and-Drop.
- Link Skip-to-Content.

### Changed

- Aksesibilitas warna badge diperbarui untuk mematuhi standar WCAG AA.
- Komentar teknis dan basis kode ditranslasikan secara konsisten ke Bahasa Indonesia.
- Fungsi utilitas di `src/lib/` sekarang didukung dengan spesifikasi tipe JSDoc/TSDoc.
- Magic string (misal: "BUKA", "admin") dipusatkan menjadi satu tempat pada `src/lib/constants.ts`.

### Security

- `/api/seed` dikunci sepenuhnya dan me-return status 404 pada lingkungan *Production*.
- *Rate limit* tambahan diterapkan pada *mutation endpoint* dan login authentication.
