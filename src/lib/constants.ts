/**
 * constants.ts
 * Menyimpan seluruh konstanta aplikasi untuk menghindari magic string.
 */

export const DOCTOR_STATUS = {
    BUKA: 'BUKA',
    PENUH: 'PENUH',
    TUTUP: 'TUTUP',
    CUTI: 'CUTI',
    TIDAK_PRAKTEK: 'TIDAK_PRAKTEK',
} as const;

export type DoctorStatusType = typeof DOCTOR_STATUS[keyof typeof DOCTOR_STATUS];

export const DOCTOR_CATEGORY = {
    UMUM: 'UMUM',
    GIGI: 'GIGI',
    KANDUNGAN: 'KANDUNGAN',
    MATA: 'MATA',
    ANAK: 'ANAK',
} as const;

export type DoctorCategoryType = typeof DOCTOR_CATEGORY[keyof typeof DOCTOR_CATEGORY];

export const ROLES = {
    MEMBER: 'member',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const CACHE_KEYS = {
    DOCTORS: '/api/doctors',
    SHIFTS: '/api/shifts',
    SETTINGS: '/api/settings',
    STATS: 'stats'
} as const;
