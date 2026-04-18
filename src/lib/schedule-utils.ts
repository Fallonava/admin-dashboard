/**
 * schedule-utils.ts
 *
 * Shared utility functions untuk kalkulasi pola rutinitas jadwal dokter.
 * Digunakan di:
 * - automation.ts (backend automasi status dokter)
 * - scheduler.ts (event scheduler / timer)
 * - Frontend components (RealtimeCalendar, DoctorCard, dll)
 *
 * Memastikan logika ganjil/genap KONSISTEN di seluruh lapisan sistem.
 */

/**
 * Menghitung nomor minggu dalam bulan untuk tanggal tertentu.
 * Week 1 = tanggal 1–7, Week 2 = tanggal 8–14, Week 3 = tanggal 15–21,
 * Week 4 = tanggal 22–28, Week 5 = tanggal 29–31.
 *
 * @param date Objek Date yang ingin dievaluasi.
 * @returns Nomor minggu dalam bulan (1–5).
 */
export function getWeekOfMonth(date: Date): number {
    return Math.ceil(date.getDate() / 7);
}

/**
 * Mengecek apakah shift aktif untuk tanggal tertentu berdasarkan pola rutinitas
 * yang disimpan di field `extra` pada model Shift.
 *
 * Nilai `extra` yang didukung:
 * - `undefined` / `null` / `''` → Setiap Minggu (selalu aktif)
 * - `'odd_weeks'`              → Minggu Ganjil (minggu 1, 3, 5)
 * - `'even_weeks'`             → Minggu Genap (minggu 2, 4)
 *
 * @param extra Nilai field `extra` pada shift.
 * @param date  Tanggal yang ingin dicek.
 * @returns `true` jika shift harus aktif pada tanggal tersebut, `false` jika tidak.
 */
export function isShiftActiveForDate(
    extra: string | null | undefined,
    date: Date
): boolean {
    // Tidak ada pola khusus = aktif setiap minggu
    if (!extra) return true;

    const weekOfMonth = getWeekOfMonth(date);

    // odd_weeks = minggu ganjil (1, 3, 5) → sembunyikan di minggu genap
    if (extra === 'odd_weeks' && weekOfMonth % 2 === 0) return false;

    // even_weeks = minggu genap (2, 4) → sembunyikan di minggu ganjil
    if (extra === 'even_weeks' && weekOfMonth % 2 !== 0) return false;

    return true;
}

/**
 * Mengembalikan label pola rutinitas yang ramah pengguna.
 *
 * @param extra Nilai field `extra`.
 * @returns Label string yang dapat ditampilkan ke user.
 */
export function getRoutineLabel(extra: string | null | undefined): string {
    if (extra === 'odd_weeks') return 'Minggu Ganjil';
    if (extra === 'even_weeks') return 'Minggu Genap';
    return 'Setiap Minggu';
}
