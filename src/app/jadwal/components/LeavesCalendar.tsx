import React, { useState, useMemo } from 'react';
import type { LeaveRequest, Doctor } from '../types';
import SpecialistIcon from './SpecialistIcon';
import {
  getCalendarGrid,
  formatDateIndonesian,
  getInitials,
  getSpecialtyBadgeClass,
  toWibDateStr,
  isDateInLeave,
  getWibNow,
} from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';
import {
  ChevronLeft,
  ChevronRight,
  CalendarRange,
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

  const handlePrevMonth = () => {
    triggerHaptic('light');
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    triggerHaptic('light');
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleTodayMonth = () => {
    triggerHaptic('selection');
    const now = getWibNow();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now);
  };

  // Build calendar cells using WIB date calculations
  const calendarCells = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth, leaves);
  }, [currentYear, currentMonth, leaves]);

  const selectedDateStr = useMemo(() => {
    return toWibDateStr(selectedDate);
  }, [selectedDate]);

  // Leaves strictly matching the selected date on the calendar
  const leavesForSelectedDate = useMemo(() => {
    if (!selectedDateStr) return [];
    return leaves.filter((leave) => isDateInLeave(selectedDateStr, leave));
  }, [leaves, selectedDateStr]);

  const handleSelectDate = (d: Date) => {
    triggerHaptic('selection');
    setSelectedDate(d);
  };

  return (
    <div className="leaves-view-container">
      {/* Calendar Header & Month Navigation (Apple Liquid Glass) */}
      <div className="ios-calendar-card mb-24">
        <div className="cal-nav-bar">
          <div className="cal-month-title-group">
            <h3 className="cal-month-name">{monthNames[currentMonth]}</h3>
            <span className="cal-year-tag">{currentYear} (WIB)</span>
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
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="cal-nav-arrow-btn"
              onClick={handleNextMonth}
              title="Bulan Berikutnya"
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight size={18} />
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
                <span className="cal-cell-num">{cell.dayNum}</span>
                <div className="cal-cell-indicators">
                  {cell.isHoliday && <span className="cal-dot holiday-dot" title="Libur" />}
                  {cell.leavesCount > 0 && (
                    <span className="cal-dot leave-dot" title={`${cell.leavesCount} Dokter Cuti`}>
                      {cell.leavesCount > 1 ? cell.leavesCount : ''}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Context Summary Banner (Synchronized with Calendar) */}
      <div className="cal-selected-day-pill mb-24">
        <div className="selected-day-info">
          <Calendar size={18} className="text-blue" />
          <span className="selected-day-title">
            {formatDateIndonesian(selectedDate)}
          </span>
        </div>
        <span className={`selected-day-count ${leavesForSelectedDate.length > 0 ? 'has-leaves' : ''}`}>
          {leavesForSelectedDate.length} Dokter Cuti
        </span>
      </div>

      {/* List of Leave Platter Cards for Selected Date */}
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
        <div className="platter-grid">
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
              <div key={leave.id} className="platter leave-platter is-cuti">
                {/* Platter Head */}
                <div className="platter-head-row">
                  <div className="avatar-squircle-wrap">
                    <div className="avatar-squircle">
                      {doctorObj?.image ? (
                        <img src={doctorObj.image} alt={displayName} className="avatar-img" loading="lazy" />
                      ) : (
                        <span className="initials">{getInitials(displayName)}</span>
                      )}
                    </div>
                  </div>

                  <div className="doc-info">
                    <h3 className="doc-name">{displayName}</h3>
                    <div className="doc-meta-row">
                      <span className={`doc-spec-badge ${badgeClass}`}>
                        <SpecialistIcon department={specialty} size={14} className="spec-icon-inline" />
                        <span>{specialty}</span>
                      </span>
                    </div>
                  </div>

                  <div className="platter-top-actions">
                    <span className="status-pill st-cuti">
                      <span className="status-dot" />
                      <span>Cuti</span>
                    </span>
                  </div>
                </div>

                {/* Body: Period & Reason */}
                <div className="platter-body-row">
                  <div className="leave-date-capsule">
                    <div className="leave-date-row">
                      <CalendarRange size={16} className="text-red" />
                      <div className="leave-date-info">
                        <span className="leave-date-lbl">Periode Cuti</span>
                        <span className="leave-date-val">
                          {formatDateIndonesian(new Date(leave.startDate))} s.d.{' '}
                          {formatDateIndonesian(new Date(leave.endDate || leave.startDate))}
                        </span>
                      </div>
                    </div>

                    <div className="leave-reason-pill">
                      <AlertCircle size={15} className="text-red" />
                      <span>{leave.reason || 'Izin Dinas / Cuti Dokter'}</span>
                    </div>

                    {leave.replacementDoctor && (
                      <div className="leave-replacement-pill">
                        <ArrowLeftRight size={15} className="text-blue" />
                        <div className="leave-rep-col">
                          <span className="leave-rep-lbl">Dokter Pengganti:</span>
                          <span className="leave-rep-val">{leave.replacementDoctor}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Tray */}
                <div className="leave-action-tray">
                  <a
                    href={`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20konsultasi%20mengenai%20jadwal%20pengganti%20${encodeURIComponent(
                      displayName
                    )}%20(${encodeURIComponent(specialty)})`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="leave-wa-action-btn"
                    onClick={() => triggerHaptic('light')}
                  >
                    <MessageCircle size={16} />
                    <span>Konfirmasi Pengganti via CS WhatsApp</span>
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
