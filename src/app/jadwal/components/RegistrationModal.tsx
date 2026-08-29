import React, { useEffect, useState } from 'react';
import type { Doctor } from '../types';
import SpecialistIcon from './SpecialistIcon';
import { getInitials, getSpecialtyBadgeClass, formatTimeSlot } from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';
import { X, ChevronRight, MessageCircle, Smartphone, ShieldCheck, Copy, Check, Ticket, Sparkles } from 'lucide-react';

interface RegistrationModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, desc?: string) => void;
}

export default function RegistrationModal({ doctor, isOpen, onClose, onShowToast }: RegistrationModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !doctor) return null;

  const badgeClass = getSpecialtyBadgeClass(doctor.specialty);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');
    const code = doctor.queueCode || 'POLI';
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    if (onShowToast) {
      onShowToast('Kode Antrean Disalin', `Kode ${code} siap digunakan di Mobile JKN`);
    }
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAction = (type: string) => {
    triggerHaptic('medium');
  };

  return (
    <div className="ios-sheet-overlay" onClick={onClose}>
      <div className="ios-sheet spatial-visionos-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Grab Handle */}
        <div className="sheet-grab-bar" />

        {/* Modal Header */}
        <div className="ios-modal-header">
          <div className="ios-modal-title-group">
            <h3 className="ios-modal-title">Pendaftaran Poliklinik</h3>
            <span className="ios-modal-sub">Pilih jalur registrasi online resmi</span>
          </div>
          <button
            type="button"
            className="ios-modal-close-btn"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label="Tutup"
          >
            <X size={15} />
          </button>
        </div>

        {/* Doctor Summary Context Platter */}
        <div className="booking-doc-context">
          <div className="avatar-squircle">
            {doctor.image ? (
              <img src={doctor.image} alt={doctor.name} className="avatar-img" />
            ) : (
              <span className="initials">{getInitials(doctor.name)}</span>
            )}
          </div>
          <div className="booking-doc-info">
            <h4 className="booking-doc-name">{doctor.name}</h4>
            <div className="booking-doc-spec">
              <span className={`doc-spec-badge ${badgeClass}`}>
                <SpecialistIcon department={doctor.specialty} size={11} className="spec-icon-inline" />
                <span>{doctor.specialty}</span>
              </span>
            </div>
            <div className="booking-doc-time-row">
              <span className="booking-doc-time">
                {formatTimeSlot(doctor.startTime, doctor.endTime, doctor.todayShift?.formattedTime)}
              </span>
              {doctor.queueCode && (
                <button
                  type="button"
                  className="modal-copy-queue-btn"
                  onClick={handleCopyCode}
                  title="Salin Kode Antrean"
                >
                  <Ticket size={11} />
                  <span>{doctor.queueCode}</span>
                  {copiedCode ? <Check size={10} className="text-green" /> : <Copy size={10} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3 Action Tiles with iOS Specular Rim */}
        <div className="ios-action-list">
          {/* BPJS Mobile JKN */}
          <a
            href="https://play.google.com/store/apps/details?id=app.bpjs.mobile"
            target="_blank"
            rel="noopener noreferrer"
            className="ios-action-tile"
            onClick={() => handleAction('bpjs')}
          >
            <div className="ios-action-icon bpjs">
              <ShieldCheck size={22} />
            </div>
            <div className="ios-action-content">
              <div className="ios-action-title-row">
                <span className="ios-action-title">Daftar Pasien BPJS</span>
                <span className="ios-action-tag bpjs">Mobile JKN</span>
              </div>
              <span className="ios-action-desc">
                Ambil nomor antrean rujukan BPJS Kesehatan via aplikasi resmi Mobile JKN
              </span>
            </div>
            <ChevronRight size={16} className="ios-action-chevron" />
          </a>

          {/* Non-BPJS Nuha App */}
          <a
            href="https://play.google.com/store/apps/details?id=com.nuha.nuha"
            target="_blank"
            rel="noopener noreferrer"
            className="ios-action-tile"
            onClick={() => handleAction('nuha')}
          >
            <div className="ios-action-icon non-bpjs">
              <Smartphone size={22} />
            </div>
            <div className="ios-action-content">
              <div className="ios-action-title-row">
                <span className="ios-action-title">Daftar Pasien Umum</span>
                <span className="ios-action-tag non-bpjs">Nuha App</span>
              </div>
              <span className="ios-action-desc">
                Booking antrean pasien umum, asuransi rekanan & perusahaan via aplikasi Nuha
              </span>
            </div>
            <ChevronRight size={16} className="ios-action-chevron" />
          </a>

          {/* WhatsApp CS */}
          <a
            href={`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20mendaftar%20atau%20konsultasi%20jadwal%20${encodeURIComponent(
              doctor.name
            )}%20(${encodeURIComponent(doctor.specialty)})`}
            target="_blank"
            rel="noopener noreferrer"
            className="ios-action-tile"
            onClick={() => handleAction('wa')}
          >
            <div className="ios-action-icon wa">
              <MessageCircle size={22} />
            </div>
            <div className="ios-action-content">
              <div className="ios-action-title-row">
                <span className="ios-action-title">CS WhatsApp Pendaftaran</span>
                <span className="ios-action-tag wa">WhatsApp</span>
              </div>
              <span className="ios-action-desc">
                Konsultasi pendaftaran langsung dengan customer service resmi via WhatsApp
              </span>
            </div>
            <ChevronRight size={16} className="ios-action-chevron" />
          </a>
        </div>
      </div>
    </div>
  );
}
