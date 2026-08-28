import React from 'react';
import { triggerHaptic } from '../lib/haptics';
import { RotateCcw, Sun, Moon, PhoneCall, Share2, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface JadwalNavbarProps {
  activeTab: 'today' | 'weekly' | 'leaves';
  onTabChange: (tab: 'today' | 'weekly' | 'leaves') => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onShare?: () => void;
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
  todayCount = 0,
  leavesCount = 0,
}: JadwalNavbarProps) {
  return (
    <header className="jadwal-dedicated-navbar material-regular">
      {/* Top Brand & Utility Toolbar */}
      <div className="jadwal-nav-top-row">
        {/* Hospital Branding */}
        <div className="jadwal-brand-group">
          <div className="jadwal-brand-logo-squircle">
            <img
              src="/icon.svg"
              alt="RSU Siaga Medika"
              className="jadwal-brand-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="jadwal-brand-meta">
            <div className="jadwal-brand-title-row">
              <span className="jadwal-brand-title">RSU Siaga Medika</span>
              <span className="jadwal-verified-pill" title="Terverifikasi Resmi">
                <ShieldCheck size={11} className="verified-icon" />
                <span>Pemalang</span>
              </span>
            </div>
            <div className="jadwal-brand-status-row">
              <span className="brand-live-pulse-dot"></span>
              <span className="jadwal-brand-sub">Jadwal Praktik Real-time</span>
            </div>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="jadwal-nav-actions">
          {/* Emergency Hotline Button */}
          <a
            href="tel:0284321888"
            className="jadwal-nav-icon-btn hotline-btn"
            title="Call Center IGD / Informasi (0284) 321888"
            onClick={() => triggerHaptic('light')}
          >
            <PhoneCall size={16} />
          </a>

          {/* Share Portal Button */}
          {onShare && (
            <button
              type="button"
              className="jadwal-nav-icon-btn"
              onClick={() => {
                triggerHaptic('light');
                onShare();
              }}
              title="Bagikan Portal Jadwal"
            >
              <Share2 size={16} />
            </button>
          )}

          {/* Theme Switcher Button */}
          <button
            type="button"
            className="jadwal-nav-icon-btn"
            onClick={() => {
              triggerHaptic('selection');
              onToggleTheme();
            }}
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            className={`jadwal-nav-icon-btn refresh-btn ${isRefreshing ? 'is-spinning' : ''}`}
            onClick={() => {
              triggerHaptic('medium');
              onRefresh();
            }}
            title="Sinkronkan Jadwal Terbaru"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Segmented Control Bar */}
      <div className="jadwal-segmented-track">
        <button
          type="button"
          className={`jadwal-seg-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => onTabChange('today')}
        >
          <span>Hari Ini</span>
          {todayCount > 0 && <span className="seg-badge">{todayCount}</span>}
        </button>

        <button
          type="button"
          className={`jadwal-seg-btn ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => onTabChange('weekly')}
        >
          <span>Keseluruhan</span>
        </button>

        <button
          type="button"
          className={`jadwal-seg-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => onTabChange('leaves')}
        >
          <span>Jadwal Cuti</span>
          {leavesCount > 0 && <span className="seg-badge red">{leavesCount}</span>}
        </button>
      </div>
    </header>
  );
}
