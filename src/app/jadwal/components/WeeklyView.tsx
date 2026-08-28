import React, { useState, useMemo } from 'react';
import type { Doctor, Shift, LeaveRequest, DayDateItem } from '../types';
import SpecialistIcon from './SpecialistIcon';
import { getInitials, getSpecialtyBadgeClass, getWeeklyDateStrip, isDoctorOnLeave, formatTimeSlot } from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';
import { Search, CalendarX, Clock, ChevronRight } from 'lucide-react';

interface WeeklyViewProps {
  doctors: Doctor[];
  shifts: Shift[];
  leaves: LeaveRequest[];
  onSelectDoctor?: (doctor: Doctor) => void;
}

export default function WeeklyView({ doctors, shifts, leaves, onSelectDoctor }: WeeklyViewProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const dateStrip = useMemo<DayDateItem[]>(() => getWeeklyDateStrip(new Date()), []);
  const activeDateItem = dateStrip[selectedDayIdx] || dateStrip[0];

  const targetDayOfWeek = activeDateItem?.date?.getDay() ?? 0;

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch =
        !searchQuery ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const hasShift = shifts.some(
        (s) =>
          s.doctorId === doc.id &&
          (s.dayIdx === targetDayOfWeek || (targetDayOfWeek === 0 && s.dayIdx === 7))
      );

      return hasShift;
    });
  }, [doctors, shifts, targetDayOfWeek, searchQuery]);

  const handleSelectDay = (index: number) => {
    triggerHaptic('selection');
    setSelectedDayIdx(index);
  };

  return (
    <div className="weekly-view-container">
      {/* 7-Day Horizontal Date Strip */}
      <div className="weekly-date-strip-container mb-24">
        <div className="weekly-date-strip">
          {dateStrip.map((item, idx) => {
            const isSelected = idx === selectedDayIdx;
            return (
              <button
                key={item.dateStr}
                className={`weekly-day-btn ${isSelected ? 'active' : ''} ${item.isHoliday ? 'is-holiday' : ''}`}
                onClick={() => handleSelectDay(idx)}
              >
                <span className="date-day-name">{item.dayName}</span>
                <span className="date-number">{item.dayNum}</span>
                <span className="date-month-name">{item.monthName}</span>
                {item.isHoliday && <span className="holiday-dot"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="ios-search-bar mb-24">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="ios-search-input"
          placeholder="Cari dokter pada hari ini..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Selected Day Info Badge */}
      <div className="weekly-day-header-pill mb-24">
        <span className="weekly-day-title">
          {activeDateItem?.dayName}, {activeDateItem?.dayNum} {activeDateItem?.monthName}
        </span>
        {activeDateItem?.isHoliday && (
          <span className="weekly-holiday-tag">{activeDateItem?.holidayName || 'Libur Nasional'}</span>
        )}
      </div>

      {/* List of Doctors */}
      {filteredDoctors.length === 0 ? (
        <div className="ios-empty-state">
          <div className="ios-empty-coin">
            <CalendarX size={32} />
          </div>
          <div className="ios-empty-title">Tidak Ada Praktik</div>
          <div className="ios-empty-sub">
            Tidak ditemukan dokter yang bertugas pada hari {activeDateItem?.dayName}.
          </div>
        </div>
      ) : (
        <div className="weekly-pass-grid">
          {filteredDoctors.map((doc) => {
            const shift = shifts.find(
              (s) =>
                s.doctorId === doc.id &&
                (s.dayIdx === targetDayOfWeek || (targetDayOfWeek === 0 && s.dayIdx === 7))
            );

            const leave = isDoctorOnLeave(doc.id, activeDateItem.date, leaves);
            const isCuti = Boolean(leave);
            const badgeClass = getSpecialtyBadgeClass(doc.specialty);

            return (
              <div key={doc.id} className={`weekly-pass-card ${isCuti ? 'is-cuti' : ''}`}>
                <div className="wk-pass-header">
                  <span className={`doc-spec-badge ${badgeClass}`}>
                    <SpecialistIcon department={doc.specialty} size={14} className="spec-icon-inline" />
                    <span>{doc.specialty}</span>
                  </span>
                  <span className={`status-pill ${isCuti ? 'st-cuti' : 'st-praktek'}`}>
                    <span className="status-dot"></span>
                    <span>{isCuti ? 'Cuti' : 'Tersedia'}</span>
                  </span>
                </div>

                <div className="wk-hero-body">
                  <div className="avatar-squircle">
                    {doc.image ? (
                      <img src={doc.image} alt={doc.name} className="avatar-img" />
                    ) : (
                      <span className="initials">{getInitials(doc.name)}</span>
                    )}
                  </div>
                  <div className="wk-info-col">
                    <h4 className="wk-doc-name">{doc.name}</h4>
                    <span className="wk-doc-day-subtitle">
                      {shift?.title || `Praktik ${activeDateItem?.dayName}`}
                    </span>
                  </div>
                </div>

                {isCuti ? (
                  <div className="wk-cuti-banner">
                    <CalendarX size={20} className="wk-cuti-icon" />
                    <div className="wk-cuti-text">
                      <span className="wk-cuti-title">Dokter Sedang Cuti</span>
                      <span className="wk-cuti-sub">{leave?.reason || 'Izin Tidak Praktik'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="wk-ticket-capsule">
                    <div className="wk-schedule-slot">
                      <Clock size={15} className="time-capsule-icon" />
                      <div className="wk-slot-info">
                        <span className="wk-slot-lbl">Jam Praktik</span>
                        <span className="wk-slot-val">
                          {formatTimeSlot(doc.startTime, doc.endTime, shift?.formattedTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!isCuti && onSelectDoctor && (
                  <div className="wk-action-tray">
                    <button
                      className="wk-btn-action"
                      onClick={() => {
                        triggerHaptic('medium');
                        onSelectDoctor(doc);
                      }}
                    >
                      <span>Booking Antrean</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
