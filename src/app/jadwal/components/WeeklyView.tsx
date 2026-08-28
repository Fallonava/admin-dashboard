import React, { useState, useMemo } from 'react';
import type { Doctor, Shift, LeaveRequest, DayDateItem } from '../types';
import SpecialistIcon from './SpecialistIcon';
import {
  getInitials,
  getSpecialtyBadgeClass,
  getWeeklyDateStrip,
  isDoctorOnLeave,
  formatTimeSlot,
  isShiftActiveForDate,
} from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';
import {
  CalendarX,
  Clock,
  MessageCircle,
  CalendarCheck,
  RotateCcw,
  Sparkles,
  Ticket,
} from 'lucide-react';

interface WeeklyViewProps {
  doctors: Doctor[];
  shifts: Shift[];
  leaves: LeaveRequest[];
  onSelectDoctor?: (doctor: Doctor) => void;
}

export default function WeeklyView({
  doctors,
  shifts,
  leaves,
  onSelectDoctor,
}: WeeklyViewProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  const dateStrip = useMemo<DayDateItem[]>(() => getWeeklyDateStrip(new Date()), []);
  const activeDateItem = dateStrip[selectedDayIdx] || dateStrip[0];

  const targetDate = activeDateItem?.date || new Date();
  const targetWibTime = new Date(targetDate.getTime() + 7 * 60 * 60 * 1000);
  const targetDayIdx = (targetWibTime.getUTCDay() + 6) % 7; // 0=Senin ... 6=Minggu
  const targetDateStr = activeDateItem?.dateStr || targetWibTime.toISOString().slice(0, 10);

  // Compute doctor count for each day in the strip
  const doctorCountPerDay = useMemo(() => {
    return dateStrip.map((item) => {
      const itemDate = item.date || new Date();
      const itemWib = new Date(itemDate.getTime() + 7 * 60 * 60 * 1000);
      const itemDayIdx = (itemWib.getUTCDay() + 6) % 7;
      const itemDateStr = item.dateStr || itemWib.toISOString().slice(0, 10);

      const count = doctors.filter((doc) =>
        shifts.some(
          (s) =>
            s.doctorId === doc.id &&
            s.dayIdx === itemDayIdx &&
            !(s.disabledDates || []).includes(itemDateStr) &&
            isShiftActiveForDate(s.extra, itemWib)
        )
      ).length;

      return count;
    });
  }, [dateStrip, doctors, shifts]);

  // Filtered doctors list for active day
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // Shift matching for target day
      const hasShift = shifts.some(
        (s) =>
          s.doctorId === doc.id &&
          s.dayIdx === targetDayIdx &&
          !(s.disabledDates || []).includes(targetDateStr) &&
          isShiftActiveForDate(s.extra, targetWibTime)
      );

      return hasShift;
    });
  }, [doctors, shifts, targetDayIdx, targetDateStr, targetWibTime]);

  const handleSelectDay = (index: number) => {
    triggerHaptic('selection');
    setSelectedDayIdx(index);
  };

  const handleResetToToday = () => {
    triggerHaptic('medium');
    setSelectedDayIdx(0);
  };

  return (
    <div className="weekly-view-container">
      {/* 7-Day Horizontal Date Strip (Apple Liquid Glass) */}
      <div className="weekly-date-strip-container mb-24">
        <div className="weekly-date-strip">
          {dateStrip.map((item, idx) => {
            const isSelected = idx === selectedDayIdx;
            const docCount = doctorCountPerDay[idx] || 0;
            return (
              <button
                key={item.dateStr}
                type="button"
                className={`weekly-day-btn ${isSelected ? 'active' : ''} ${item.isHoliday ? 'is-holiday' : ''}`}
                onClick={() => handleSelectDay(idx)}
                aria-label={`Jadwal ${item.dayName}, ${item.dayNum} ${item.monthName}`}
              >
                <span className="date-day-name">{item.dayName}</span>
                <span className="date-number">{item.dayNum}</span>
                <span className="date-month-name">{item.monthName}</span>
                <span className="date-doc-count">{docCount} Dokter</span>
                {item.isHoliday && <span className="holiday-dot" title={item.holidayName} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Header Pill */}
      <div className="weekly-day-header-pill mb-24">
        <div className="weekly-day-title-wrap">
          <CalendarCheck size={18} className="text-blue" />
          <span className="weekly-day-title">
            {activeDateItem?.dayName}, {activeDateItem?.dayNum} {activeDateItem?.monthName}
          </span>
          <span className="weekly-day-count-badge">{filteredDoctors.length} Dokter</span>
        </div>
        {activeDateItem?.isHoliday ? (
          <span className="weekly-holiday-tag">{activeDateItem?.holidayName || 'Libur Nasional'}</span>
        ) : selectedDayIdx !== 0 ? (
          <button type="button" className="weekly-jump-today-btn" onClick={handleResetToToday}>
            <RotateCcw size={13} />
            <span>Hari Ini</span>
          </button>
        ) : null}
      </div>

      {/* List of Doctor Cards for Selected Day */}
      {filteredDoctors.length === 0 ? (
        <div className="ios-empty-state">
          <div className="ios-empty-coin">
            <CalendarX size={32} />
          </div>
          <div className="ios-empty-title">Tidak Ada Praktik</div>
          <div className="ios-empty-sub">
            Tidak ditemukan jadwal praktik dokter pada hari {activeDateItem?.dayName}, {activeDateItem?.dayNum} {activeDateItem?.monthName}.
          </div>
          {selectedDayIdx !== 0 && (
            <button type="button" className="empty-reset-btn" onClick={handleResetToToday}>
              Kembali ke Hari Ini
            </button>
          )}
        </div>
      ) : (
        <div className="platter-grid">
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
              <div key={doc.id} className={`platter weekly-platter ${isCuti ? 'is-cuti' : ''}`}>
                {/* Platter Header */}
                <div className="platter-head-row">
                  <div className="avatar-squircle-wrap">
                    <div className="avatar-squircle">
                      {doc.image ? (
                        <img src={doc.image} alt={doc.name} className="avatar-img" loading="lazy" />
                      ) : (
                        <span className="initials">{getInitials(doc.name)}</span>
                      )}
                    </div>
                    {!isCuti && <span className="avatar-live-pulse" title="Tersedia Bertugas" />}
                  </div>

                  <div className="doc-info">
                    <h3 className="doc-name">{doc.name}</h3>
                    <div className="doc-meta-row">
                      <span className={`doc-spec-badge ${badgeClass}`}>
                        <SpecialistIcon department={doc.specialty} size={14} className="spec-icon-inline" />
                        <span>{doc.specialty}</span>
                      </span>
                    </div>
                  </div>

                  <div className="platter-top-actions">
                    <span className={`status-pill ${isCuti ? 'st-cuti' : 'st-praktek'}`}>
                      <span className="status-dot" />
                      <span>{isCuti ? 'Cuti' : 'Tersedia'}</span>
                    </span>
                  </div>
                </div>

                {/* Body / Schedule Info */}
                <div className="platter-body-row">
                  {isCuti ? (
                    <div className="wk-cuti-banner">
                      <CalendarX size={18} className="wk-cuti-icon" />
                      <div className="wk-cuti-text">
                        <span className="wk-cuti-title">Dokter Sedang Cuti</span>
                        <span className="wk-cuti-sub">{leave?.reason || 'Izin Tidak Praktik'}</span>
                        {leave?.replacementDoctor && (
                          <span className="wk-cuti-replacement">
                            Dokter Pengganti: {leave.replacementDoctor}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="platter-time-capsule">
                      <div className="time-capsule-slot">
                        <Clock size={15} className="time-capsule-icon" />
                        <div className="time-capsule-info">
                          <span className="time-capsule-lbl">Jam Praktik</span>
                          <span className="time-capsule-val">
                            {formatTimeSlot(doc.startTime, doc.endTime, shift?.formattedTime)}
                          </span>
                        </div>
                      </div>

                      <div className="time-capsule-divider" />

                      <div className="time-capsule-slot queue-slot">
                        <Ticket size={15} className="time-capsule-icon" />
                        <div className="time-capsule-info">
                          <span className="time-capsule-lbl">Sesi Poliklinik</span>
                          <span className="time-capsule-val">
                            {shift?.title || `${activeDateItem?.dayName}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Platter Actions */}
                <div className="weekly-card-action-bar">
                  {!isCuti && onSelectDoctor && (
                    <button
                      type="button"
                      className="platter-action-btn"
                      onClick={() => {
                        triggerHaptic('medium');
                        onSelectDoctor(doc);
                      }}
                    >
                      <Sparkles size={15} />
                      <span>Daftar Online</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20bertanya%20jadwal%20${encodeURIComponent(
                      doc.name
                    )}%20pada%20hari%20${activeDateItem?.dayName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wk-btn-wa-pill"
                    onClick={() => triggerHaptic('light')}
                    title="Tanya CS via WA"
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp</span>
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
