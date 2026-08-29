import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../lib/haptics';
import {
  RotateCcw,
  Sun,
  Moon,
  PhoneCall,
  Share2,
  Search,
  ShieldCheck,
} from 'lucide-react';

interface JadwalNavbarProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onShare?: () => void;
  onSearchFocus?: () => void;
  todayCount?: number;
  leavesCount?: number;
  activeTab?: 'today' | 'weekly' | 'leaves';
  onTabChange?: (tab: 'today' | 'weekly' | 'leaves') => void;
}

export default function JadwalNavbar({
  isDarkMode,
  onToggleTheme,
  isRefreshing,
  onRefresh,
  onShare,
  onSearchFocus,
}: JadwalNavbarProps) {
  // Live WIB clock telemetry
  const [wibTimeStr, setWibTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setWibTimeStr(`${timeFormatter.format(now)} WIB`);
    };
    updateTime();
    const timer = setInterval(updateTime, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="jadwal-dedicated-navbar ios27-header spatial-glass-header compact-header-2027">
      <div className="jadwal-nav-inner">
        {/* Top Brand & Utility Toolbar (2027 Spatial Specular Layer) */}
        <div className="jadwal-nav-top-row">
          {/* Hospital Branding (Siaga Medika PBG) */}
          <div className="jadwal-brand-group">
            <div className="jadwal-brand-logo-squircle" aria-hidden="true">
              <img
                src="/logo-rs.png"
                alt="RSU Siaga Medika Purbalingga"
                className="jadwal-brand-img"
                onError={(e) => {
                  e.currentTarget.src = '/logo-rs-orig.png';
                }}
              />
              <span className="logo-specular-sheen" />
            </div>

            <div className="jadwal-brand-meta">
              <div className="jadwal-brand-title-row">
                <span className="jadwal-brand-title">RSU Siaga Medika</span>
                <span className="jadwal-verified-pill pbg-pill" title="Terverifikasi Resmi RS Purbalingga">
                  <ShieldCheck size={11} className="verified-icon" />
                  <span>PBG</span>
                </span>
              </div>

              <div className="jadwal-brand-status-row">
                <span className="telemetry-live-pill">
                  <span className="brand-live-pulse-dot" />
                  <span className="telemetry-txt">{wibTimeStr || 'LIVE WIB'}</span>
                </span>
                <span className="telemetry-divider">·</span>
                <span className="jadwal-brand-sub">Live Jadwal Dokter</span>
              </div>
            </div>
          </div>

          {/* Right Toolbar Actions (2027 Micro Glass Capsule) */}
          <div className="jadwal-nav-actions">
            {/* Emergency Hotline Button PBG (High Priority Pulse) */}
            <a
              href="tel:0281891888"
              className="jadwal-nav-icon-btn hotline-btn 2027-emergency-btn"
              title="IGD 24 Jam Siaga Medika PBG (0281) 891888"
              onClick={() => triggerHaptic('medium')}
              aria-label="Telepon IGD (0281) 891888"
            >
              <PhoneCall size={14} />
              <span className="emergency-txt-mini">IGD</span>
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
              title="Sinkronkan Jadwal Real-time"
              aria-label="Sinkronkan Jadwal Real-time"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
