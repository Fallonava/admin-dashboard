import React, { useState } from 'react';
import type { Doctor } from '../types';
import SpecialistIcon from './SpecialistIcon';
import { getInitials, getSpecialtyBadgeClass, formatTimeSlot } from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';
import { Clock, Ticket, UserPlus, Star, Share2, Copy, MessageCircle, ChevronDown, Check } from 'lucide-react';

interface DoctorCardProps {
  doctor: Doctor;
  isFavorite?: boolean;
  onToggleFavorite?: (doctor: Doctor) => void;
  onSelectDoctor?: (doctor: Doctor) => void;
  onShare?: (doctor: Doctor) => void;
  onCopyQueue?: (code: string) => void;
}

export default function DoctorCard({
  doctor,
  isFavorite = false,
  onToggleFavorite,
  onSelectDoctor,
  onShare,
  onCopyQueue,
}: DoctorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const badgeClass = getSpecialtyBadgeClass(doctor.specialty);
  const statusUpper = (doctor.status || 'LIBUR').toUpperCase();
  const isPraktek = statusUpper === 'PRAKTEK';
  const isTerjadwal = statusUpper === 'TERJADWAL';
  const isCuti = statusUpper === 'CUTI';
  const isLibur = statusUpper === 'LIBUR';
  const isSelesai = statusUpper === 'SELESAI';
  const isOperasi = statusUpper === 'OPERASI';
  const isPenuh = statusUpper === 'PENUH';

  let statusLabel = 'Praktek';
  let statusClass = 'st-praktek';

  if (isPraktek) {
    statusLabel = 'Praktek';
    statusClass = 'st-praktek';
  } else if (isTerjadwal) {
    statusLabel = 'Terjadwal';
    statusClass = 'st-terjadwal';
  } else if (isCuti) {
    statusLabel = 'Cuti';
    statusClass = 'st-cuti';
  } else if (isSelesai) {
    statusLabel = 'Selesai';
    statusClass = 'st-selesai';
  } else if (isOperasi) {
    statusLabel = 'Operasi';
    statusClass = 'st-operasi';
  } else if (isPenuh) {
    statusLabel = 'Penuh';
    statusClass = 'st-penuh';
  } else {
    statusLabel = 'Libur';
    statusClass = 'st-libur';
  }

  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    if (onSelectDoctor) onSelectDoctor(doctor);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');
    if (onToggleFavorite) onToggleFavorite(doctor);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    if (onShare) onShare(doctor);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');
    const code = doctor.queueCode || 'POLI';
    if (onCopyQueue) {
      onCopyQueue(code);
    } else {
      navigator.clipboard?.writeText(code);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const toggleExpand = () => {
    triggerHaptic('light');
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`platter ${isCuti ? 'is-cuti' : ''} ${isExpanded ? 'is-expanded' : ''}`}
      onClick={toggleExpand}
    >
      {/* Platter Header */}
      <div className="platter-head-row">
        <div className="avatar-squircle-wrap">
          <div className="avatar-squircle">
            {doctor.image ? (
              <img src={doctor.image} alt={doctor.name} className="avatar-img" loading="lazy" />
            ) : (
              <span className="initials">{getInitials(doctor.name)}</span>
            )}
          </div>
          {isPraktek && <span className="avatar-live-pulse" title="Sedang Bertugas"></span>}
        </div>

        <div className="doc-info">
          <div className="doc-name-row">
            <h3 className="doc-name">{doctor.name}</h3>
          </div>
          <div className="doc-meta-row">
            <span className={`doc-spec-badge ${badgeClass}`}>
              <SpecialistIcon department={doctor.specialty} size={14} className="spec-icon-inline" />
              <span>{doctor.specialty}</span>
            </span>
          </div>
        </div>

        <div className="platter-top-actions">
          {/* Favorite Toggle Button */}
          <button
            type="button"
            className={`favorite-toggle-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleFavorite}
            title={isFavorite ? 'Hapus dari Favorit' : 'Simpan Dokter Favorit'}
          >
            <Star size={17} className={isFavorite ? 'fill-star' : ''} />
          </button>

          {/* Status Pill */}
          <div className={`status-pill ${statusClass}`}>
            <span className="status-dot"></span>
            <span>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Platter Body / Time Capsule */}
      <div className="platter-body-row">
        <div className="platter-time-capsule">
          <div className="time-capsule-slot">
            <Clock size={15} className="time-capsule-icon" />
            <div className="time-capsule-info">
              <span className="time-capsule-lbl">Jam Praktik</span>
              <span className="time-capsule-val">
                {formatTimeSlot(doctor.startTime, doctor.endTime, doctor.todayShift?.formattedTime)}
              </span>
            </div>
          </div>

          <div className="time-capsule-divider"></div>

          <div className="time-capsule-slot queue-slot" onClick={handleCopy} title="Salin Kode Antrean">
            <Ticket size={15} className="time-capsule-icon" />
            <div className="time-capsule-info">
              <span className="time-capsule-lbl">Kode Antrean</span>
              <span className="time-capsule-val flex-row-center">
                {doctor.queueCode || 'POLI'}
                {copiedCode ? <Check size={12} className="copy-check" /> : <Copy size={12} className="copy-hint" />}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details Drawer */}
      {isExpanded && (
        <div className="platter-expanded-drawer">
          <div className="drawer-info-grid">
            <div className="drawer-info-item">
              <span className="drawer-lbl">Kategori Poli</span>
              <span className="drawer-val">{doctor.category || 'Poliklinik Spesialis'}</span>
            </div>
            {doctor.registrationTime && (
              <div className="drawer-info-item">
                <span className="drawer-lbl">Waktu Registrasi</span>
                <span className="drawer-val">{doctor.registrationTime}</span>
              </div>
            )}
            {doctor.todayShift?.title && (
              <div className="drawer-info-item">
                <span className="drawer-lbl">Sesi Poliklinik</span>
                <span className="drawer-val">{doctor.todayShift.title}</span>
              </div>
            )}
            {doctor.activeLeave?.reason && (
              <div className="drawer-info-item full">
                <span className="drawer-lbl">Keterangan Cuti</span>
                <span className="drawer-val text-red">{doctor.activeLeave.reason}</span>
              </div>
            )}
            {doctor.activeLeave?.replacementDoctor && (
              <div className="drawer-info-item full">
                <span className="drawer-lbl">Dokter Pengganti</span>
                <span className="drawer-val text-blue">{doctor.activeLeave.replacementDoctor}</span>
              </div>
            )}
          </div>

          {/* Quick Doctor Action Bar inside Drawer */}
          <div className="drawer-quick-actions">
            <a
              href={`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20konsultasi%20jadwal%20${encodeURIComponent(
                doctor.name
              )}%20(${encodeURIComponent(doctor.specialty)})`}
              target="_blank"
              rel="noopener noreferrer"
              className="drawer-wa-btn"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
              }}
            >
              <MessageCircle size={15} />
              <span>Tanya CS Dokter</span>
            </a>

            <button
              type="button"
              className="drawer-share-btn"
              onClick={handleShare}
            >
              <Share2 size={15} />
              <span>Bagikan</span>
            </button>
          </div>
        </div>
      )}

      {/* Platter Action Tray */}
      {isPraktek && (
        <div className="platter-action-tray">
          <button className="platter-action-btn" onClick={handleBooking}>
            <UserPlus size={16} className="action-btn-icon" />
            <span>Daftar Online</span>
          </button>
        </div>
      )}
    </div>
  );
}
