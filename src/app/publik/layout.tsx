import PublikNavbar from './PublikNavbar';

export const metadata = {
  title: 'RS Siaga Medika Purbalingga | Portal Pasien',
  description: 'Portal resmi RS Siaga Medika Purbalingga. Cari jadwal dokter, fasilitas, dan konsultasi AI secara real-time.',
};

export default function PublikLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublikNavbar />
      <main>{children}</main>
    </>
  );
}
