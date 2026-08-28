"use client";

import './jadwal.css';
import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Search, RotateCcw, AlertTriangle, ShieldCheck, Activity, SearchX } from 'lucide-react';

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

const fetcher = async (url: string): Promise<DisplayApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal mengambil data jadwal');
  return res.json();
};

export default function JadwalPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'leaves'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bedah' | 'non-bedah'>('all');
  const [selectedDoctorForModal, setSelectedDoctorForModal] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [islandAlert, setIslandAlert] = useState<DynamicIslandAlert | null>(null);

  // Real-time schedule data fetching with 30s auto-refresh
  const { data, error, isLoading, mutate } = useSWR<DisplayApiResponse>('/api/display', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const doctors: Doctor[] = data?.doctors || [];
  const shifts: Shift[] = data?.shifts || [];
  const leaves: LeaveRequest[] = data?.leaves || [];

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

  // Today View Filtered Doctors
  const filteredTodayDoctors = useMemo(() => {
    return evaluatedDoctors.filter((doc) => {
      // Category filter
      const isSurgeon = isSurgeonSpecialty(doc.specialty);
      if (selectedCategory === 'bedah' && !isSurgeon) return false;
      if (selectedCategory === 'non-bedah' && isSurgeon) return false;

      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesSpec = doc.specialty.toLowerCase().includes(q);
        if (!matchesName && !matchesSpec) return false;
      }

      return true;
    });
  }, [evaluatedDoctors, selectedCategory, searchQuery]);

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
      <DynamicIsland alert={islandAlert} activeDoctorCount={evaluatedDoctors.filter((d) => d.status === 'PRAKTEK').length} />

      {/* iOS Nav Header */}
      <header className="ios-nav-header material-regular">
        <div className="ios-brand-group">
          <div className="ios-logo-coin">
            <img src="/icon.svg" alt="RSU Siaga Medika" className="logo-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div className="ios-title-group">
            <div className="brand-title-row">
              <h1 className="brand-title">Jadwal Praktik</h1>
              <span className="brand-city-tag">Pemalang</span>
            </div>
            <div className="brand-sub-row">
              <span className="brand-live-dot"></span>
              <span className="brand-subtitle">Real-time Sinkronisasi</span>
            </div>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="ios-mode-switcher ios-mode-switcher-margin">
          <button
            className={`ios-mode-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => handleTabChange('today')}
          >
            Hari Ini
          </button>
          <button
            className={`ios-mode-btn ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => handleTabChange('weekly')}
          >
            Keseluruhan
          </button>
          <button
            className={`ios-mode-btn ${activeTab === 'leaves' ? 'active' : ''}`}
            onClick={() => handleTabChange('leaves')}
          >
            Jadwal Cuti
          </button>
        </div>
      </header>

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
            <button className="empty-reset-btn" onClick={() => mutate()}>
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
                  <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                    ×
                  </button>
                )}
              </div>

              {/* Category Chips */}
              <div className="category-chips-row">
                <button
                  className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedCategory('all');
                  }}
                >
                  Semua Poli ({evaluatedDoctors.length})
                </button>
                <button
                  className={`category-chip ${selectedCategory === 'non-bedah' ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedCategory('non-bedah');
                  }}
                >
                  Rawat Jalan / Non-Bedah ({evaluatedDoctors.filter((d) => !isSurgeonSpecialty(d.specialty)).length})
                </button>
                <button
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
                  Tidak ada dokter yang cocok dengan kata kunci pencarian "{searchQuery}".
                </div>
                <button
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
                        <DoctorCard key={doc.id} doctor={doc} onSelectDoctor={handleDoctorSelect} />
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
                        <DoctorCard key={doc.id} doctor={doc} onSelectDoctor={handleDoctorSelect} />
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
      />

      {/* Floating Bottom Dock */}
      <FloatingDock onOpenGeneralRegistration={handleOpenGeneralRegistration} />
    </div>
  );
}
