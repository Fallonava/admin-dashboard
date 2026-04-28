import { prisma } from '@/lib/prisma';
import DokterClient from './DokterClient';
import type { Metadata } from 'next';

// Revalidate page cache every 1 hour for SEO schema (live data uses SWR)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Direktori Dokter | RS Siaga Medika',
  description: 'Temukan dokter spesialis terbaik di RS Siaga Medika Purbalingga. Lihat jadwal praktek, spesialisasi, dan status dokter secara real-time.',
};

export default async function DokterPage() {
  // Fetch for SEO JSON-LD only
  const doctors = await prisma.doctor.findMany({
    select: { name: true, specialty: true, image: true },
  });

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: 'RS Siaga Medika Purbalingga',
    medicalSpecialty: Array.from(new Set(doctors.map(d => d.specialty))),
    employee: doctors.map(doc => ({
      '@type': 'Physician',
      name: doc.name,
      medicalSpecialty: doc.specialty,
      image: doc.image || 'https://siagamedika.fallonava.my.id/logo-rs.png',
      worksFor: {
        '@type': 'MedicalOrganization',
        name: 'RS Siaga Medika Purbalingga'
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <DokterClient />
    </>
  );
}
