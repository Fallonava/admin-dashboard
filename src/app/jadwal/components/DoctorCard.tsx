import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import type { Doctor } from '../types';
import SpecialistIcon from './SpecialistIcon';
import { getInitials, getSpecialtyBadgeClass, formatTimeSlot } from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';
import { X, 
  Clock,
  Ticket,
  UserPlus,
  Star,
  Share2,
  Copy,
  MessageCircle,
  Check,
  Calendar,
  CalendarOff,
  ChevronDown,
  Sparkles,
 } from 'lucide-react';

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
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      triggerHaptic('success');
      setShowContextMenu(true);
    }, 450);
    setPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  const badgeClass = getSpecialtyBadgeClass(doctor.specialty);
  const statusUpper = (doctor.status || 'LIBUR').toUpperCase();
  const isPraktek = statusUpper === 'PRAKTEK';
  const isTerjadwal = statusUpper === 'TERJADWAL';
  const isCuti = statusUpper.includes('CUTI') || Boolean(doctor.activeLeave);

  let statusLabel = 'Praktek';
  let statusClass = 'st-praktek';

  if (isPraktek) {
    statusLabel = 'Praktik';
    statusClass = 'st-praktek';
  } else if (isTerjadwal) {
    statusLabel = 'Terjadwal';
    statusClass = 'st-terjadwal';
  } else if (isCuti) {
    statusLabel = 'Cuti';
    statusClass = 'st-cuti';
  } else {
    statusLabel = 'Tersedia';
    statusClass = 'st-praktek';
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

  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('success');
    const title = `Praktik ${doctor.name} (${doctor.specialty})`;
    const location = 'RSU Siaga Medika Purbalingga';
    const description = `Jadwal Dokter ${doctor.name} - ${doctor.specialty}. Jam: ${doctor.todayShift?.formattedTime || 'Sesuai Jadwal'}. Kode: ${doctor.queueCode || 'POLI'}.`;

    const now = new Date();
    const startStr = now.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    const endStr = new Date(now.getTime() + 2 * 3600000).toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RSU Siaga Medika//Jadwal Dokter//ID',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Pengingat Praktik: ${title}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jadwal_${doctor.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = () => {
    triggerHaptic('light');
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`platter ios27-compact-card ${isCuti ? 'is-cuti' : ''} ${isExpanded ? 'is-expanded' : ''}`}
      onClick={toggleExpand}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        triggerHaptic('success');
        setShowContextMenu(true);
      }}
    >
      {/* Top Specular Glass Sheen */}
      <span className="card-top-specular" aria-hidden="true" />

      {/* Card Main Horizontal Row (Ultra-Compact) */}
      <div className="card-main-content">
        {/* 1. Squircle Avatar (Adopted from tv.html 3D Ceramic Squircle) */}
        <div className="card-avatar-col">
          <div className="avatar-squircle">
            {doctor.image ? (
              <img src={doctor.image} alt={doctor.name} className="avatar-img" loading="lazy" />
            ) : (
              <SpecialistIcon department={doctor.specialty} size={24} className="avatar-spec-icon" />
            )}
          </div>
          {isPraktek && <span className="avatar-live-pulse" title="Sedang Bertugas Sekarang" />}
        </div>

        {/* 2. Doctor Info Center */}
        <div className="card-info-col">
          <div className="card-name-row">
            <h3 className="doc-name">{doctor.name}</h3>
          </div>

          <div className="card-sub-row">
            <span className={`doc-spec-badge ${badgeClass}`}>
              <SpecialistIcon department={doctor.specialty} size={12} className="spec-icon-inline" />
              <span>{doctor.specialty}</span>
            </span>

            {/* Status Pill moved here for clean aesthetics */}
            <span className={`status-pill compact-status ${statusClass}`}>
              <span className="status-dot" />
              <span>{statusLabel}</span>
            </span>
          </div>

          <div className="card-time-row">
            {isCuti ? (
              <>
                <CalendarOff size={11.5} className="time-icon text-red flex-shrink-0" />
                <span className="card-cuti-reason">
                  {doctor.activeLeave?.reason || 'Izin Tidak Praktik'}
                </span>
              </>
            ) : (
              <>
                <Clock size={12} className="time-icon text-blue flex-shrink-0" />
                <span className="card-time-val">
                  {formatTimeSlot(doctor.startTime, doctor.endTime, doctor.todayShift?.formattedTime)}
                  {doctor.registrationTime && (
                    <span className="card-reg-text" title="Waktu Pemanggilan Registrasi">
                      {' '}• Reg: {doctor.registrationTime}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 3. Action Capsule Right */}
        <div className="card-action-col">
          <button
            type="button"
            className={`card-fav-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleFavorite}
            title={isFavorite ? 'Hapus Favorit' : 'Tambah Favorit'}
            aria-label="Simpan Dokter Favorit"
          >
            <Star size={14} className={isFavorite ? 'fill-star' : ''} />
          </button>

          {!isCuti ? (
            <button
              type="button"
              className="card-book-pill-btn"
              onClick={handleBooking}
              title="Daftar Online"
              aria-label="Daftar Online"
            >
              <Sparkles size={11.5} />
              <span>Daftar</span>
            </button>
          ) : (
            <a
              href={`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20bertanya%20jadwal%20pengganti%20${encodeURIComponent(
                doctor.name
              )}%20(${encodeURIComponent(doctor.specialty)})`}
              target="_blank"
              rel="noopener noreferrer"
              className="card-wa-pill-btn"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
              }}
              title="Tanya CS WhatsApp"
              aria-label="Tanya CS WhatsApp"
            >
              <MessageCircle size={11.5} />
              <span>CS WA</span>
            </a>
          )}
        </div>
      </div>

      {/* iOS 27 Bottom Sheet Modal */}
      {isExpanded && typeof document !== 'undefined' ? createPortal(
        <div className="ios-sheet-backdrop" onClick={(e) => { e.stopPropagation(); toggleExpand(); }}>
          <div className="ios-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ios-sheet-drag-handle" />
            <div className="ios-sheet-header">
              <h3 className="ios-sheet-title">{doctor.name}</h3>
              <button className="ios-close-btn" onClick={(e) => { e.stopPropagation(); toggleExpand(); }}>
                <X size={18} />
              </button>
            </div>
            <div className="drawer-metric-list">
            {doctor.queueCode && (
              <div className="drawer-metric-row">
                <span className="drawer-metric-lbl">Kode Antrean Tiket</span>
                <span className="drawer-metric-val font-mono font-bold text-blue">{doctor.queueCode}</span>
              </div>
            )}
            <div className="drawer-metric-row">
              <span className="drawer-metric-lbl">Kategori Poliklinik</span>
              <span className="drawer-metric-val">{doctor.category || 'Poliklinik Spesialis Terpadu'}</span>
            </div>
            {doctor.registrationTime && (
              <div className="drawer-metric-row">
                <span className="drawer-metric-lbl">Waktu Registrasi (Pemanggilan)</span>
                <span className="drawer-metric-val font-semibold text-blue">{doctor.registrationTime} WIB</span>
              </div>
            )}
            {doctor.todayShift?.title && (
              <div className="drawer-metric-row">
                <span className="drawer-metric-lbl">Sesi Poliklinik</span>
                <span className="drawer-metric-val">{doctor.todayShift.title}</span>
              </div>
            )}
            {doctor.activeLeave?.reason && (
              <div className="drawer-metric-row alert-leave">
                <span className="drawer-metric-lbl">Keterangan Cuti</span>
                <span className="drawer-metric-val text-red">{doctor.activeLeave.reason}</span>
              </div>
            )}
            {doctor.activeLeave?.replacementDoctor && (
              <div className="drawer-metric-row alert-replacement">
                <span className="drawer-metric-lbl">Dokter Pengganti</span>
                <span className="drawer-metric-val text-blue">{doctor.activeLeave.replacementDoctor}</span>
              </div>
            )}
          </div>

          {/* Quick Actions inside Drawer */}
          <div className="drawer-quick-actions">
            <a
              href={`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20konsultasi%20jadwal%20${encodeURIComponent(
                doctor.name
              )}%20(${encodeURIComponent(doctor.specialty)})`}
              target="_blank"
              rel="noopener noreferrer"
              className="ios-large-action-btn btn-whatsapp-ios"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
              }}
            >
              <MessageCircle size={18} />
              <span>Tanya CS WhatsApp</span>
            </a>

            <button
              type="button"
              className="ios-large-action-btn btn-primary-ios"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCalendar(e);
              }}
              title="Simpan Jadwal ke Kalender HP"
            >
              <Calendar size={18} />
              <span>Simpan ke Kalender</span>
            </button>

            <button
              type="button"
              className="ios-large-action-btn btn-secondary-ios"
              onClick={(e) => {
                e.stopPropagation();
                handleShare(e);
              }}
              title="Bagikan Informasi Dokter"
            >
              <Share2 size={18} />
              <span>Bagikan Dokter</span>
            </button>
          </div>
        </div>, document.body) : null}

      {/* iOS 27 Haptic Touch Context Menu */}
      {showContextMenu && typeof document !== 'undefined' ? createPortal(
        <div className="ios-context-backdrop" onClick={(e) => { e.stopPropagation(); setShowContextMenu(false); }}>
          <div className="ios-context-card-clone">
            <div className="card-main-content">
              <div className="card-avatar-col">
                <div className="avatar-squircle">
                  {doctor.image ? (
                    <img src={doctor.image} alt={doctor.name} className="avatar-img" />
                  ) : (
                    <SpecialistIcon department={doctor.specialty} size={24} className="avatar-spec-icon" />
                  )}
                </div>
              </div>
              <div className="card-info-col">
                <h3 className="doc-name">{doctor.name}</h3>
                <span className="doc-spec-badge text-blue">{doctor.specialty}</span>
              </div>
            </div>
          </div>
          <div className="ios-context-menu" onClick={(e) => e.stopPropagation()}>
            <button className="ios-context-menu-item" onClick={(e) => { setShowContextMenu(false); handleFavorite(e); }}>
              <span>{isFavorite ? 'Hapus dari Favorit' : 'Jadikan Favorit'}</span>
              <Star size={16} className={isFavorite ? 'fill-star text-yellow' : ''} />
            </button>
            <button className="ios-context-menu-item" onClick={(e) => { setShowContextMenu(false); handleAddToCalendar(e); }}>
              <span>Tambah ke Kalender</span>
              <Calendar size={16} />
            </button>
            <button className="ios-context-menu-item" onClick={(e) => { setShowContextMenu(false); handleShare(e); }}>
              <span>Bagikan Dokter</span>
              <Share2 size={16} />
            </button>
          </div>
        </div>, document.body
      ) : null}
    </div>
  );
}
