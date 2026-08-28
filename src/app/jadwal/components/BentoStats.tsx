import React from 'react';
import type { Doctor } from '../types';
import { CheckCircle2, CalendarX, Stethoscope, Activity } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

interface BentoStatsProps {
  doctors: Doctor[];
}

export default function BentoStats({ doctors }: BentoStatsProps) {
  const presentCount = doctors.filter((d) => (d.status || '').toUpperCase() === 'PRAKTEK').length;
  const totalCount = doctors.length;
  const leaveCount = doctors.filter((d) => (d.status || '').toUpperCase().includes('CUTI')).length;
  
  // Count unique specialties
  const uniqueSpecialties = new Set(doctors.map((d) => d.specialty).filter(Boolean)).size;
  const presentPercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const handleTileClick = () => {
    triggerHaptic('light');
  };

  return (
    <div className="bento-grid mb-24">
      {/* 1. Dokter Praktek Tile */}
      <div className="bento-card-main bento-liquid-tile" onClick={handleTileClick}>
        <div className="bento-card-top">
          <div className="bento-icon-coin praktek">
            <CheckCircle2 size={18} />
          </div>
          <span className="bento-status-pill praktek">
            <span className="brand-live-pulse-dot inline-pulse"></span>
            <span>Buka</span>
          </span>
        </div>
        <div className="bento-num-wrap">
          <span className="bento-num">{presentCount}</span>
          <span className="bento-unit">Poli</span>
        </div>
        <div className="bento-text-group">
          <span className="bento-title">Praktik Hari Ini</span>
          <span className="bento-sub">Siap melayani pasien</span>
        </div>
      </div>

      {/* 2. Dokter Cuti Tile */}
      <div className="bento-card-main bento-liquid-tile" onClick={handleTileClick}>
        <div className="bento-card-top">
          <div className="bento-icon-coin cuti">
            <CalendarX size={18} />
          </div>
          <span className="bento-status-pill cuti">Cuti</span>
        </div>
        <div className="bento-num-wrap">
          <span className="bento-num text-red">{leaveCount}</span>
          <span className="bento-unit">Dokter</span>
        </div>
        <div className="bento-text-group">
          <span className="bento-title">Sedang Cuti</span>
          <span className="bento-sub">Izin / Sakit / Tugas</span>
        </div>
      </div>

      {/* 3. Total Spesialisasi */}
      <div className="bento-card-main bento-liquid-tile" onClick={handleTileClick}>
        <div className="bento-card-top">
          <div className="bento-icon-coin spec">
            <Stethoscope size={18} />
          </div>
          <span className="bento-status-pill spec">{totalCount} Dokter</span>
        </div>
        <div className="bento-num-wrap">
          <span className="bento-num text-blue">{uniqueSpecialties}</span>
          <span className="bento-unit">Layanan</span>
        </div>
        <div className="bento-text-group">
          <span className="bento-title">Total Spesialis</span>
          <span className="bento-sub">Poliklinik terpadu</span>
        </div>
      </div>

      {/* 4. Kapasitas & Tingkat Kehadiran Bar */}
      <div className="bento-card-main bento-liquid-tile" onClick={handleTileClick}>
        <div className="bento-card-top">
          <div className="bento-icon-coin rate">
            <Activity size={18} />
          </div>
          <span className="bento-status-pill rate">{presentPercentage}% Aktif</span>
        </div>
        <div className="bento-num-wrap">
          <span className="bento-num text-emerald">{presentPercentage}%</span>
          <span className="bento-unit">Rasio</span>
        </div>
        <div className="bento-text-group">
          <div className="bento-progress-track">
            <div
              className="bento-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, presentPercentage))}%` }}
            ></div>
          </div>
          <span className="bento-sub">Tingkat kehadiran hari ini</span>
        </div>
      </div>
    </div>
  );
}
