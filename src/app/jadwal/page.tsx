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
  Activity,
  Clock,
  CalendarX,
  CheckCircle2,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

import type { Doctor, Shift, LeaveRequest, DisplayApiResponse } from './types';
import { evaluateDoctorRealtimeStatus, isShiftActiveForDate } from './lib/schedule-utils';
import { triggerHaptic } from './lib/haptics';

import DynamicIsland, { DynamicIslandAlert } from './components/DynamicIsland';
import BentoStats from './components/BentoStats';
import DoctorCard from './components/DoctorCard';
import WeeklyView from './components/WeeklyView';
import LeavesCalendar from './components/LeavesCalendar';
import RegistrationModal from './components/RegistrationModal';
import Toast, { ToastMessage } from './components/Toast';
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
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [favoriteDoctorIds, setFavoriteDoctorIds] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
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

  const showToast = (title: string, description?: string, type: ToastMessage['type'] = 'info') => {
    setToast({
      id: String(Date.now()),
      title,
      description,
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
    const todayStr = `${wibTime.getUTCFullYear()}-${String(wibTime.getUTCMonth() + 1).padStart(2, '0')}-${String(wibTime.getUTCDate()).padStart(2, '0')}`;

    return doctors.map((doc) => {
      const evaluation = evaluateDoctorRealtimeStatus(doc, shifts, leaves, now);
      const todayShift = shifts.find(
        (s) =>
          s.doctorId === doc.id &&
          s.dayIdx === currentDayIdx &&
          !(s.disabledDates || []).includes(todayStr) &&
          isShiftActiveForDate(s.extra, wibTime)
      );
      return {
        ...doc,
        status: evaluation.status,
        activeLeave: evaluation.activeLeave,
        todayShift: todayShift || doc.todayShift,
      };
    });
  }, [doctors, shifts, leaves]);

  // Extract list of all unique specialties for filter chips
  const uniqueSpecialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, [doctors]);

  const handleToggleFavorite = (doctor: Doctor) => {
    setFavoriteDoctorIds((prev) => {
      let updated: string[];
      const isFav = prev.includes(doctor.id);
      if (isFav) {
        updated = prev.filter((id) => id !== doctor.id);
        showToast('Dihapus dari Favorit', doctor.name, 'favorite');
      } else {
        updated = [...prev, doctor.id];
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
    showToast('Kode Antrean Disalin', `Kode ${code} siap digunakan di pendaftaran`, 'copy');
  };

  const handleManualRefresh = async () => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
    showToast('Data Diperbarui', 'Jadwal terkini berhasil disinkronkan', 'success');
  };

  // Filtered doctors based on search, status filter, and specialty filter
  const filteredTodayDoctors = useMemo(() => {
    return evaluatedDoctors.filter((doc) => {
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
  }, [evaluatedDoctors, statusFilter, specialtyFilter, searchQuery, favoriteDoctorIds]);

  // Group filtered doctors by their operational status for intuitive display
  const livePraktekDoctors = useMemo(
    () => filteredTodayDoctors.filter((d) => (d.status || '').toUpperCase() === 'PRAKTEK'),
    [filteredTodayDoctors]
  );
  const upcomingTerjadwalDoctors = useMemo(
    () => filteredTodayDoctors.filter((d) => (d.status || '').toUpperCase() === 'TERJADWAL'),
    [filteredTodayDoctors]
  );
  const cutiDoctors = useMemo(
    () => filteredTodayDoctors.filter((d) => (d.status || '').toUpperCase().includes('CUTI')),
    [filteredTodayDoctors]
  );
  const otherDoctors = useMemo(
    () =>
      filteredTodayDoctors.filter(
        (d) =>
          !['PRAKTEK', 'TERJADWAL'].includes((d.status || '').toUpperCase()) &&
          !(d.status || '').toUpperCase().includes('CUTI')
      ),
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
    if (doctors.length > 0) {
      setSelectedDoctorForModal(doctors[0]);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="jadwal-container">
      {/* Top Dynamic Island Area */}
      <DynamicIsland
        alert={islandAlert}
        broadcasts={broadcasts}
        activeDoctorCount={evaluatedDoctors.filter((d) => d.status === 'PRAKTEK').length}
        totalDoctorCount={evaluatedDoctors.length}
      />

      {/* Apple iOS 27 Liquid Navigation Bar (Siaga Medika PBG) */}
      <JadwalNavbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
        todayCount={evaluatedDoctors.filter((d) => d.status === 'PRAKTEK' || d.status === 'TERJADWAL').length}
        leavesCount={leaves.length}
      />

      {/* Main Content View */}
      <main className="main-content main-content-padded">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="ios-skeleton">
            <div className="bento-grid mb-24">
              <div className="bento-card-main skeleton-pulse" style={{ height: '110px' }}></div>
              <div className="bento-card-main skeleton-pulse" style={{ height: '110px' }}></div>
            </div>
            <div className="platter skeleton-pulse" style={{ height: '140px', marginBottom: '16px' }}></div>
            <div className="platter skeleton-pulse" style={{ height: '140px' }}></div>
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

        {/* 1. TODAY'S VIEW (KONSEP JADWAL HARI INI TEPAT) */}
        {!isLoading && !error && activeTab === 'today' && (
          <div className="today-view-wrapper">
            {/* Bento Stats */}
            <BentoStats doctors={evaluatedDoctors} />

            {/* Search & Category Filter Chips */}
            <div className="search-and-filter-wrapper mb-24">
              {/* Search Bar Capsule */}
              <div className="ios-search-bar mb-16">
                <Search className="search-icon" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="ios-search-input"
                  placeholder="Cari nama dokter atau poliklinik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter Chips Row */}
              <div className="category-chips-row mb-12">
                <button
                  type="button"
                  className={`category-chip ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setStatusFilter('all');
                  }}
                >
                  Semua ({evaluatedDoctors.length})
                </button>

                <button
                  type="button"
                  className={`category-chip ${statusFilter === 'praktek' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setStatusFilter('praktek');
                  }}
                >
                  <span className="status-dot st-dot-green" />
                  <span>Sedang Praktik ({evaluatedDoctors.filter((d) => d.status === 'PRAKTEK').length})</span>
                </button>

                <button
                  type="button"
                  className={`category-chip ${statusFilter === 'terjadwal' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setStatusFilter('terjadwal');
                  }}
                >
                  <Clock size={13} />
                  <span>Terjadwal ({evaluatedDoctors.filter((d) => d.status === 'TERJADWAL').length})</span>
                </button>

                <button
                  type="button"
                  className={`category-chip ${statusFilter === 'cuti' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setStatusFilter('cuti');
                  }}
                >
                  <CalendarX size={13} />
                  <span>Cuti ({evaluatedDoctors.filter((d) => (d.status || '').includes('CUTI')).length})</span>
                </button>

                {favoriteDoctorIds.length > 0 && (
                  <button
                    type="button"
                    className={`category-chip fav-chip ${statusFilter === 'favorite' ? 'active' : ''}`}
                    onClick={() => {
                      triggerHaptic('selection');
                      setStatusFilter('favorite');
                    }}
                  >
                    <Star size={13} className="fill-star" />
                    <span>Favorit ({favoriteDoctorIds.length})</span>
                  </button>
                )}
              </div>

              {/* Specialty Filter Horizontal Strip */}
              <div className="category-chips-row">
                <button
                  type="button"
                  className={`category-chip spec-chip ${specialtyFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSpecialtyFilter('all');
                  }}
                >
                  Semua Poliklinik
                </button>
                {uniqueSpecialties.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    className={`category-chip spec-chip ${specialtyFilter === spec ? 'active' : ''}`}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSpecialtyFilter(spec);
                    }}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctors List Grouped by Operational State */}
            {filteredTodayDoctors.length === 0 ? (
              <div className="ios-empty-state">
                <div className="ios-empty-coin">
                  <SearchX size={32} />
                </div>
                <div className="ios-empty-title">Dokter Tidak Ditemukan</div>
                <div className="ios-empty-sub">
                  {statusFilter === 'favorite'
                    ? 'Belum ada dokter yang ditambahkan ke favorit. Tekan ikon bintang pada kartu dokter untuk menyimpannya.'
                    : `Tidak ada dokter yang cocok dengan filter atau kata kunci "${searchQuery}".`}
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
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="platter-list-container">
                {/* 1. SEDANG PRAKTEK SEKARANG (LIVE NOW) */}
                {livePraktekDoctors.length > 0 && (
                  <section className="doctor-section mb-24">
                    <div className="section-header-pill live-section-pill">
                      <div className="section-title-wrap">
                        <span className="brand-live-pulse-dot" />
                        <h2 className="section-title">Sedang Praktik Sekarang</h2>
                      </div>
                      <span className="section-count live-count">{livePraktekDoctors.length} Dokter</span>
                    </div>
                    <div className="platter-grid">
                      {livePraktekDoctors.map((doc) => (
                        <DoctorCard
                          key={doc.id}
                          doctor={doc}
                          isFavorite={favoriteDoctorIds.includes(doc.id)}
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
                  <section className="doctor-section mb-24">
                    <div className="section-header-pill">
                      <div className="section-title-wrap">
                        <Clock size={16} className="text-blue" />
                        <h2 className="section-title">Terjadwal Nanti Hari Ini</h2>
                      </div>
                      <span className="section-count">{upcomingTerjadwalDoctors.length} Dokter</span>
                    </div>
                    <div className="platter-grid">
                      {upcomingTerjadwalDoctors.map((doc) => (
                        <DoctorCard
                          key={doc.id}
                          doctor={doc}
                          isFavorite={favoriteDoctorIds.includes(doc.id)}
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
                  <section className="doctor-section mb-24">
                    <div className="section-header-pill">
                      <div className="section-title-wrap">
                        <CalendarX size={16} className="text-red" />
                        <h2 className="section-title">Sedang Cuti / Izin Hari Ini</h2>
                      </div>
                      <span className="section-count cuti-count">{cutiDoctors.length} Dokter</span>
                    </div>
                    <div className="platter-grid">
                      {cutiDoctors.map((doc) => (
                        <DoctorCard
                          key={doc.id}
                          doctor={doc}
                          isFavorite={favoriteDoctorIds.includes(doc.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onSelectDoctor={handleDoctorSelect}
                          onShare={handleShareDoctor}
                          onCopyQueue={handleCopyQueueCode}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* 4. DOKTER POLIKLINIK LAINNYA / LIBUR HARI INI */}
                {otherDoctors.length > 0 && (statusFilter === 'all' || specialtyFilter !== 'all' || searchQuery) && (
                  <section className="doctor-section mb-24">
                    <div className="section-header-pill">
                      <div className="section-title-wrap">
                        <Stethoscope size={16} className="text-mute" />
                        <h2 className="section-title">Dokter Poliklinik Terkait</h2>
                      </div>
                      <span className="section-count">{otherDoctors.length} Dokter</span>
                    </div>
                    <div className="platter-grid">
                      {otherDoctors.map((doc) => (
                        <DoctorCard
                          key={doc.id}
                          doctor={doc}
                          isFavorite={favoriteDoctorIds.includes(doc.id)}
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

      {/* Floating Dynamic Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

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
        todayCount={evaluatedDoctors.filter((d) => d.status === 'PRAKTEK').length}
        leavesCount={leaves.length}
      />
    </div>
  );
}
