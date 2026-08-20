/**
 * Indonesian National Holidays (Hari Libur Nasional & Cuti Bersama)
 * Source: SKB 3 Menteri (Menteri Agama, Menteri Ketenagakerjaan, Menteri PANRB)
 * Includes 2025, 2026, 2027 and annual fixed statutory holidays.
 */

export interface HolidayInfo {
  isHoliday: boolean;
  name?: string;
  isCutiBersama?: boolean;
  isSunday: boolean;
  isTanggalMerah: boolean;
}

// Map key format: "YYYY-MM-DD"
const HOLIDAYS_DATA: Record<string, { name: string; isCutiBersama?: boolean }> = {
  // ── 2025 ──
  "2025-01-01": { name: "Tahun Baru 2025 Masehi" },
  "2025-01-27": { name: "Isra Mi'raj Nabi Muhammad SAW" },
  "2025-01-28": { name: "Cuti Bersama Tahun Baru Imlek 2576 Kongzili", isCutiBersama: true },
  "2025-01-29": { name: "Tahun Baru Imlek 2576 Kongzili" },
  "2025-03-28": { name: "Cuti Bersama Hari Suci Nyepi", isCutiBersama: true },
  "2025-03-29": { name: "Hari Suci Nyepi (Tahun Baru Saka 1947)" },
  "2025-03-31": { name: "Hari Raya Idul Fitri 1446 H" },
  "2025-04-01": { name: "Hari Raya Idul Fitri 1446 H" },
  "2025-04-02": { name: "Cuti Bersama Idul Fitri 1446 H", isCutiBersama: true },
  "2025-04-03": { name: "Cuti Bersama Idul Fitri 1446 H", isCutiBersama: true },
  "2025-04-04": { name: "Cuti Bersama Idul Fitri 1446 H", isCutiBersama: true },
  "2025-04-07": { name: "Cuti Bersama Idul Fitri 1446 H", isCutiBersama: true },
  "2025-04-18": { name: "Wafat Yesus Kristus" },
  "2025-04-20": { name: "Kebangkitan Yesus Kristus (Paskah)" },
  "2025-05-01": { name: "Hari Buruh Internasional" },
  "2025-05-12": { name: "Hari Raya Waisak 2569 BE" },
  "2025-05-13": { name: "Cuti Bersama Hari Raya Waisak", isCutiBersama: true },
  "2025-05-29": { name: "Kenaikan Yesus Kristus" },
  "2025-05-30": { name: "Cuti Bersama Kenaikan Yesus Kristus", isCutiBersama: true },
  "2025-06-01": { name: "Hari Lahir Pancasila" },
  "2025-06-06": { name: "Hari Raya Idul Adha 1446 H" },
  "2025-06-09": { name: "Cuti Bersama Idul Adha 1446 H", isCutiBersama: true },
  "2025-06-27": { name: "Tahun Baru Islam 1447 H" },
  "2025-08-17": { name: "Proklamasi Kemerdekaan RI (HUT RI ke-80)" },
  "2025-09-05": { name: "Maulid Nabi Muhammad SAW" },
  "2025-12-25": { name: "Kelahiran Yesus Kristus (Hari Raya Natal)" },
  "2025-12-26": { name: "Cuti Bersama Hari Raya Natal", isCutiBersama: true },

  // ── 2026 (Tahun Ini) ──
  "2026-01-01": { name: "Tahun Baru 2026 Masehi" },
  "2026-01-16": { name: "Isra Mi'raj Nabi Muhammad SAW" },
  "2026-02-16": { name: "Cuti Bersama Tahun Baru Imlek", isCutiBersama: true },
  "2026-02-17": { name: "Tahun Baru Imlek 2577 Kongzili" },
  "2026-03-19": { name: "Hari Suci Nyepi (Tahun Baru Saka 1948)" },
  "2026-03-20": { name: "Hari Raya Idul Fitri 1447 H / Cuti Bersama Nyepi" },
  "2026-03-21": { name: "Hari Raya Idul Fitri 1447 H" },
  "2026-03-23": { name: "Cuti Bersama Idul Fitri 1447 H", isCutiBersama: true },
  "2026-03-24": { name: "Cuti Bersama Idul Fitri 1447 H", isCutiBersama: true },
  "2026-04-03": { name: "Wafat Yesus Kristus (Jumat Agung)" },
  "2026-04-05": { name: "Kebangkitan Yesus Kristus (Paskah)" },
  "2026-05-01": { name: "Hari Buruh Internasional" },
  "2026-05-14": { name: "Kenaikan Yesus Kristus" },
  "2026-05-27": { name: "Hari Raya Idul Adha 1447 H" },
  "2026-05-31": { name: "Hari Raya Waisak 2570 BE" },
  "2026-06-01": { name: "Hari Lahir Pancasila" },
  "2026-06-16": { name: "Tahun Baru Islam 1448 H" },
  "2026-08-17": { name: "Proklamasi Kemerdekaan RI (HUT RI ke-81)" },
  "2026-08-25": { name: "Maulid Nabi Muhammad SAW" },
  "2026-12-25": { name: "Kelahiran Yesus Kristus (Hari Raya Natal)" },
  "2026-12-26": { name: "Cuti Bersama Hari Raya Natal", isCutiBersama: true },

  // ── 2027 ──
  "2027-01-01": { name: "Tahun Baru 2027 Masehi" },
  "2027-01-05": { name: "Isra Mi'raj Nabi Muhammad SAW" },
  "2027-02-06": { name: "Tahun Baru Imlek 2578 Kongzili" },
  "2027-03-09": { name: "Hari Raya Idul Fitri 1448 H" },
  "2027-03-10": { name: "Hari Raya Idul Fitri 1448 H" },
  "2027-03-26": { name: "Wafat Yesus Kristus" },
  "2027-04-07": { name: "Hari Suci Nyepi (Tahun Baru Saka 1949)" },
  "2027-05-01": { name: "Hari Buruh Internasional" },
  "2027-05-06": { name: "Kenaikan Yesus Kristus" },
  "2027-05-16": { name: "Hari Raya Idul Adha 1448 H" },
  "2027-05-20": { name: "Hari Raya Waisak 2571 BE" },
  "2027-06-01": { name: "Hari Lahir Pancasila" },
  "2027-06-06": { name: "Tahun Baru Islam 1449 H" },
  "2027-08-15": { name: "Maulid Nabi Muhammad SAW" },
  "2027-08-17": { name: "Proklamasi Kemerdekaan RI (HUT RI ke-82)" },
  "2027-12-25": { name: "Kelahiran Yesus Kristus (Hari Raya Natal)" },
};

/**
 * Format a Date object into "YYYY-MM-DD" in local time
 */
export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is a recognized Indonesian National Holiday or Sunday
 */
export function getIndonesianHoliday(date: Date): HolidayInfo {
  const key = formatDateKey(date);
  const holiday = HOLIDAYS_DATA[key];
  const isSunday = date.getDay() === 0;
  const isHoliday = Boolean(holiday);
  const isTanggalMerah = isSunday || isHoliday;

  return {
    isHoliday,
    name: holiday?.name || (isSunday ? "Hari Minggu" : undefined),
    isCutiBersama: holiday?.isCutiBersama,
    isSunday,
    isTanggalMerah,
  };
}

/**
 * Fast boolean check if the date is Tanggal Merah
 */
export function isTanggalMerah(date: Date): boolean {
  return getIndonesianHoliday(date).isTanggalMerah;
}
