import React from 'react';
import { triggerHaptic } from '../lib/haptics';
import { RotateCcw, Sun, Moon, PhoneCall, Share2, Search, ShieldCheck } from 'lucide-react';

interface JadwalNavbarProps {
  activeTab: 'today' | 'weekly' | 'leaves';
  onTabChange: (tab: 'today' | 'weekly' | 'leaves') => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onShare?: () => void;
  onSearchFocus?: () => void;
  todayCount?: number;
  leavesCount?: number;
}

export default function JadwalNavbar({
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleTheme,
  isRefreshing,
  onRefresh,
  onShare,
  onSearchFocus,
  todayCount = 0,
  leavesCount = 0,
}: JadwalNavbarProps) {
  return (
    <header className="jadwal-dedicated-navbar ios27-header">
      <div className="jadwal-nav-inner">
        {/* Top Brand & Utility Toolbar (Ultra-Compact iOS 27 Platter) */}
        <div className="jadwal-nav-top-row">
          {/* Hospital Branding (Siaga Medika PBG) */}
          <div className="jadwal-brand-group">
            <div className="jadwal-brand-logo-squircle" aria-hidden="true">
              <img
                src="/icon.svg"
                alt="RSU Siaga Medika Purbalingga"
                className="jadwal-brand-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="jadwal-brand-meta">
              <div className="jadwal-brand-title-row">
                <span className="jadwal-brand-title">RSU Siaga Medika</span>
                <span className="jadwal-verified-pill pbg-pill" title="Terverifikasi Resmi PBG">
                  <ShieldCheck size={10.5} className="verified-icon" />
                  <span>PBG</span>
                </span>
              </div>
              <div className="jadwal-brand-status-row">
                <span className="brand-live-pulse-dot" />
                <span className="jadwal-brand-sub">Purbalingga · Live Jadwal</span>
              </div>
            </div>
          </div>

          {/* Right Toolbar Actions */}
          <div className="jadwal-nav-actions">
            {/* Emergency Hotline Button PBG */}
            <a
              href="tel:0281891888"
              className="jadwal-nav-icon-btn hotline-btn"
              title="IGD & Informasi Siaga Medika PBG (0281) 891888"
              onClick={() => triggerHaptic('light')}
              aria-label="Call Center IGD (0281) 891888"
            >
              <PhoneCall size={15} />
            </a>

            {/* Search Shortcut */}
            {onSearchFocus && (
              <button
                type="button"
                className="jadwal-nav-icon-btn"
                onClick={() => {
                  triggerHaptic('selection');
                  onSearchFocus();
                }}
                title="Cari Dokter / Spesialis"
                aria-label="Cari Dokter Spesialis"
              >
                <Search size={15} />
              </button>
            )}

            {/* Share Portal */}
            {onShare && (
              <button
                type="button"
                className="jadwal-nav-icon-btn"
                onClick={() => {
                  triggerHaptic('light');
                  onShare();
                }}
                title="Bagikan Portal Jadwal"
                aria-label="Bagikan Jadwal Dokter"
              >
                <Share2 size={15} />
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              className="jadwal-nav-icon-btn theme-btn"
              onClick={() => {
                triggerHaptic('selection');
                onToggleTheme();
              }}
              title={isDarkMode ? 'Mode Terang' : 'Mode OLED Gelap'}
              aria-label="Ubah Tema Tampilan"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Refresh Sync */}
            <button
              type="button"
              className={`jadwal-nav-icon-btn refresh-btn ${isRefreshing ? 'is-spinning' : ''}`}
              onClick={() => {
                triggerHaptic('medium');
                onRefresh();
              }}
              title="Sinkronkan Jadwal Terbaru"
              aria-label="Sinkronkan Jadwal Terbaru"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Apple iOS 27 Liquid Segmented Control Bar */}
        <div className="jadwal-segmented-track" role="tablist" aria-label="Pilihan Jadwal">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'today'}
            className={`jadwal-seg-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('selection');
              onTabChange('today');
            }}
          >
            <span>Hari Ini</span>
            {todayCount > 0 && <span className="seg-badge">{todayCount}</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'weekly'}
            className={`jadwal-seg-btn ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('selection');
              onTabChange('weekly');
            }}
          >
            <span>Keseluruhan</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'leaves'}
            className={`jadwal-seg-btn ${activeTab === 'leaves' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('selection');
              onTabChange('leaves');
            }}
          >
            <span>Jadwal Cuti</span>
            {leavesCount > 0 && <span className="seg-badge red">{leavesCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
