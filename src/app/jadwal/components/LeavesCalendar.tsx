import React, { useState, useMemo } from 'react';
import type { LeaveRequest, Doctor } from '../types';
import SpecialistIcon from './SpecialistIcon';
import { getInitials, getSpecialtyBadgeClass, INDO_MONTHS, INDO_DAYS } from '../lib/schedule-utils';
import { getIndonesianHoliday } from '@/lib/holidays';
import { triggerHaptic } from '../lib/haptics';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search, CalendarCheck, CalendarRange, ArrowLeftRight } from 'lucide-react';

interface LeavesCalendarProps {
  leaves: LeaveRequest[];
  doctors: Doctor[];
}

export default function LeavesCalendar({ leaves, doctors }: LeavesCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar month navigation
  const prevMonth = () => {
    triggerHaptic('selection');
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    triggerHaptic('selection');
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const gotoToday = () => {
    triggerHaptic('selection');
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Generate calendar cells (Monday to Sunday)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week index 0=Sun..6=Sat -> convert to Mon=0..Sun=6
    let startingDay = firstDayOfMonth.getDay() - 1;
    if (startingDay === -1) startingDay = 6;

    const totalDays = lastDayOfMonth.getDate();
    const days = [];

    // Empty previous month padding
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, date: null });
    }

    // Days in current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const isToday = dateObj.getTime() === today.getTime();
      const isSelected = selectedDate ? dateObj.toDateString() === selectedDate.toDateString() : false;
      const holiday = getIndonesianHoliday(dateObj);

      // Check how many doctor leaves fall on this day
      const dayLeaves = leaves.filter((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate || l.startDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return dateObj.getTime() >= start.getTime() && dateObj.getTime() <= end.getTime();
      });

      days.push({
        day: d,
        date: dateObj,
        isToday,
        isSelected,
        isTanggalMerah: holiday.isTanggalMerah,
        holidayName: holiday.name,
        leaveCount: dayLeaves.length,
      });
    }

    return days;
  }, [year, month, selectedDate, leaves]);

  // Filter leaves list
  const filteredLeaves = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return leaves.filter((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate || l.startDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      // Status categorization
      const isActive = now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
      const isUpcoming = start.getTime() > now.getTime();

      if (filterTab === 'active' && !isActive) return false;
      if (filterTab === 'upcoming' && !isUpcoming) return false;

      // Search query
      if (searchQuery) {
        const doc = doctors.find((d) => d.id === l.doctorId);
        const rawDocName = doc?.name || l.doctorName || (typeof l.doctor === 'object' && l.doctor !== null ? l.doctor.name : typeof l.doctor === 'string' ? l.doctor : '');
        const docName = rawDocName.toLowerCase();
        const spec = (doc?.specialty || l.specialty || '').toLowerCase();
        const reason = (l.reason || '').toLowerCase();
        const q = searchQuery.toLowerCase();

        if (!docName.includes(q) && !spec.includes(q) && !reason.includes(q)) {
          return false;
        }
      }

      // Filter by selected calendar date if active
      if (selectedDate) {
        const selTime = selectedDate.getTime();
        if (selTime < start.getTime() || selTime > end.getTime()) {
          return false;
        }
      }

      return true;
    });
  }, [leaves, doctors, filterTab, searchQuery, selectedDate]);

  return (
    <div className="leaves-container">
      {/* Calendar Card */}
      <div className="leaves-cal-card mb-24">
        {/* Calendar Nav */}
        <div className="cal-nav-row">
          <div className="cal-month-title">
            <CalendarIcon size={18} className="cal-title-icon" />
            <span>
              {INDO_MONTHS[month]} {year}
            </span>
          </div>

          <div className="cal-nav-btn-group">
            <button className="cal-today-btn" onClick={gotoToday}>
              Hari Ini
            </button>
            <button className="cal-nav-btn" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </button>
            <button className="cal-nav-btn" onClick={nextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="cal-weekdays">
          <span>Sen</span>
          <span>Sel</span>
          <span>Rab</span>
          <span>Kam</span>
          <span>Jum</span>
          <span>Sab</span>
          <span>Min</span>
        </div>

        {/* Calendar Grid */}
        <div className="cal-grid">
          {calendarDays.map((cell, idx) => {
            if (!cell.day || !cell.date) {
              return <div key={`empty-${idx}`} className="cal-day-cell empty"></div>;
            }

            return (
              <button
                key={`day-${cell.day}`}
                className={`cal-day-cell ${cell.isToday ? 'today' : ''} ${cell.isSelected ? 'selected' : ''} ${
                  cell.isTanggalMerah ? 'tanggal-merah' : ''
                }`}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedDate(cell.date);
                }}
              >
                <span className="day-number">{cell.day}</span>
                <div className="cal-dot-container">
                  {cell.isTanggalMerah && <span className="cal-dot-holiday"></span>}
                  {cell.leaveCount > 0 && <span className="cal-dot-leave"></span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div className="cal-legend">
          <div className="cal-legend-item">
            <span className="cal-legend-dot holiday"></span>
            <span>Libur Nasional</span>
          </div>
          <div className="cal-legend-item">
            <span className="cal-legend-dot leave"></span>
            <span>Dokter Cuti</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="ios-mode-switcher ios-mode-switcher-margin mb-24">
        <button
          className={`ios-mode-btn ${filterTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            setFilterTab('all');
          }}
        >
          Semua Cuti
        </button>
        <button
          className={`ios-mode-btn ${filterTab === 'active' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            setFilterTab('active');
          }}
        >
          Sedang Cuti
        </button>
        <button
          className={`ios-mode-btn ${filterTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            setFilterTab('upcoming');
          }}
        >
          Akan Datang
        </button>
      </div>

      {/* Search Input */}
      <div className="ios-search-bar mb-24">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="ios-search-input"
          placeholder="Cari dokter atau alasan cuti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {selectedDate && (
          <button className="clear-date-filter-btn" onClick={() => setSelectedDate(null)}>
            Reset Tanggal
          </button>
        )}
      </div>

      {/* Leaves Cards List */}
      {filteredLeaves.length === 0 ? (
        <div className="ios-empty-state">
          <div className="ios-empty-coin">
            <CalendarCheck size={32} />
          </div>
          <div className="ios-empty-title">Tidak Ada Cuti</div>
          <div className="ios-empty-sub">Tidak ditemukan jadwal cuti dokter pada filter ini.</div>
        </div>
      ) : (
        <div className="leaves-list-grid">
          {filteredLeaves.map((leave) => {
            const doc = doctors.find((d) => d.id === leave.doctorId);
            const docName = doc?.name || leave.doctorName || (typeof leave.doctor === 'object' && leave.doctor !== null ? leave.doctor.name : typeof leave.doctor === 'string' ? leave.doctor : 'Dokter Spesialis');
            const spec = doc?.specialty || leave.specialty || 'Umum';
            const badgeClass = getSpecialtyBadgeClass(spec);

            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate || leave.startDate);
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const isActive = now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
            const statusLabel = isActive ? 'Sedang Berlangsung' : 'Akan Datang';
            const statusClass = isActive ? 'active' : 'upcoming';

            const startStr = `${start.getDate()} ${INDO_MONTHS[start.getMonth()]}`;
            const endStr = `${end.getDate()} ${INDO_MONTHS[end.getMonth()]} ${end.getFullYear()}`;

            return (
              <div key={leave.id} className="leave-card">
                <div className="leave-head">
                  <div className="avatar-squircle">
                    <span className="initials">{getInitials(docName)}</span>
                  </div>
                  <div className="leave-doc-info">
                    <h4 className="leave-doc-name">{docName}</h4>
                    <span className={`doc-spec-badge ${badgeClass}`}>
                      <SpecialistIcon department={spec} size={13} className="spec-icon-inline" />
                      <span>{spec}</span>
                    </span>
                  </div>
                </div>

                <div className="leave-badge-row">
                  <span className={`leave-status-pill ${statusClass}`}>
                    <span className="status-dot"></span>
                    <span>{statusLabel}</span>
                  </span>
                  <span className="leave-date-pill">
                    <CalendarRange size={13} />
                    <span>
                      {startStr} - {endStr}
                    </span>
                  </span>
                </div>

                {leave.reason && (
                  <div className="leave-reason-box">
                    <span className="leave-reason-lbl">Keterangan:</span>
                    <span className="leave-reason-text">{leave.reason}</span>
                  </div>
                )}

                {leave.replacementDoctor && (
                  <div className="leave-replacement">
                    <ArrowLeftRight size={13} />
                    <span>Dokter Pengganti: {leave.replacementDoctor}</span>
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
