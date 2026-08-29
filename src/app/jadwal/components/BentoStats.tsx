import React from 'react';
import type { Doctor } from '../types';
import { triggerHaptic } from '../lib/haptics';
import { Activity, Clock, CalendarX, Stethoscope } from 'lucide-react';

interface BentoStatsProps {
  doctors: Doctor[];
  onFilterStatus?: (status: 'all' | 'praktek' | 'terjadwal' | 'cuti') => void;
  activeStatus?: string;
}

export default function BentoStats({ doctors, onFilterStatus, activeStatus }: BentoStatsProps) {
  const presentCount = doctors.filter((d) => (d.status || '').toUpperCase() === 'PRAKTEK').length;
  const scheduledCount = doctors.filter((d) => (d.status || '').toUpperCase() === 'TERJADWAL').length;
  const leaveCount = doctors.filter((d) => (d.status || '').toUpperCase().includes('CUTI')).length;
  const uniqueSpecialties = new Set(doctors.map((d) => d.specialty).filter(Boolean)).size;

  return (
    <div className="ios27-glance-capsule-bar mb-20" role="region" aria-label="Ringkasan Status Hari Ini">
      <div className="glance-scroll-track">
        {/* 1. Sedang Praktik */}
        <div
          className={`glance-metric-chip chip-praktek ${activeStatus === 'praktek' ? 'selected' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            onFilterStatus?.('praktek');
          }}
          title="Filter dokter yang sedang praktik sekarang"
        >
          <span className="glance-pulse-dot" />
          <span className="glance-chip-num">{presentCount}</span>
          <span className="glance-chip-label">Praktik Sekarang</span>
        </div>

        {/* 2. Terjadwal Nanti */}
        <div
          className={`glance-metric-chip chip-terjadwal ${activeStatus === 'terjadwal' ? 'selected' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            onFilterStatus?.('terjadwal');
          }}
          title="Filter dokter yang terjadwal nanti hari ini"
        >
          <Clock size={13} className="glance-chip-icon text-blue" />
          <span className="glance-chip-num">{scheduledCount}</span>
          <span className="glance-chip-label">Terjadwal</span>
        </div>

        {/* 3. Sedang Cuti */}
        <div
          className={`glance-metric-chip chip-cuti ${activeStatus === 'cuti' ? 'selected' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            onFilterStatus?.('cuti');
          }}
          title="Filter dokter yang sedang cuti hari ini"
        >
          <CalendarX size={13} className="glance-chip-icon text-red" />
          <span className="glance-chip-num">{leaveCount}</span>
          <span className="glance-chip-label">Cuti</span>
        </div>

        {/* 4. Layanan Poliklinik */}
        <div
          className="glance-metric-chip chip-layanan"
          onClick={() => {
            triggerHaptic('light');
            onFilterStatus?.('all');
          }}
          title="Total poliklinik spesialis aktif"
        >
          <Stethoscope size={13} className="glance-chip-icon text-purple" />
          <span className="glance-chip-num">{uniqueSpecialties}</span>
          <span className="glance-chip-label">Poliklinik</span>
        </div>
      </div>
    </div>
  );
}
