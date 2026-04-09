// ─── Resource Registry ───
// All resources that can be controlled by RBAC
export const RESOURCES = [
  { key: 'denah_live',      label: 'Monitor: Denah Live',       icon: 'LayoutDashboard' },
  { key: 'kontrol_status',  label: 'Operasi: Kontrol Status',   icon: 'Zap' },
  { key: 'schedules',       label: 'Akses Jadwal Dokter',       icon: 'Calendar' },
  { key: 'jadwal_petugas',  label: 'Akses Jadwal Petugas',      icon: 'CalendarDays' },
  { key: 'doctors',         label: 'Akses Dokter',              icon: 'Users' },
  { key: 'leaves',          label: 'Akses Jadwal Cuti',         icon: 'Palmtree' },
  { key: 'rekap_harian',    label: 'Rekap Harian',              icon: 'FileSpreadsheet' },
  { key: 'automation',      label: 'Sistem Otomatisasi',        icon: 'Bot' },
  { key: 'display_tv',      label: 'Pengaturan Layar TV',       icon: 'Tv' },
  { key: 'users',           label: 'Manajemen Pengguna',        icon: 'UserSquare2' },
  { key: 'access',          label: 'Manajemen Akses',           icon: 'Shield' },
  { key: 'settings',        label: 'Pengaturan Sistem',         icon: 'Settings' },
] as const;

export type ResourceKey = (typeof RESOURCES)[number]['key'];

// ─── Shared Types ───
export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  roleId: string | null;
  roleName: string | null;
  permissions: { resource: string; action: string }[];
}
