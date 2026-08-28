"use client";

import './jadwal.css';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { Search, RotateCcw, AlertTriangle, SearchX, Star, Sparkles, Share2 } from 'lucide-react';

import type { Doctor, Shift, LeaveRequest, DisplayApiResponse } from './types';
import { evaluateDoctorRealtimeStatus, isSurgeonSpecialty } from './lib/schedule-utils';
import { triggerHaptic } from './lib/haptics';

import DynamicIsland, { DynamicIslandAlert } from './components/DynamicIsland';
import BentoStats from './components/BentoStats';
import DoctorCard from './components/DoctorCard';
import WeeklyView from './components/WeeklyView';
import LeavesCalendar from './components/LeavesCalendar';
import RegistrationModal from './components/RegistrationModal';
import FloatingDock from './components/FloatingDock';
import Toast, { ToastMessage } from './components/Toast';
import JadwalNavbar from './components/JadwalNavbar';

const fetcher = async (url: string): Promise<DisplayApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal mengambil data jadwal');
  return res.json();
};

export default function JadwalPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'leaves'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bedah' | 'non-bedah' | 'favorite'>('all');
  const [selectedDoctorForModal, setSelectedDoctorForModal] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [islandAlert, setIslandAlert] = useState<DynamicIslandAlert | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [favoriteDoctorIds, setFavoriteDoctorIds] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Initialize theme and favorites from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('simed_fav_doctors');
      if (savedFavs) {
        setFavoriteDoctorIds(JSON.parse(savedFavs));
      }
      const savedTheme = localStorage.getItem('simed_theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
      setIsDarkMode(shouldUseDark);
      if (shouldUseDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
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
        localStorage.setItem('simed_theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('simed_theme', 'light');
      }
      return next;
    });
  }, []);

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

  const doctors: Doctor[] = data?.doctors || [];
  const shifts: Shift[] = data?.shifts || [];
  const leaves: LeaveRequest[] = data?.leaves || [];
  const broadcasts = data?.broadcasts || [];

  // Evaluate real-time doctor statuses
  const evaluatedDoctors = useMemo(() => {
    const now = new Date();
    return doctors.map((doc) => {
      const evaluation = evaluateDoctorRealtimeStatus(doc, shifts, leaves, now);
      const todayShift = shifts.find(
        (s) => s.doctorId === doc.id && (s.dayIdx === now.getDay() || (now.getDay() === 0 && s.dayIdx === 7))
      );
      return {
        ...doc,
        status: evaluation.status,
        activeLeave: evaluation.activeLeave,
        todayShift,
      };
    });
  }, [doctors, shifts, leaves]);

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
      title: `Jadwal ${doctor.name} — RSU Siaga Medika`,
      text: `Jadwal Praktik ${doctor.name} (${doctor.specialty}) di RSU Siaga Medika Pemalang.`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard?.writeText(
        `Jadwal Praktik ${doctor.name} (${doctor.specialty}) — RSU Siaga Medika Pemalang: ${window.location.href}`
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
    await mutate();
    setIsRefreshing(false);
    showToast('Data Diperbarui', 'Jadwal terkini berhasil disinkronkan', 'success');
  };

  // Today View Filtered Doctors
  const filteredTodayDoctors = useMemo(() => {
    return evaluatedDoctors.filter((doc) => {
      // Favorite filter
      if (selectedCategory === 'favorite') {
        if (!favoriteDoctorIds.includes(doc.id)) return false;
      } else {
        // Category filter
        const isSurgeon = isSurgeonSpecialty(doc.specialty);
        if (selectedCategory === 'bedah' && !isSurgeon) return false;
        if (selectedCategory === 'non-bedah' && isSurgeon) return false;
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
  }, [evaluatedDoctors, selectedCategory, searchQuery, favoriteDoctorIds]);

  // Split into Bedah & Non-Bedah groups
  const bedahDoctors = useMemo(
    () => filteredTodayDoctors.filter((d) => isSurgeonSpecialty(d.specialty)),
    [filteredTodayDoctors]
  );
  const nonBedahDoctors = useMemo(
    () => filteredTodayDoctors.filter((d) => !isSurgeonSpecialty(d.specialty)),
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

      {/* Dedicated iOS 27 Jadwal Navbar */}
      <JadwalNavbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDarkMode={isDarkMode}
        onToggleTheme={handleThemeToggle}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
        onShare={() => {
          if (navigator.share) {
            navigator
              .share({
                title: 'Jadwal Praktik Dokter — RSU Siaga Medika Pemalang',
                text: 'Cek jadwal dokter spesialis, jadwal cuti, dan pendaftaran online RSU Siaga Medika Pemalang.',
                url: window.location.href,
              })
              .catch(() => {});
          } else {
            navigator.clipboard?.writeText(window.location.href);
            showToast('Tautan Disalin', 'Tautan portal jadwal telah disalin ke clipboard', 'share');
          }
        }}
        todayCount={evaluatedDoctors.filter((d) => d.status === 'PRAKTEK').length}
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

        {/* 1. TODAY'S VIEW */}
        {!isLoading && !error && activeTab === 'today' && (
          <div className="today-view-wrapper">
            {/* Bento Stats */}
            <BentoStats doctors={evaluatedDoctors} />

            {/* Search & Category Filter Chips */}
            <div className="search-and-filter-wrapper mb-24">
              <div className="ios-search-bar mb-24">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  className="ios-search-input"
                  placeholder="Cari nama dokter atau spesialis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
                    ×
                  </button>
                )}
              </div>

              {/* Category Chips */}
              <div className="category-chips-row">
                <button
                  type="button"
                  className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedCategory('all');
                  }}
                >
                  Semua Poli ({evaluatedDoctors.length})
                </button>

                {favoriteDoctorIds.length > 0 && (
                  <button
                    type="button"
                    className={`category-chip fav-chip ${selectedCategory === 'favorite' ? 'active' : ''}`}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedCategory('favorite');
                    }}
                  >
                    <Star size={13} className="fill-star" />
                    <span>Favorit ({favoriteDoctorIds.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  className={`category-chip ${selectedCategory === 'non-bedah' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedCategory('non-bedah');
                  }}
                >
                  Rawat Jalan / Non-Bedah ({evaluatedDoctors.filter((d) => !isSurgeonSpecialty(d.specialty)).length})
                </button>
                <button
                  type="button"
                  className={`category-chip ${selectedCategory === 'bedah' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedCategory('bedah');
                  }}
                >
                  Poli Bedah ({evaluatedDoctors.filter((d) => isSurgeonSpecialty(d.specialty)).length})
                </button>
              </div>
            </div>

            {/* Doctors List */}
            {filteredTodayDoctors.length === 0 ? (
              <div className="ios-empty-state">
                <div className="ios-empty-coin">
                  <SearchX size={32} />
                </div>
                <div className="ios-empty-title">Dokter Tidak Ditemukan</div>
                <div className="ios-empty-sub">
                  {selectedCategory === 'favorite'
                    ? 'Belum ada dokter yang ditambahkan ke favorit. Tekan ikon bintang pada kartu dokter untuk menyimpannya.'
                    : `Tidak ada dokter yang cocok dengan kata kunci pencarian "${searchQuery}".`}
                </div>
                <button
                  type="button"
                  className="empty-reset-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="platter-list-container">
                {/* Non-Bedah Section */}
                {nonBedahDoctors.length > 0 && selectedCategory !== 'bedah' && (
                  <section className="doctor-section mb-24">
                    <div className="section-header-pill">
                      <h2 className="section-title">Poliklinik Rawat Jalan</h2>
                      <span className="section-count">{nonBedahDoctors.length} Dokter</span>
                    </div>
                    <div className="platter-grid">
                      {nonBedahDoctors.map((doc) => (
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

                {/* Bedah Section */}
                {bedahDoctors.length > 0 && selectedCategory !== 'non-bedah' && (
                  <section className="doctor-section mb-24">
                    <div className="section-header-pill">
                      <h2 className="section-title">Poliklinik Bedah</h2>
                      <span className="section-count">{bedahDoctors.length} Dokter</span>
                    </div>
                    <div className="platter-grid">
                      {bedahDoctors.map((doc) => (
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

      {/* Floating Bottom Dock */}
      <FloatingDock
        onOpenGeneralRegistration={handleOpenGeneralRegistration}
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
