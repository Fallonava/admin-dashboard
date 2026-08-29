import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../lib/haptics';
import { Sun, Moon, ShieldCheck, RefreshCw, Share2 } from 'lucide-react';

interface JadwalNavbarProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
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
  isRefreshing = false,
  onRefresh,
  onShare,
}: JadwalNavbarProps) {
  // Live WIB clock telemetry
  const [wibTimeStr, setWibTimeStr] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

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

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 24;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`jadwal-dedicated-navbar ios27-header spatial-glass-header ${
        isScrolled ? 'is-scrolled' : 'is-top'
      }`}
    >
      <div className="jadwal-nav-inner">
        {/* Brand Group */}
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
                <ShieldCheck size={10.5} className="verified-icon" />
                <span>PBG</span>
              </span>
            </div>

            <div className="jadwal-brand-status-row">
              <span className="telemetry-live-pill">
                <span className="brand-live-pulse-dot" />
                <span className="telemetry-txt">{wibTimeStr || 'LIVE WIB'}</span>
              </span>
              <span className="telemetry-divider">·</span>
              <span className="jadwal-brand-sub">Portal Dokter Spesialis</span>
            </div>
          </div>
        </div>

        {/* Action Controls Capsule */}
        <div className="jadwal-nav-actions">
          {onRefresh && (
            <button
              type="button"
              className={`jadwal-nav-icon-btn refresh-btn ${isRefreshing ? 'is-refreshing' : ''}`}
              onClick={() => {
                triggerHaptic('light');
                onRefresh();
              }}
              title="Perbarui Jadwal Realtime"
              aria-label="Refresh Data Jadwal"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          )}

          {onShare && (
            <button
              type="button"
              className="jadwal-nav-icon-btn share-btn"
              onClick={() => {
                triggerHaptic('light');
                onShare();
              }}
              title="Bagikan Portal Jadwal"
              aria-label="Bagikan Jadwal"
            >
              <Share2 size={15} />
            </button>
          )}

          <button
            type="button"
            className="jadwal-nav-icon-btn theme-btn"
            onClick={() => {
              triggerHaptic('selection');
              onToggleTheme();
            }}
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap OLED'}
            aria-label="Ubah Tema Tampilan"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}
