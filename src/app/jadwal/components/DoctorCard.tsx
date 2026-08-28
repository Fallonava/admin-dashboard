import React from 'react';
import type { Doctor } from '../types';
import SpecialistIcon from './SpecialistIcon';
import { getInitials, getSpecialtyBadgeClass, formatTimeSlot } from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';

interface DoctorCardProps {
  doctor: Doctor;
  onSelectDoctor?: (doctor: Doctor) => void;
}

export default function DoctorCard({ doctor, onSelectDoctor }: DoctorCardProps) {
  const badgeClass = getSpecialtyBadgeClass(doctor.specialty);
  const isPraktek = doctor.status === 'PRAKTEK';
  const isCuti = doctor.status === 'CUTI';
  const isLibur = doctor.status === 'LIBUR';

  const statusLabel = isPraktek ? 'Praktek' : isCuti ? 'Cuti' : 'Libur';
  const statusClass = isPraktek ? 'st-praktek' : isCuti ? 'st-cuti' : 'st-libur';

  const handleBooking = () => {
    triggerHaptic('medium');
    if (onSelectDoctor) onSelectDoctor(doctor);
  };

  return (
    <div className={`platter ${isCuti ? 'is-cuti' : ''}`}>
      {/* Platter Header */}
      <div className="platter-head-row">
        <div className="avatar-squircle">
          {doctor.image ? (
            <img src={doctor.image} alt={doctor.name} className="avatar-img" />
          ) : (
            <span className="initials">{getInitials(doctor.name)}</span>
          )}
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
