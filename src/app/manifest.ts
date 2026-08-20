import { type MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SIMED — Sistem Manajemen Medis & TV Display',
    short_name: 'SIMED',
    description: 'Sistem Informasi Manajemen Jadwal Medis dan Smart TV Display Terintegrasi',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
