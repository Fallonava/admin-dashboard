import React, { useState, useMemo, useCallback } from 'react';
import type { LeaveRequest, Doctor } from '../types';
import SpecialistIcon from './SpecialistIcon';
import {
  getCalendarGrid,
  formatDateIndonesian,
  getSpecialtyBadgeClass,
  toWibDateStr,
  getWibNow,
} from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  AlertCircle,
  Calendar,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';

interface LeavesCalendarProps {
  leaves: LeaveRequest[];
  doctors: Doctor[];
}

export default function LeavesCalendar({ leaves, doctors }: LeavesCalendarProps) {
  const wibNow = useMemo(() => getWibNow(), []);
  const [currentYear, setCurrentYear] = useState<number>(wibNow.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(wibNow.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(wibNow);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Pre-normalize all leaves once for instantaneous O(1) date comparison
  const normalizedLeaves = useMemo(() => {
    return leaves.map((leave) => {
      const startStr = toWibDateStr(leave.startDate);
      const endStr = toWibDateStr(leave.endDate || leave.startDate);
      return {
        ...leave,
        _startStr: startStr,
        _endStr: endStr || startStr,
      };
    });
  }, [leaves]);

  const handlePrevMonth = useCallback(() => {
    triggerHaptic('light');
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    triggerHaptic('light');
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const handleTodayMonth = useCallback(() => {
    triggerHaptic('selection');
    const now = getWibNow();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now);
  }, []);

  // Build calendar cells using WIB date calculations (super fast)
  const calendarCells = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth, leaves);
  }, [currentYear, currentMonth, leaves]);

  const selectedDateStr = useMemo(() => {
    return toWibDateStr(selectedDate);
  }, [selectedDate]);

  // Leaves strictly matching the selected date on the calendar (O(1) string comparison)
  const leavesForSelectedDate = useMemo(() => {
    if (!selectedDateStr) return [];
    return normalizedLeaves.filter(
      (nl) => nl._startStr && selectedDateStr >= nl._startStr && selectedDateStr <= nl._endStr
    );
  }, [normalizedLeaves, selectedDateStr]);

  const handleSelectDate = useCallback((d: Date) => {
    triggerHaptic('selection');
    setSelectedDate(d);
  }, []);

  return (
    <div className="leaves-view-container">
      {/* Calendar Card (Apple iOS 27 Liquid Glass) */}
      <div className="ios-calendar-card mb-20">
        <div className="cal-nav-bar">
          <div className="cal-month-title-group">
            <h3 className="cal-month-name">{monthNames[currentMonth]}</h3>
            <span className="cal-year-tag">{currentYear} WIB</span>
          </div>

          <div className="cal-nav-btn-group">
            <button
              type="button"
              className="cal-today-pill-btn"
              onClick={handleTodayMonth}
              title="Kembali ke Hari Ini"
            >
              Hari Ini
            </button>
            <button
              type="button"
              className="cal-nav-arrow-btn"
              onClick={handlePrevMonth}
              title="Bulan Sebelumnya"
              aria-label="Bulan Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="cal-nav-arrow-btn"
              onClick={handleNextMonth}
              title="Bulan Berikutnya"
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="cal-weekday-row">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
            <span key={d} className={`cal-weekday-label ${i === 0 ? 'is-sunday' : ''}`}>
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="cal-grid">
          {calendarCells.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDateStr;

            return (
              <button
                key={idx}
                type="button"
                className={`cal-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${
                  cell.isToday ? 'is-today' : ''
                } ${isSelected ? 'is-selected' : ''} ${cell.isHoliday ? 'is-holiday' : ''}`}
                onClick={() => {
                  if (cell.date) {
                    handleSelectDate(cell.date);
                  }
                }}
                disabled={!cell.date}
                aria-label={`${cell.dayNum} ${monthNames[currentMonth]}, ${cell.leavesCount} dokter cuti`}
              >
                <div className="cal-cell-num-wrap">
                  <span className="cal-cell-num">{cell.dayNum}</span>
                </div>
                <div className="cal-cell-indicators">
                  {cell.leavesCount > 0 ? (
                    <span className="cal-event-dot leave-dot" title={`${cell.leavesCount} Dokter Cuti`} />
                  ) : cell.isHoliday ? (
                    <span className="cal-event-dot holiday-dot" title="Libur" />
                  ) : (
                    <span className="cal-event-dot-spacer" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Context Summary Pill */}
      <div className="cal-selected-day-pill mb-16">
        <div className="selected-day-info">
          <Calendar size={16} className="text-blue" />
          <span className="selected-day-title">
            {formatDateIndonesian(selectedDate)}
          </span>
        </div>
        <span className={`selected-day-count ${leavesForSelectedDate.length > 0 ? 'has-leaves' : ''}`}>
          {leavesForSelectedDate.length} Dokter Cuti
        </span>
      </div>

      {/* List of Leave Doctor Cards (Compact Platter Grid) */}
      {leavesForSelectedDate.length === 0 ? (
        <div className="ios-empty-state">
          <div className="ios-empty-coin">
            <CheckCircle2 size={32} className="text-green" />
          </div>
          <div className="ios-empty-title">Tidak Ada Dokter Cuti</div>
          <div className="ios-empty-sub">
            Seluruh dokter spesialis bertugas sesuai jadwal pada {formatDateIndonesian(selectedDate)}.
          </div>
        </div>
      ) : (
        <div className="compact-platter-grid">
          {leavesForSelectedDate.map((leave) => {
            const docName =
              typeof leave.doctor === 'object' && leave.doctor !== null
                ? leave.doctor.name
                : String(leave.doctor || '');
            const doctorObj = doctors.find((d) => d.id === leave.doctorId);
            const displayName = docName || doctorObj?.name || 'Dokter Spesialis';
            const specialty = doctorObj?.specialty || 'Spesialis';
            const badgeClass = getSpecialtyBadgeClass(specialty);

            return (
              <div key={leave.id} className="platter ios27-compact-card is-cuti">
                <div className="card-main-content">
                  {/* Squircle Avatar (3D Ceramic Squircle) */}
                  <div className="card-avatar-col">
                    <div className="avatar-squircle">
                      {doctorObj?.image ? (
                        <img src={doctorObj.image} alt={displayName} className="avatar-img" loading="lazy" />
                      ) : (
                        <SpecialistIcon department={specialty} size={24} className="avatar-spec-icon" />
                      )}
                    </div>
                  </div>

                  {/* Info Center */}
                  <div className="card-info-col">
                    <div className="card-name-row">
                      <h3 className="doc-name">{displayName}</h3>
                    </div>

                    <div className="card-sub-row">
                      <span className={`doc-spec-badge ${badgeClass}`}>
                        <SpecialistIcon department={specialty} size={12} className="spec-icon-inline" />
                        <span>{specialty}</span>
                      </span>

                      <span className="status-pill compact-status st-cuti">
                        <span className="status-dot" />
                        <span>Cuti</span>
                      </span>
                    </div>

                    <div className="card-time-row">
                      <AlertCircle size={12} className="time-icon text-red" />
                      <span className="card-time-val text-red">
                        {leave.reason || 'Izin Dinas / Cuti Dokter'}
                      </span>
                    </div>
                  </div>

                  {/* Action Right */}
                  <div className="card-action-col">
                    <a
                      href={`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20konsultasi%20mengenai%20jadwal%20pengganti%20${encodeURIComponent(
                        displayName
                      )}%20(${encodeURIComponent(specialty)})`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-book-pill-btn"
                      style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
                      onClick={() => triggerHaptic('light')}
                      title="Konfirmasi CS WA"
                      aria-label="Konfirmasi CS WA"
                    >
                      <MessageCircle size={12} />
                      <span>CS WA</span>
                    </a>
                  </div>
                </div>

                {/* Additional context if replacement doctor exists */}
                {leave.replacementDoctor && (
                  <div className="leave-replacement-pill mt-6">
                    <ArrowLeftRight size={13} className="text-blue" />
                    <span className="leave-rep-lbl">Dokter Pengganti:</span>
                    <span className="leave-rep-val">{leave.replacementDoctor}</span>
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
