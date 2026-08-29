"use client";

import './jadwal.css';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';
import {
  Search,
  RotateCcw,
  AlertTriangle,
  SearchX,
  Star,
  Clock,
  CalendarX,
  Sparkles,
} from 'lucide-react';

import type { Doctor, Shift, LeaveRequest, DisplayApiResponse } from './types';
import {
  evaluateDoctorRealtimeStatus,
  isShiftActiveForDate,
  toWibDateStr,
  sortDoctorsBySchedule,
} from './lib/schedule-utils';
import { triggerHaptic } from './lib/haptics';

import DynamicIsland, { DynamicIslandAlert } from './components/DynamicIsland';
import BentoStats from './components/BentoStats';
import DoctorCard from './components/DoctorCard';
import WeeklyView from './components/WeeklyView';
import LeavesCalendar from './components/LeavesCalendar';
import RegistrationModal from './components/RegistrationModal';
import JadwalNavbar from './components/JadwalNavbar';
import IosTabBar from './components/IosTabBar';

const fetcher = async (url: string): Promise<DisplayApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal mengambil data jadwal');
  return res.json();
};

export default function JadwalPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'leaves'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'praktek' | 'terjadwal' | 'cuti' | 'favorite'>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [selectedDoctorForModal, setSelectedDoctorForModal] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [islandAlert, setIslandAlert] = useState<DynamicIslandAlert | null>(null);
  const [favoriteDoctorIds, setFavoriteDoctorIds] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState(0);
  const [islandMessage, setIslandMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme and favorites from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('simed_fav_doctors');
      if (savedFavs) {
        setFavoriteDoctorIds(JSON.parse(savedFavs));
      }
      const savedTheme = localStorage.getItem('simed_theme') || localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
      setIsDarkMode(shouldUseDark);
      if (shouldUseDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleThemeToggle = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        localStorage.setItem('simed_theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('simed_theme', 'light');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  }, []);

  const handleSearchFocus = () => {
    if (activeTab !== 'today') {
      setActiveTab('today');
    }
    setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const showToast = (title: string, description?: string, type: DynamicIslandAlert['type'] = 'info') => {
    setIslandAlert({
      id: String(Date.now()),
      title,
      message: description || '',
      type,
    });
  };

  // Real-time schedule data fetching with 30s auto-refresh
  const { data, error, isLoading, mutate } = useSWR<DisplayApiResponse>('/api/display', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // 1. Real-time Server-Sent Events (SSE) stream sync
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/stream/live');
      es.onmessage = (e) => {
        try {
          const res = JSON.parse(e.data);
          if (res && (res.doctors || res.shifts || res.leaves)) {
            mutate();
          }
        } catch {}
      };
      ['doctors', 'shifts', 'leaves', 'settings', 'broadcast'].forEach((evt) => {
        es?.addEventListener(evt, () => {
          mutate();
        });
      });
      es.onerror = () => {
        // Fail silently
      };
    } catch {}

    return () => {
      if (es) es.close();
    };
  }, [mutate]);

  // 2. Traffic Beacon Analytics Tracker
  useEffect(() => {
    try {
      const payload = JSON.stringify({
        path: window.location.pathname || '/jadwal',
        referrer: document.referrer || 'direct',
      });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/traffic/track', payload);
      } else {
        fetch('/api/traffic/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }, []);

  // 3. Offline Cache Persistence
  useEffect(() => {
    if (data && data.doctors && data.doctors.length > 0) {
      try {
        localStorage.setItem('simed_display_cache', JSON.stringify(data));
      } catch {}
    }
  }, [data]);

  const doctors: Doctor[] = data?.doctors || [];
  const shifts: Shift[] = data?.shifts || [];
  const leaves: LeaveRequest[] = data?.leaves || [];
  const broadcasts = data?.broadcasts || [];

  // Evaluate real-time doctor statuses using Admin Backend Algorithm
  const evaluatedDoctors = useMemo(() => {
    const now = new Date();
    const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentDayIdx = (wibTime.getUTCDay() + 6) % 7; // 0=Senin ... 6=Minggu
    const todayStr = toWibDateStr(now);

    const result: Doctor[] = [];

    doctors.forEach((doc) => {
      const evaluation = evaluateDoctorRealtimeStatus(doc, shifts, leaves, now);
      const todayShifts = shifts.filter(
        (s) =>
          s.doctorId === doc.id &&
          s.dayIdx === currentDayIdx &&
          !(s.disabledDates || []).includes(todayStr) &&
          isShiftActiveForDate(s.extra, wibTime)
      );

      if (todayShifts.length > 1) {
        // Multi-shift on the same day: create separate card per shift!
        todayShifts.forEach((s, sIdx) => {
          const shiftEvaluation = evaluateDoctorRealtimeStatus(doc, [s], leaves, now);
          const regTime = s.registrationTime || doc.registrationTime || null;
          result.push({
            ...doc,
            id: `${doc.id}-shift-${s.id || sIdx}`,
            originalDoctorId: doc.id,
            registrationTime: regTime,
            status: shiftEvaluation.status,
            activeLeave: shiftEvaluation.activeLeave || evaluation.activeLeave,
            todayShift: { ...s, registrationTime: regTime },
          });
        });
      } else {
        const todayShift = todayShifts[0];
        const regTime = todayShift?.registrationTime || doc.registrationTime || null;
        result.push({
          ...doc,
          originalDoctorId: doc.id,
          registrationTime: regTime,
          status: evaluation.status,
          activeLeave: evaluation.activeLeave,
          todayShift: todayShift ? { ...todayShift, registrationTime: regTime } : doc.todayShift,
        });
      }
    });

    return result;
  }, [doctors, shifts, leaves]);

  // STRICT FILTER: Only doctors who practice or have scheduled shifts or leave TODAY
  const todayOnlyDoctors = useMemo(() => {
    const list = evaluatedDoctors.filter((doc) => {
      const statusUpper = (doc.status || '').toUpperCase();
      const hasTodayShift = Boolean(doc.todayShift);
      const isLiveOrScheduled = statusUpper === 'PRAKTEK' || statusUpper === 'TERJADWAL';
      const isCutiToday = statusUpper.includes('CUTI') || Boolean(doc.activeLeave);

      return hasTodayShift || isLiveOrScheduled || isCutiToday;
    });
    return sortDoctorsBySchedule(list);
  }, [evaluatedDoctors]);

  // Extract unique specialties from today's active doctors
  const uniqueSpecialties = useMemo(() => {
    const set = new Set<string>();
    todayOnlyDoctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, [todayOnlyDoctors]);

  const handleToggleFavorite = (doctor: Doctor) => {
    const targetId = doctor.originalDoctorId || doctor.id;
    setFavoriteDoctorIds((prev) => {
      let updated: string[];
      const isFav = prev.includes(targetId);
      if (isFav) {
        updated = prev.filter((id) => id !== targetId);
        showToast('Dihapus dari Favorit', doctor.name, 'favorite');
      } else {
        updated = [...prev, targetId];
        showToast('Ditambahkan ke Favorit', doctor.name, 'favorite');
      }
      try {
        localStorage.setItem('simed_fav_doctors', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleShareDoctor = (doctor: Doctor) => {
    const shareData = {
      title: `Jadwal ${doctor.name} — RSU Siaga Medika Purbalingga`,
      text: `Jadwal Praktik ${doctor.name} (${doctor.specialty}) di RSU Siaga Medika Purbalingga.`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard?.writeText(
        `Jadwal Praktik ${doctor.name} (${doctor.specialty}) — RSU Siaga Medika Purbalingga: ${window.location.href}`
      );
      showToast('Tautan Disalin', 'Tautan jadwal dokter telah disalin ke clipboard', 'share');
    }
  };

  const handleCopyQueueCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    showToast('Kode Antrean Disalin', `Kode ${code} siap digunakan`, 'copy');
  };

  const handleManualRefresh = async () => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    setIslandMessage('Memperbarui Data...');
    await mutate();
    setIslandMessage('Pembaruan Selesai');
    setTimeout(() => setIslandMessage(null), 2500);
    setIsRefreshing(false);
    showToast('Data Diperbarui', 'Jadwal terkini berhasil disinkronkan', 'success');
  };

  // Filtered doctors based on search, status filter, and specialty filter (STRICTLY FROM TODAY'S DOCTORS)
  const filteredTodayDoctors = useMemo(() => {
    const list = todayOnlyDoctors.filter((doc) => {
      // Favorite filter
      if (statusFilter === 'favorite' && !favoriteDoctorIds.includes(doc.id)) {
        return false;
      }

      // Status filter
      if (statusFilter === 'praktek' && (doc.status || '').toUpperCase() !== 'PRAKTEK') {
        return false;
      }
      if (statusFilter === 'terjadwal' && (doc.status || '').toUpperCase() !== 'TERJADWAL') {
        return false;
      }
      if (statusFilter === 'cuti' && !(doc.status || '').toUpperCase().includes('CUTI')) {
        return false;
      }

      // Specialty filter
      if (specialtyFilter !== 'all' && doc.specialty !== specialtyFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesSpec = doc.specialty.toLowerCase().includes(q);
        if (!matchesName && !matchesSpec) return false;
      }

      return true;
    });
    return sortDoctorsBySchedule(list);
  }, [todayOnlyDoctors, statusFilter, specialtyFilter, searchQuery, favoriteDoctorIds]);

  // Group filtered doctors by operational state
  const livePraktekDoctors = useMemo(
    () => sortDoctorsBySchedule(filteredTodayDoctors.filter((d) => (d.status || '').toUpperCase() === 'PRAKTEK')),
    [filteredTodayDoctors]
  );
  const upcomingTerjadwalDoctors = useMemo(
    () => sortDoctorsBySchedule(filteredTodayDoctors.filter((d) => (d.status || '').toUpperCase() === 'TERJADWAL')),
    [filteredTodayDoctors]
  );
  const cutiDoctors = useMemo(
    () => sortDoctorsBySchedule(filteredTodayDoctors.filter((d) => (d.status || '').toUpperCase().includes('CUTI'))),
    [filteredTodayDoctors]
  );

  const handleTabChange = (tab: 'today' | 'weekly' | 'leaves') => {
    triggerHaptic('selection');
    setActiveTab(tab);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctorForModal(doctor);
    setIsModalOpen(true);
  };

  const handleOpenGeneralRegistration = () => {
    if (todayOnlyDoctors.length > 0) {
      setSelectedDoctorForModal(todayOnlyDoctors[0]);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="jadwal-container">
      {/* Top Dynamic Island Area (Unified Standby & Live Notification Morph) */}
      <DynamicIsland
        alert={islandAlert}
        onDismissAlert={() => setIslandAlert(null)}
        broadcasts={broadcasts}
        activeDoctorCount={evaluatedDoctors.filter((d) => d.status === 'PRAKTEK').length}
        totalDoctorCount={evaluatedDoctors.length}
      />

      {/* Apple iOS 27 Liquid Navigation Bar (Siaga Medika PBG - Ultra Compact) */}
      <JadwalNavbar
        isDarkMode={isDarkMode}
        onToggleTheme={handleThemeToggle}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
        onShare={() => {
          if (navigator.share) {
            navigator.share({
              title: 'Jadwal Dokter RSU Siaga Medika Purbalingga',
              text: 'Cek jadwal dokter spesialis real-time & pendaftaran online RSU Siaga Medika Purbalingga.',
              url: window.location.href,
            }).catch(() => {});
          } else {
            navigator.clipboard?.writeText(window.location.href);
            showToast('Tautan Disalin', 'Tautan portal jadwal telah disalin', 'share');
          }
        }}
        onSearchFocus={handleSearchFocus}
        todayCount={todayOnlyDoctors.length}
        leavesCount={leaves.length}
      />

      {/* Main Content View */}
      <main className="main-content main-content-padded">
        
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="ios-skeleton">
            <div className="ios27-glance-capsule-bar mb-20 skeleton-pulse" style={{ height: '44px' }} />
            <div className="platter skeleton-pulse mb-12" style={{ height: '88px' }} />
            <div className="platter skeleton-pulse mb-12" style={{ height: '88px' }} />
            <div className="platter skeleton-pulse" style={{ height: '88px' }} />
          </div>
        )}

        {/* Error Fallback */}
        {error && !isLoading && (
          <div className="ios-empty-state">
            <div className="ios-empty-coin error">
              <AlertTriangle size={32} />
            </div>
            <div className="ios-empty-title">Gagal Memuat Jadwal</div>
            <div className="ios-empty-sub">Terjadi kendala saat menyinkronkan data dari server.</div>
            <button type="button" className="empty-reset-btn" onClick={() => mutate()}>
              <RotateCcw size={16} />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* 1. TODAY'S VIEW (HANYA DOKTER PRAKTEK / JADWAL HARI INI) */}
        {!isLoading && !error && activeTab === 'today' && (
          <div className="today-view-wrapper">
            {/* iOS 27 Glance Metric Capsule Bar */}
            <BentoStats
              doctors={evaluatedDoctors}
              onFilterStatus={(st) => setStatusFilter(st)}
              activeStatus={statusFilter}
            />

            {/* Spotlight Search & Filter Bar */}
            <div className="search-and-filter-wrapper mb-20">
              {/* Search Bar Capsule */}
              <div className="ios-search-bar spotlight-search mb-12">
                <Search className="search-icon" size={17} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="ios-search-input"
                  placeholder="Cari dokter spesialis atau poliklinik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
                    ×
                  </button>
                )}
              </div>

              {/* Specialty & Favorites Filter Horizontal Strip (Zero Duplication) */}
              <div className="category-chips-row">
                <button
                  type="button"
                  className={`category-chip ${specialtyFilter === 'all' && statusFilter !== 'favorite' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSpecialtyFilter('all');
                    if (statusFilter === 'favorite') setStatusFilter('all');
                  }}
                >
                  <span>Semua Poliklinik</span>
                </button>

                {favoriteDoctorIds.length > 0 && (
                  <button
                    type="button"
                    className={`category-chip fav-chip ${statusFilter === 'favorite' ? 'active' : ''}`}
                    onClick={() => {
                      triggerHaptic('selection');
                      setStatusFilter(statusFilter === 'favorite' ? 'all' : 'favorite');
                    }}
                  >
                    <Star size={12} className="fill-star" />
                    <span>Favorit ({favoriteDoctorIds.length})</span>
                  </button>
                )}

                {/* Specialties dynamic chips */}
                {uniqueSpecialties.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    className={`category-chip spec-chip ${specialtyFilter === spec ? 'active' : ''}`}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSpecialtyFilter(specialtyFilter === spec ? 'all' : spec);
                    }}
                  >
                    <span>{spec}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Doctors List: ONLY TODAY'S DOCTORS */}
            {filteredTodayDoctors.length === 0 ? (
              <div className="ios-empty-state">
                <div className="ios-empty-coin">
                  <SearchX size={32} />
                </div>
                <div className="ios-empty-title">Tidak Ada Dokter Praktik</div>
                <div className="ios-empty-sub">
                  {statusFilter === 'favorite'
                    ? 'Belum ada dokter favorit Anda yang bertugas hari ini.'
                    : `Tidak ditemukan dokter yang praktik untuk filter "${searchQuery || specialtyFilter}".`}
                </div>
                <button
                  type="button"
                  className="empty-reset-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setSpecialtyFilter('all');
                  }}
                >
                  Tampilkan Semua Praktik Hari Ini
                </button>
              </div>
            ) : (
              <div className="platter-list-container">
                {/* 1. SEDANG PRAKTEK SEKARANG (LIVE NOW) */}
                {livePraktekDoctors.length > 0 && (
                  <section className="doctor-section mb-20">
                    <div className="section-header-pill live-section-pill">
                      <div className="section-title-wrap">
                        <span className="brand-live-pulse-dot" />
                        <h2 className="section-title">Sedang Praktik Sekarang</h2>
                      </div>
                      <span className="section-count live-count">{livePraktekDoctors.length} Dokter</span>
                    </div>
                    <div className="compact-platter-grid">
                      {livePraktekDoctors.map((doc) => (
                        <DoctorCard
                          key={doc.id}
                          doctor={doc}
                          isFavorite={favoriteDoctorIds.includes(doc.originalDoctorId || doc.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onSelectDoctor={handleDoctorSelect}
                          onShare={handleShareDoctor}
                          onCopyQueue={handleCopyQueueCode}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* 2. TERJADWAL NANTI HARI INI (UPCOMING TODAY) */}
                {upcomingTerjadwalDoctors.length > 0 && (
                  <section className="doctor-section mb-20">
                    <div className="section-header-pill">
                      <div className="section-title-wrap">
                        <Clock size={15} className="text-blue" />
                        <h2 className="section-title">Terjadwal Nanti Hari Ini</h2>
                      </div>
                      <span className="section-count">{upcomingTerjadwalDoctors.length} Dokter</span>
                    </div>
                    <div className="compact-platter-grid">
                      {upcomingTerjadwalDoctors.map((doc) => (
                        <DoctorCard
                          key={doc.id}
                          doctor={doc}
                          isFavorite={favoriteDoctorIds.includes(doc.originalDoctorId || doc.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onSelectDoctor={handleDoctorSelect}
                          onShare={handleShareDoctor}
                          onCopyQueue={handleCopyQueueCode}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. DOKTER CUTI HARI INI (ON LEAVE) */}
                {cutiDoctors.length > 0 && (
                  <section className="doctor-section mb-20">
                    <div className="section-header-pill">
                      <div className="section-title-wrap">
                        <CalendarX size={15} className="text-red" />
                        <h2 className="section-title">Sedang Cuti / Izin Hari Ini</h2>
                      </div>
                      <span className="section-count cuti-count">{cutiDoctors.length} Dokter</span>
                    </div>
                    <div className="compact-platter-grid">
                      {cutiDoctors.map((doc) => (
                        <DoctorCard
                          key={doc.id}
                          doctor={doc}
                          isFavorite={favoriteDoctorIds.includes(doc.originalDoctorId || doc.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onSelectDoctor={handleDoctorSelect}
                          onShare={handleShareDoctor}
                          onCopyQueue={handleCopyQueueCode}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. WEEKLY / KESELURUHAN VIEW */}
        {!isLoading && !error && activeTab === 'weekly' && (
          <WeeklyView
            doctors={evaluatedDoctors}
            shifts={shifts}
            leaves={leaves}
            onSelectDoctor={handleDoctorSelect}
          />
        )}

        {/* 3. LEAVES / CALENDAR VIEW */}
        {!isLoading && !error && activeTab === 'leaves' && (
          <LeavesCalendar leaves={leaves} doctors={evaluatedDoctors} />
        )}
      </main>

      {/* Registration Bottom Sheet Modal */}
      <RegistrationModal
        doctor={selectedDoctorForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onShowToast={(title, desc) => showToast(title, desc, 'copy')}
      />

      {/* Apple iOS 27 Native Bottom Navigation Bar */}
      <IosTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSearchFocus={handleSearchFocus}
        onOpenRegistration={handleOpenGeneralRegistration}
        todayCount={todayOnlyDoctors.filter((d) => d.status === 'PRAKTEK').length}
        leavesCount={leaves.length}
      />
    </div>
  );
}
