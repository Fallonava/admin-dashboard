import React, { useState, useMemo } from 'react';
import type { LeaveRequest, Doctor } from '../types';
import SpecialistIcon from './SpecialistIcon';
import { getCalendarGrid, formatDateIndonesian, getInitials, getSpecialtyBadgeClass } from '../lib/schedule-utils';
import { triggerHaptic } from '../lib/haptics';
import {
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  CalendarRange,
  ArrowLeftRight,
  AlertCircle,
  Calendar,
  Search,
  MessageCircle,
  UserX,
  Clock,
  Sparkles,
} from 'lucide-react';

interface LeavesCalendarProps {
  leaves: LeaveRequest[];
  doctors: Doctor[];
}

export default function LeavesCalendar({ leaves, doctors }: LeavesCalendarProps) {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [activeLeaveTab, setActiveLeaveTab] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now);
  };

  // Build 35-42 calendar cell grid
  const calendarCells = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth, leaves);
  }, [currentYear, currentMonth, leaves]);

  // Leaves filtered by Active / Upcoming / Past tab and search query
  const filteredLeaves = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leaves.filter((leave) => {
      const start = new Date(leave.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(leave.endDate || leave.startDate);
      end.setHours(23, 59, 59, 999);

      // Tab filter
      if (activeLeaveTab === 'active' && (today < start || today > end)) return false;
      if (activeLeaveTab === 'upcoming' && today >= start) return false;
      if (activeLeaveTab === 'past' && today <= end) return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const docName = typeof leave.doctor === 'object' && leave.doctor !== null
          ? leave.doctor.name
          : String(leave.doctor || '');
        const doctorObj = doctors.find((d) => d.id === leave.doctorId);
        const nameToSearch = (docName || doctorObj?.name || '').toLowerCase();
        const reasonToSearch = (leave.reason || '').toLowerCase();
        const repToSearch = (leave.replacementDoctor || '').toLowerCase();
        if (!nameToSearch.includes(q) && !reasonToSearch.includes(q) && !repToSearch.includes(q)) return false;
      }

      return true;
    });
  }, [leaves, doctors, activeLeaveTab, searchQuery]);

  // Leaves for the currently clicked date
  const leavesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateToCheck = new Date(selectedDate);
    dateToCheck.setHours(0, 0, 0, 0);

    return leaves.filter((leave) => {
      const start = new Date(leave.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(leave.endDate || leave.startDate);
      end.setHours(23, 59, 59, 999);
      return dateToCheck >= start && dateToCheck <= end;
    });
  }, [leaves, selectedDate]);

  return (
    <div className="leaves-view-container">
      {/* Calendar Header & Month Navigation (Apple Liquid Glass) */}
      <div className="ios-calendar-card mb-24">
        <div className="cal-nav-bar">
          <div className="cal-month-title-group">
            <h3 className="cal-month-name">{monthNames[currentMonth]}</h3>
            <span className="cal-year-tag">{currentYear}</span>
          </div>

          <div className="cal-nav-btn-group">
            <button
              type="button"
              className="cal-today-pill-btn"
              onClick={handleTodayMonth}
              title="Kembali ke Bulan & Hari Ini"
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
            const isSelected =
              selectedDate &&
              cell.date &&
              cell.date.toDateString() === selectedDate.toDateString();

            return (
              <button
                key={idx}
                type="button"
                className={`cal-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${
                  cell.isToday ? 'is-today' : ''
                } ${isSelected ? 'is-selected' : ''} ${cell.isHoliday ? 'is-holiday' : ''}`}
                onClick={() => {
                  if (cell.date) {
                    triggerHaptic('selection');
                    setSelectedDate(cell.date);
                  }
                }}
                disabled={!cell.date}
                aria-label={cell.date ? cell.date.toDateString() : ''}
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

      {/* Selected Date Context Summary Banner */}
      {selectedDate && (
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
      )}

      {/* Filter Tabs for Leaves List */}
      <div className="category-chips-row mb-16">
        <button
          type="button"
          className={`category-chip ${activeLeaveTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            setActiveLeaveTab('all');
          }}
        >
          Semua Data ({leaves.length})
        </button>
        <button
          type="button"
          className={`category-chip ${activeLeaveTab === 'active' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            setActiveLeaveTab('active');
          }}
        >
          Sedang Berlangsung
        </button>
        <button
          type="button"
          className={`category-chip ${activeLeaveTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            setActiveLeaveTab('upcoming');
          }}
        >
          Mendatang
        </button>
        <button
          type="button"
          className={`category-chip ${activeLeaveTab === 'past' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            setActiveLeaveTab('past');
          }}
        >
          Riwayat Selesai
        </button>
      </div>

      {/* Search Input for Leaves */}
      <div className="ios-search-bar mb-24">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="ios-search-input"
          placeholder="Cari nama dokter, spesialis, atau alasan cuti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
            ×
          </button>
        )}
      </div>

      {/* List of Leave Platter Cards */}
      {filteredLeaves.length === 0 ? (
        <div className="ios-empty-state">
          <div className="ios-empty-coin">
            <CalendarCheck size={32} />
          </div>
          <div className="ios-empty-title">Tidak Ada Data Cuti</div>
          <div className="ios-empty-sub">
            Tidak ada dokter yang sedang tercatat cuti pada kategori filter ini.
          </div>
          {(searchQuery || activeLeaveTab !== 'all') && (
            <button
              type="button"
              className="empty-reset-btn"
              onClick={() => {
                setSearchQuery('');
                setActiveLeaveTab('all');
              }}
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="platter-grid">
          {filteredLeaves.map((leave) => {
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
                      <span>{leave.reason || 'Izin Dinas / Cuti Tahunan Dokter'}</span>
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
