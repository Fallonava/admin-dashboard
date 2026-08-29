import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../lib/haptics';
import { Sun, Moon, ShieldCheck } from 'lucide-react';

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
        {/* Top Brand Toolbar (Ultra Clean Apple iOS 27 Layout) */}
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
                <span className="jadwal-brand-sub">Portal Dokter Spesialis</span>
              </div>
            </div>
          </div>

          {/* Right Area: Clean Theme Toggle Capsule */}
          <div className="jadwal-nav-actions">
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
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
