import React, { useState, useMemo } from 'react';
import type { Doctor, Shift, LeaveRequest, DayDateItem } from '../types';
import SpecialistIcon from './SpecialistIcon';
import { getInitials, getSpecialtyBadgeClass, getWeeklyDateStrip, isDoctorOnLeave, formatTimeSlot, isShiftActiveForDate } from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';
import { Search, CalendarX, Clock, ChevronRight, MessageCircle, Filter, CalendarCheck } from 'lucide-react';

interface WeeklyViewProps {
  doctors: Doctor[];
  shifts: Shift[];
  leaves: LeaveRequest[];
  onSelectDoctor?: (doctor: Doctor) => void;
}

export default function WeeklyView({ doctors, shifts, leaves, onSelectDoctor }: WeeklyViewProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  const dateStrip = useMemo<DayDateItem[]>(() => getWeeklyDateStrip(new Date()), []);
  const activeDateItem = dateStrip[selectedDayIdx] || dateStrip[0];

  const targetDate = activeDateItem?.date || new Date();
  const targetWibTime = new Date(targetDate.getTime() + 7 * 60 * 60 * 1000);
  const targetDayIdx = (targetWibTime.getUTCDay() + 6) % 7; // 0=Senin ... 6=Minggu
  const targetDateStr = activeDateItem?.dateStr || targetWibTime.toISOString().slice(0, 10);

  // Extract list of all unique specialties for filter chips
  const uniqueSpecialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // Specialty Filter
      if (selectedSpecialty !== 'all' && doc.specialty !== selectedSpecialty) {
        return false;
      }

      // Search Filter
      const matchesSearch =
        !searchQuery ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Check shift matching with admin parity and disabled dates
      const hasShift = shifts.some(
        (s) =>
          s.doctorId === doc.id &&
          s.dayIdx === targetDayIdx &&
          !(s.disabledDates || []).includes(targetDateStr) &&
          isShiftActiveForDate(s.extra, targetWibTime)
      );

      return hasShift;
    });
  }, [doctors, shifts, targetDayIdx, targetDateStr, targetWibTime, searchQuery, selectedSpecialty]);

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
                type="button"
                className={`weekly-day-btn ${isSelected ? 'active' : ''} ${item.isHoliday ? 'is-holiday' : ''}`}
                onClick={() => handleSelectDay(idx)}
              >
                <span className="date-day-name">{item.dayName}</span>
                <span className="date-number">{item.dayNum}</span>
                <span className="date-month-name">{item.monthName}</span>
                {item.isHoliday && <span className="holiday-dot" title={item.holidayName}></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="ios-search-bar mb-16">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="ios-search-input"
          placeholder="Cari dokter pada hari ini..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
            ×
          </button>
        )}
      </div>

      {/* Specialty Filter Horizontal Strip */}
      <div className="category-chips-row mb-24">
        <button
          type="button"
          className={`category-chip ${selectedSpecialty === 'all' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            setSelectedSpecialty('all');
          }}
        >
          Semua Spesialis
        </button>
        {uniqueSpecialties.map((spec) => (
          <button
            key={spec}
            type="button"
            className={`category-chip ${selectedSpecialty === spec ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('selection');
              setSelectedSpecialty(spec);
            }}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Selected Day Header Pill */}
      <div className="weekly-day-header-pill mb-24">
        <div className="weekly-day-title-wrap">
          <CalendarCheck size={16} className="text-blue" />
          <span className="weekly-day-title">
            {activeDateItem?.dayName}, {activeDateItem?.dayNum} {activeDateItem?.monthName}
          </span>
        </div>
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
            Tidak ditemukan dokter yang bertugas pada hari {activeDateItem?.dayName}
            {selectedSpecialty !== 'all' ? ` untuk poli ${selectedSpecialty}` : ''}.
          </div>
          {(selectedSpecialty !== 'all' || searchQuery) && (
            <button
              type="button"
              className="empty-reset-btn"
              onClick={() => {
                setSelectedSpecialty('all');
                setSearchQuery('');
              }}
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="weekly-pass-grid">
          {filteredDoctors.map((doc) => {
            const shift = shifts.find(
              (s) =>
                s.doctorId === doc.id &&
                s.dayIdx === targetDayIdx &&
                !(s.disabledDates || []).includes(targetDateStr) &&
                isShiftActiveForDate(s.extra, targetWibTime)
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
                      <img src={doc.image} alt={doc.name} className="avatar-img" loading="lazy" />
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
                      {leave?.replacementDoctor && (
                        <span className="wk-cuti-replacement">
                          Pengganti: {leave.replacementDoctor}
                        </span>
                      )}
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

                <div className="wk-action-tray">
                  {!isCuti && onSelectDoctor && (
                    <button
                      type="button"
                      className="wk-btn-action"
                      onClick={() => {
                        triggerHaptic('medium');
                        onSelectDoctor(doc);
                      }}
                    >
                      <span>Booking Antrean</span>
                      <ChevronRight size={16} />
                    </button>
                  )}

                  <a
                    href={`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20bertanya%20jadwal%20${encodeURIComponent(
                      doc.name
                    )}%20pada%20hari%20${activeDateItem?.dayName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wk-btn-wa"
                    onClick={() => triggerHaptic('light')}
                    title="Tanya CS via WA"
                  >
                    <MessageCircle size={16} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
