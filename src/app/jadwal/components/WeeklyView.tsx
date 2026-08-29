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
  sortDoctorsBySchedule,
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
  ChevronDown,
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
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

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

  // Filtered doctors list for active day (sorted by shift time & status)
  const filteredDoctors = useMemo(() => {
    const list = doctors
      .filter((doc) => {
        const hasShift = shifts.some(
          (s) =>
            s.doctorId === doc.id &&
            s.dayIdx === targetDayIdx &&
            !(s.disabledDates || []).includes(targetDateStr) &&
            isShiftActiveForDate(s.extra, targetWibTime)
        );
        return hasShift;
      })
      .map((doc) => {
        const activeShift = shifts.find(
          (s) =>
            s.doctorId === doc.id &&
            s.dayIdx === targetDayIdx &&
            !(s.disabledDates || []).includes(targetDateStr) &&
            isShiftActiveForDate(s.extra, targetWibTime)
        );
        return {
          ...doc,
          todayShift: activeShift || doc.todayShift,
        };
      });
    return sortDoctorsBySchedule(list);
  }, [doctors, shifts, targetDayIdx, targetDateStr, targetWibTime]);

  const handleSelectDay = (index: number) => {
    triggerHaptic('selection');
    setSelectedDayIdx(index);
    setExpandedDocId(null);
  };

  const handleResetToToday = () => {
    triggerHaptic('medium');
    setSelectedDayIdx(0);
    setExpandedDocId(null);
  };

  const toggleExpand = (id: string) => {
    triggerHaptic('light');
    setExpandedDocId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="weekly-view-container">
      {/* 7-Day Horizontal Date Strip (Apple iOS 27 Liquid Glass Pills) */}
      <div className="weekly-date-strip-container mb-20">
        <div className="weekly-date-strip">
          {dateStrip.map((item, idx) => {
            const isSelected = idx === selectedDayIdx;
            const docCount = doctorCountPerDay[idx] || 0;
            const isToday = idx === 0;
            return (
              <button
                key={item.dateStr}
                type="button"
                className={`weekly-day-btn ${isSelected ? 'active' : ''} ${isToday ? 'is-today' : ''} ${
                  item.isHoliday ? 'is-holiday' : ''
                }`}
                onClick={() => handleSelectDay(idx)}
                aria-label={`Jadwal ${item.dayName}, ${item.dayNum} ${item.monthName}`}
              >
                <span className="date-day-name">{item.dayName.slice(0, 3)}</span>
                <div className="date-bubble-wrap">
                  <span className="date-number">{item.dayNum}</span>
                </div>
                <div className="date-doc-count-pill">
                  {docCount > 0 ? <span>{docCount} dr</span> : <span className="count-zero">-</span>}
                </div>
                {item.isHoliday && <span className="holiday-dot" title={item.holidayName} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Context Pill Header */}
      <div className="weekly-day-header-pill mb-16">
        <div className="weekly-day-title-wrap">
          <CalendarCheck size={16} className="text-blue" />
          <span className="weekly-day-title">
            {activeDateItem?.dayName}, {activeDateItem?.dayNum} {activeDateItem?.monthName}
          </span>
          <span className="weekly-day-count-badge">{filteredDoctors.length} Dokter</span>
        </div>
        {activeDateItem?.isHoliday ? (
          <span className="weekly-holiday-tag">{activeDateItem?.holidayName || 'Libur Nasional'}</span>
        ) : selectedDayIdx !== 0 ? (
          <button type="button" className="weekly-jump-today-btn" onClick={handleResetToToday}>
            <RotateCcw size={12} />
            <span>Hari Ini</span>
          </button>
        ) : null}
      </div>

      {/* List of Doctor Cards for Selected Day (Compact Platter Grid) */}
      {filteredDoctors.length === 0 ? (
        <div className="ios-empty-state">
          <div className="ios-empty-coin">
            <CalendarX size={32} />
          </div>
          <div className="ios-empty-title">Tidak Ada Praktik</div>
          <div className="ios-empty-sub">
            Tidak ditemukan jadwal dokter pada hari {activeDateItem?.dayName}, {activeDateItem?.dayNum} {activeDateItem?.monthName}.
          </div>
          {selectedDayIdx !== 0 && (
            <button type="button" className="empty-reset-btn" onClick={handleResetToToday}>
              Kembali ke Hari Ini
            </button>
          )}
        </div>
      ) : (
        <div className="compact-platter-grid">
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
            const isExpanded = expandedDocId === doc.id;
            const badgeClass = getSpecialtyBadgeClass(doc.specialty);

            return (
              <div
                key={doc.id}
                className={`platter ios27-compact-card weekly-compact-card ${isCuti ? 'is-cuti' : ''} ${
                  isExpanded ? 'is-expanded' : ''
                }`}
                onClick={() => toggleExpand(doc.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
              >
                <span className="card-top-specular" aria-hidden="true" />

                <div className="card-main-content">
                  {/* Avatar Squircle */}
                  <div className="card-avatar-col">
                    <div className="avatar-squircle">
                      {doc.image ? (
                        <img src={doc.image} alt={doc.name} className="avatar-img" loading="lazy" />
                      ) : (
                        <span className="initials">{getInitials(doc.name)}</span>
                      )}
                    </div>
                    {!isCuti && <span className="avatar-live-pulse" title="Tersedia Bertugas" />}
                  </div>

                  {/* Doctor Info Center */}
                  <div className="card-info-col">
                    <div className="card-name-row">
                      <h3 className="doc-name">{doc.name}</h3>
                      <span className={`status-pill compact-status ${isCuti ? 'st-cuti' : 'st-praktek'}`}>
                        <span className="status-dot" />
                        <span>{isCuti ? 'Cuti' : 'Tersedia'}</span>
                      </span>
                    </div>

                    <div className="card-sub-row">
                      <span className={`doc-spec-badge ${badgeClass}`}>
                        <SpecialistIcon department={doc.specialty} size={12} className="spec-icon-inline" />
                        <span>{doc.specialty}</span>
                      </span>
                      {shift?.title && (
                        <span className="card-queue-badge">
                          <Ticket size={11} />
                          <span>{shift.title}</span>
                        </span>
                      )}
                    </div>

                    <div className="card-time-row">
                      <Clock size={13} className="time-icon text-blue" />
                      <span className="card-time-val">
                        {isCuti
                          ? `Cuti: ${leave?.reason || 'Izin Tidak Praktik'}`
                          : formatTimeSlot(doc.startTime, doc.endTime, shift?.formattedTime)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="card-action-col">
                    {!isCuti && onSelectDoctor ? (
                      <button
                        type="button"
                        className="card-book-pill-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('medium');
                          onSelectDoctor(doc);
                        }}
                        title="Daftar Online"
                      >
                        <Sparkles size={13} />
                        <span>Daftar</span>
                      </button>
                    ) : (
                      <span className="card-cuti-badge-mini">Cuti</span>
                    )}
                  </div>
                </div>

                {/* Accordion Detail Drawer */}
                {isExpanded && (
                  <div className="platter-expanded-drawer">
                    <div className="drawer-info-grid">
                      <div className="drawer-info-item">
                        <span className="drawer-lbl">Hari & Sesi Praktik</span>
                        <span className="drawer-val">
                          {activeDateItem?.dayName}, {shift?.title || 'Sesi Poliklinik'}
                        </span>
                      </div>
                      <div className="drawer-info-item">
                        <span className="drawer-lbl">Jam Layanan</span>
                        <span className="drawer-val">
                          {formatTimeSlot(doc.startTime, doc.endTime, shift?.formattedTime)}
                        </span>
                      </div>
                      {leave?.replacementDoctor && (
                        <div className="drawer-info-item full">
                          <span className="drawer-lbl">Dokter Pengganti</span>
                          <span className="drawer-val text-blue">{leave.replacementDoctor}</span>
                        </div>
                      )}
                    </div>

                    <div className="drawer-quick-actions">
                      <a
                        href={`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20bertanya%20jadwal%20${encodeURIComponent(
                          doc.name
                        )}%20pada%20hari%20${activeDateItem?.dayName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="drawer-wa-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                        }}
                      >
                        <MessageCircle size={14} />
                        <span>Tanya CS WhatsApp</span>
                      </a>
                    </div>
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
