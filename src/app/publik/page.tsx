/**
 * /publik/page.tsx — Server Component
 *
 * Strategi Rendering: ISR (Incremental Static Regeneration)
 * - Data portal settings di-fetch server-side → dikirim sebagai HTML penuh ke browser
 * - Revalidasi otomatis setiap 60 detik → konten selalu fresh tanpa blocking load
 * - Metadata & JSON-LD di-render server-side → SEO maksimal
 */
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PublikClient from './PublikClient';

// ─── ISR: Halaman di-cache dan di-refresh setiap 60 detik ──────────────────
export const revalidate = 60;

// ─── FUNGSI HELPER: Ambil settings dari DB ─────────────────────────────────
async function getPortalSettings() {
  try {
    const settings = await prisma.settings.findFirst();
    return settings?.portalSettings ?? null;
  } catch {
    return null;
  }
}

// ─── SEO METADATA ──────────────────────────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  const ps = await getPortalSettings() as any;
  const hospitalName = ps?.general?.name || 'RS Siaga Medika Purbalingga';
  const address = ps?.general?.address || 'Jl. Letnan Jenderal S. Parman No.1, Purbalingga';
  const phone = ps?.general?.phone || '(0281) 895 111';

  const title = `${hospitalName} | Rumah Sakit Terpercaya di Purbalingga`;
  const description = `${hospitalName} — Layanan kesehatan komprehensif 24 jam di Purbalingga. UGD, Poliklinik Spesialis, Rawat Inap, dan MCU. ${address}. Hubungi: ${phone}.`;

  return {
    title,
    description,
    keywords: [
      'rumah sakit purbalingga',
      'siaga medika',
      'UGD purbalingga',
      'dokter spesialis purbalingga',
      'klinik purbalingga',
      'rawat inap purbalingga',
      'medical check up purbalingga',
      'bpjs purbalingga',
      hospitalName.toLowerCase(),
    ].join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'id_ID',
      siteName: hospitalName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: '/publik',
    },
  };
}

// ─── JSON-LD STRUCTURED DATA ────────────────────────────────────────────────
function HospitalJsonLd({ settings }: { settings: any }) {
  const ps = settings as any;
  const name = ps?.general?.name || 'RS Siaga Medika Purbalingga';
  const address = ps?.general?.address || 'Jl. Letnan Jenderal S. Parman No.1, Purbalingga';
  const phone = ps?.general?.phone || '(0281) 895 111';
  const email = ps?.general?.email || 'info@siagamedika.id';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Hospital',
    name,
    description: `Rumah sakit umum swasta terpercaya di Purbalingga dengan layanan UGD 24 jam, poliklinik spesialis, rawat inap, dan medical check up.`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: 'Purbalingga',
      addressRegion: 'Jawa Tengah',
      addressCountry: 'ID',
    },
    telephone: phone,
    email,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
        opens: '00:00',
        closes: '23:59',
        description: 'UGD buka 24 jam',
      },
    ],
    medicalSpecialty: [
      'Bedah Ortopedi',
      'Kardiologi',
      'Neurologi',
      'Onkologi',
      'Obstetri',
      'Pediatri',
    ],
    hasMap: `https://www.google.com/maps/search/${encodeURIComponent(address)}`,
    url: 'https://siagamedika.fallonava.my.id/publik',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── SERVER COMPONENT UTAMA ─────────────────────────────────────────────────
export default async function PublikPage() {
  // Fetch data langsung dari DB server-side (tidak ada round-trip ke API)
  const portalSettings = await getPortalSettings();

  return (
    <>
      {/* JSON-LD di head untuk Google Rich Results */}
      <HospitalJsonLd settings={portalSettings} />

      {/* Client Component menerima data awal dari server */}
      {/* initialSettings di-inject langsung → halaman tampil instan tanpa loading flicker */}
      <PublikClient initialSettings={portalSettings} />
    </>
  );
}
