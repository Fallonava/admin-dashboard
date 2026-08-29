import React, { useState, useMemo } from 'react';
import type { Doctor, Shift, LeaveRequest, DayDateItem } from '../types';
import SpecialistIcon from './SpecialistIcon';
import {
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
  Search,
} from 'lucide-react';

interface GroupedWeeklyDoctor extends Doctor {
  dayShifts: Shift[];
  activeLeave?: LeaveRequest | null;
  isCuti: boolean;
}

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');

  const dateStrip = useMemo<DayDateItem[]>(() => getWeeklyDateStrip(new Date()), []);
  const activeDateItem = dateStrip[selectedDayIdx] || dateStrip[0];

  const targetDate = activeDateItem?.date || new Date();
  const targetWibTime = new Date(targetDate.getTime() + 7 * 60 * 60 * 1000);
  const targetDayIdx = (targetWibTime.getUTCDay() + 6) % 7; // 0=Senin ... 6=Minggu
  const targetDateStr = activeDateItem?.dateStr || targetWibTime.toISOString().slice(0, 10);

  // Compute total unique doctor count for each day in the strip
  const doctorCountPerDay = useMemo(() => {
    return dateStrip.map((item) => {
      const itemDate = item.date || new Date();
      const itemWib = new Date(itemDate.getTime() + 7 * 60 * 60 * 1000);
      const itemDayIdx = (itemWib.getUTCDay() + 6) % 7;
      const itemDateStr = item.dateStr || itemWib.toISOString().slice(0, 10);

      const uniqueDocIds = new Set<string>();
      shifts.forEach((s) => {
        if (
          s.dayIdx === itemDayIdx &&
          !(s.disabledDates || []).includes(itemDateStr) &&
          isShiftActiveForDate(s.extra, itemWib)
        ) {
          uniqueDocIds.add(s.doctorId);
        }
      });

      return uniqueDocIds.size;
    });
  }, [dateStrip, shifts]);

  // Filtered and deduplicated doctors list for active day (grouped by doctor ID)
  const allDayDoctors = useMemo<GroupedWeeklyDoctor[]>(() => {
    const doctorMap = new Map<string, GroupedWeeklyDoctor>();

    doctors.forEach((doc) => {
      // Find all active shifts for this doctor on target day
      const docDayShifts = shifts.filter(
        (s) =>
          s.doctorId === doc.id &&
          s.dayIdx === targetDayIdx &&
          !(s.disabledDates || []).includes(targetDateStr) &&
          isShiftActiveForDate(s.extra, targetWibTime)
      );

      if (docDayShifts.length === 0) return;

      const leave = isDoctorOnLeave(doc.id, activeDateItem.date, leaves);
      const isCuti = Boolean(leave);

      // Primary shift is first shift
      const primaryShift = docDayShifts[0];
      const regTime = primaryShift?.registrationTime || doc.registrationTime || null;

      doctorMap.set(doc.id, {
        ...doc,
        registrationTime: regTime,
        todayShift: primaryShift ? { ...primaryShift, registrationTime: regTime } : doc.todayShift,
        dayShifts: docDayShifts,
        activeLeave: leave,
        isCuti,
        status: isCuti ? 'CUTI' : 'TERJADWAL',
      });
    });

    const list = Array.from(doctorMap.values());
    return sortDoctorsBySchedule(list) as GroupedWeeklyDoctor[];
  }, [doctors, shifts, leaves, targetDayIdx, targetDateStr, targetWibTime, activeDateItem.date]);

  // Extract unique specialties for the active day
  const uniqueDaySpecialties = useMemo(() => {
    const set = new Set<string>();
    allDayDoctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, [allDayDoctors]);

  // Apply search & specialty filter
  const filteredDoctors = useMemo(() => {
    return allDayDoctors.filter((doc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        (doc.category && doc.category.toLowerCase().includes(q));

      const matchesSpecialty =
        specialtyFilter === 'all' || doc.specialty === specialtyFilter;

      return matchesSearch && matchesSpecialty;
    });
  }, [allDayDoctors, searchQuery, specialtyFilter]);

  const handleSelectDay = (index: number) => {
    triggerHaptic('selection');
    setSelectedDayIdx(index);
    setExpandedDocId(null);
    setSearchQuery('');
    setSpecialtyFilter('all');
  };

  const handleResetToToday = () => {
    triggerHaptic('medium');
    setSelectedDayIdx(0);
    setExpandedDocId(null);
    setSearchQuery('');
    setSpecialtyFilter('all');
  };

  const toggleExpand = (id: string) => {
    triggerHaptic('light');
    setExpandedDocId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="weekly-view-container">
      {/* 7-Day Horizontal Date Strip (Apple iOS 27 Date Capsule Strip) */}
      <div className="weekly-date-strip-container mb-16">
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

      {/* Holiday Alert (Only when applicable) or Jump Today Pill */}
      {activeDateItem?.isHoliday ? (
        <div className="weekly-holiday-banner mb-12">
          <span>🎉 {activeDateItem?.holidayName || 'Libur Nasional'} — {activeDateItem?.dayName}, {activeDateItem?.dayNum} {activeDateItem?.monthName}</span>
        </div>
      ) : selectedDayIdx !== 0 ? (
        <div className="weekly-jump-bar mb-12">
          <button type="button" className="weekly-jump-today-btn" onClick={handleResetToToday}>
            <RotateCcw size={12} />
            <span>Kembali ke Hari Ini</span>
          </button>
        </div>
      ) : null}

      {/* Spotlight Search & Filter inside Weekly Tab (if doctors exist) */}
      {allDayDoctors.length > 0 && (
        <div className="search-and-filter-wrapper mb-16">
          <div className="ios-search-bar mb-10">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="ios-search-input"
              placeholder={`Cari dokter di hari ${activeDateItem?.dayName}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>

          {uniqueDaySpecialties.length > 1 && (
            <div className="category-chips-row">
              <button
                type="button"
                className={`category-chip ${specialtyFilter === 'all' ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('selection');
                  setSpecialtyFilter('all');
                }}
              >
                <span>Semua ({allDayDoctors.length})</span>
              </button>
              {uniqueDaySpecialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  className={`category-chip ${specialtyFilter === spec ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSpecialtyFilter(specialtyFilter === spec ? 'all' : spec);
                  }}
                >
                  <span>{spec}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List of Doctor Cards for Selected Day (Clean Apple HIG Platter Grid) */}
      {filteredDoctors.length === 0 ? (
        <div className="ios-empty-state">
          <div className="ios-empty-coin">
            <CalendarX size={32} />
          </div>
          <div className="ios-empty-title">Tidak Ada Jadwal</div>
          <div className="ios-empty-sub">
            {searchQuery || specialtyFilter !== 'all'
              ? `Tidak ditemukan dokter yang cocok dengan filter pada hari ${activeDateItem?.dayName}.`
              : `Tidak ada jadwal dokter praktik pada hari ${activeDateItem?.dayName}, ${activeDateItem?.dayNum} ${activeDateItem?.monthName}.`}
          </div>
          {(searchQuery || specialtyFilter !== 'all') && (
            <button
              type="button"
              className="empty-reset-btn"
              onClick={() => {
                setSearchQuery('');
                setSpecialtyFilter('all');
              }}
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="compact-platter-grid">
          {filteredDoctors.map((doc) => {
            const isExpanded = expandedDocId === doc.id;
            const badgeClass = getSpecialtyBadgeClass(doc.specialty);
            const isCuti = doc.isCuti;
            const leave = doc.activeLeave;
            const regTime = doc.registrationTime;

            return (
              <div
                key={doc.id}
                className={`platter ios27-compact-card ${isCuti ? 'is-cuti' : ''} ${
                  isExpanded ? 'is-expanded' : ''
                }`}
                onClick={() => toggleExpand(doc.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
              >
                {/* Main Card Content */}
                <div className="card-main-content">
                  {/* 1. Squircle Avatar (Adopted from tv.html 3D Ceramic Squircle) */}
                  <div className="card-avatar-col">
                    <div className="avatar-squircle">
                      {doc.image ? (
                        <img src={doc.image} alt={doc.name} className="avatar-img" loading="lazy" />
                      ) : (
                        <SpecialistIcon department={doc.specialty} size={24} className="avatar-spec-icon" />
                      )}
                    </div>
                    {!isCuti && <span className="avatar-live-pulse" title="Tersedia Bertugas" />}
                  </div>

                  {/* 2. Doctor Info Center */}
                  <div className="card-info-col">
                    <div className="card-name-row">
                      <h3 className="doc-name">{doc.name}</h3>
                    </div>

                    <div className="card-sub-row">
                      <span className={`doc-spec-badge ${badgeClass}`}>
                        <SpecialistIcon department={doc.specialty} size={12} className="spec-icon-inline" />
                        <span>{doc.specialty}</span>
                      </span>

                      <span className={`status-pill compact-status ${isCuti ? 'st-cuti' : 'st-terjadwal'}`}>
                        <span className="status-dot" />
                        <span>{isCuti ? 'Cuti' : 'Terjadwal'}</span>
                      </span>
                    </div>

                    {/* Time & Shift Slots Row */}
                    <div className="card-time-row">
                      {isCuti ? (
                        <span className="text-red font-semibold text-[11px]">
                          Cuti: {leave?.reason || 'Izin Tidak Praktik'}
                        </span>
                      ) : doc.dayShifts.length > 1 ? (
                        <div className="card-multi-shifts-wrap">
                          {doc.dayShifts.map((s, sIdx) => (
                            <span key={s.id || sIdx} className="shift-slot-pill">
                              <Clock size={10.5} className="text-blue" />
                              <span>{s.formattedTime || '-'}</span>
                              {s.title && <span className="shift-title-tag">{s.title}</span>}
                            </span>
                          ))}
                          {regTime && (
                            <span className="card-reg-pill" title="Waktu Registrasi">
                              Reg: {regTime}
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <Clock size={12} className="time-icon text-blue" />
                          <span className="card-time-val">
                            {formatTimeSlot(doc.startTime, doc.endTime, doc.todayShift?.formattedTime)}
                          </span>
                          {regTime && (
                            <span className="card-reg-pill" title="Waktu Registrasi">
                              Reg: {regTime}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* 3. Action Right */}
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
                        aria-label="Daftar Online"
                      >
                        <Sparkles size={13} />
                        <span>Daftar</span>
                      </button>
                    ) : (
                      <span className="card-cuti-badge-mini">Cuti</span>
                    )}
                  </div>
                </div>

                {/* Expandable Accordion Drawer for Extra Context (Apple Inset Metric List) */}
                {isExpanded && (
                  <div className="platter-expanded-drawer">
                    <div className="drawer-metric-list">
                      <div className="drawer-metric-row">
                        <span className="drawer-metric-lbl">Hari Praktik</span>
                        <span className="drawer-metric-val">
                          {activeDateItem?.dayName}, {activeDateItem?.dayNum} {activeDateItem?.monthName}
                        </span>
                      </div>
                      <div className="drawer-metric-row">
                        <span className="drawer-metric-lbl">Kategori Poliklinik</span>
                        <span className="drawer-metric-val">{doc.category || 'Poliklinik Spesialis'}</span>
                      </div>
                      {doc.dayShifts.length > 1 ? (
                        doc.dayShifts.map((s, sIdx) => (
                          <div key={s.id || sIdx} className="drawer-metric-row">
                            <span className="drawer-metric-lbl">{s.title || `Sesi ${sIdx + 1}`}</span>
                            <span className="drawer-metric-val font-semibold">{s.formattedTime || '-'}</span>
                          </div>
                        ))
                      ) : (
                        <div className="drawer-metric-row">
                          <span className="drawer-metric-lbl">Jam Layanan</span>
                          <span className="drawer-metric-val font-semibold">
                            {formatTimeSlot(doc.startTime, doc.endTime, doc.todayShift?.formattedTime)}
                          </span>
                        </div>
                      )}
                      {regTime && (
                        <div className="drawer-metric-row">
                          <span className="drawer-metric-lbl">Waktu Registrasi (Pemanggilan)</span>
                          <span className="drawer-metric-val font-semibold text-blue">{regTime} WIB</span>
                        </div>
                      )}
                      {doc.queueCode && (
                        <div className="drawer-metric-row">
                          <span className="drawer-metric-lbl">Kode Antrean</span>
                          <span className="drawer-metric-val font-mono font-bold text-blue">{doc.queueCode}</span>
                        </div>
                      )}
                      {leave?.reason && (
                        <div className="drawer-metric-row alert-leave">
                          <span className="drawer-metric-lbl">Keterangan Cuti</span>
                          <span className="drawer-metric-val text-red">{leave.reason}</span>
                        </div>
                      )}
                      {leave?.replacementDoctor && (
                        <div className="drawer-metric-row alert-replacement">
                          <span className="drawer-metric-lbl">Dokter Pengganti</span>
                          <span className="drawer-metric-val text-blue">{leave.replacementDoctor}</span>
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

