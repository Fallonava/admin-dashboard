import React, { useState } from 'react';
import type { Doctor } from '../types';
import SpecialistIcon from './SpecialistIcon';
import { getInitials, getSpecialtyBadgeClass, formatTimeSlot } from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';
import { ChevronDown, Sparkles } from 'lucide-react';

interface DoctorCardProps {
  doctor: Doctor;
  onSelectDoctor?: (doctor: Doctor) => void;
}

export default function DoctorCard({ doctor, onSelectDoctor }: DoctorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const badgeClass = getSpecialtyBadgeClass(doctor.specialty);
  const isPraktek = doctor.status === 'PRAKTEK';
  const isCuti = doctor.status === 'CUTI';
  const isLibur = doctor.status === 'LIBUR';

  const statusLabel = isPraktek ? 'Praktek' : isCuti ? 'Cuti' : 'Libur';
  const statusClass = isPraktek ? 'st-praktek' : isCuti ? 'st-cuti' : 'st-libur';

  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    if (onSelectDoctor) onSelectDoctor(doctor);
  };

  const toggleExpand = () => {
    triggerHaptic('selection');
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`platter ${isCuti ? 'is-cuti' : ''} ${isExpanded ? 'is-expanded' : ''}`}
      onClick={toggleExpand}
      style={{ cursor: 'pointer' }}
    >
      {/* Platter Header */}
      <div className="platter-head-row">
        <div className="avatar-squircle-wrap">
          <div className="avatar-squircle">
            {doctor.image ? (
              <img src={doctor.image} alt={doctor.name} className="avatar-img" />
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

        <div className={`status-pill ${statusClass}`}>
          <span className="status-dot"></span>
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Platter Body / Time Capsule */}
      <div className="platter-body-row">
        <div className="platter-time-capsule">
          <div className="time-capsule-slot">
            <span className="time-capsule-icon">schedule</span>
            <div className="time-capsule-info">
              <span className="time-capsule-lbl">Jam Praktik</span>
              <span className="time-capsule-val">
                {formatTimeSlot(doctor.startTime, doctor.endTime, doctor.todayShift?.formattedTime)}
              </span>
            </div>
          </div>

          <div className="time-capsule-divider"></div>

          <div className="time-capsule-slot">
            <span className="time-capsule-icon">confirmation_number</span>
            <div className="time-capsule-info">
              <span className="time-capsule-lbl">Kode Antrean</span>
              <span className="time-capsule-val">{doctor.queueCode || 'POLI'}</span>
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
            {doctor.activeLeave?.reason && (
              <div className="drawer-info-item full">
                <span className="drawer-lbl">Keterangan Cuti</span>
                <span className="drawer-val text-red">{doctor.activeLeave.reason}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platter Action Tray */}
      {isPraktek && (
        <div className="platter-action-tray">
          <button className="platter-action-btn" onClick={handleBooking}>
            <span className="action-btn-icon">how_to_reg</span>
            <span>Daftar Online</span>
          </button>
        </div>
      )}
    </div>
  );
}
