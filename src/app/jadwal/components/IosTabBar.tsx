import React from 'react';
import { triggerHaptic } from '../lib/haptics';
import {
  Calendar,
  CalendarDays,
  CalendarOff,
  Search,
  UserPlus,
} from 'lucide-react';

interface IosTabBarProps {
  activeTab: 'today' | 'weekly' | 'leaves';
  onTabChange: (tab: 'today' | 'weekly' | 'leaves') => void;
  onSearchFocus?: () => void;
  onOpenRegistration?: () => void;
  todayCount?: number;
  leavesCount?: number;
}

export default function IosTabBar({
  activeTab,
  onTabChange,
  onSearchFocus,
  onOpenRegistration,
  todayCount = 0,
  leavesCount = 0,
}: IosTabBarProps) {
  return (
    <nav className="ios27-floating-tabbar-container" aria-label="Navigasi Utama">
      <div className="ios27-spatial-dock material-spatial-glass">
        {/* Top Specular Sheen on Dock */}
        <span className="dock-specular-highlight" aria-hidden="true" />

        {/* 1. Hari Ini */}
        <button
          type="button"
          className={`ios27-tab-item ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            onTabChange('today');
          }}
          aria-label="Jadwal Hari Ini"
        >
          <div className="ios27-tab-icon-wrap">
            <Calendar size={20} strokeWidth={activeTab === 'today' ? 2.4 : 1.8} />
            {todayCount > 0 && (
              <span className="ios27-tab-badge" aria-label={`${todayCount} dokter bertugas`}>
                {todayCount}
              </span>
            )}
          </div>
          <span className="ios27-tab-label">Hari Ini</span>
        </button>

        {/* 2. Keseluruhan */}
        <button
          type="button"
          className={`ios27-tab-item ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            onTabChange('weekly');
          }}
          aria-label="Jadwal Mingguan Keseluruhan"
        >
          <div className="ios27-tab-icon-wrap">
            <CalendarDays size={20} strokeWidth={activeTab === 'weekly' ? 2.4 : 1.8} />
          </div>
          <span className="ios27-tab-label">Keseluruhan</span>
        </button>

        {/* 3. TENGAH: SPOTLIGHT CARI DOKTER (Center Action Orb) */}
        {onSearchFocus && (
          <button
            type="button"
            className="ios27-tab-item ios27-tab-spotlight-action"
            onClick={() => {
              triggerHaptic('medium');
              onSearchFocus();
            }}
            aria-label="Cari Dokter Spesialis"
          >
            <div className="spotlight-dynamic-orb" title="Cari Dokter Spesialis">
              <Search size={18} strokeWidth={2.4} />
              <span className="spotlight-orb-glow" />
            </div>
            <span className="ios27-tab-label spotlight-lbl">Cari</span>
          </button>
        )}

        {/* 4. Jadwal Cuti */}
        <button
          type="button"
          className={`ios27-tab-item ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            onTabChange('leaves');
          }}
          aria-label="Jadwal Cuti Dokter"
        >
          <div className="ios27-tab-icon-wrap">
            <CalendarOff size={20} strokeWidth={activeTab === 'leaves' ? 2.4 : 1.8} />
            {leavesCount > 0 && (
              <span className="ios27-tab-badge badge-red" aria-label={`${leavesCount} dokter cuti`}>
                {leavesCount}
              </span>
            )}
          </div>
          <span className="ios27-tab-label">Cuti</span>
        </button>

        {/* 5. Daftar Online */}
        {onOpenRegistration && (
          <button
            type="button"
            className="ios27-tab-item"
            onClick={() => {
              triggerHaptic('selection');
              onOpenRegistration();
            }}
            aria-label="Pendaftaran Online Poliklinik"
          >
            <div className="ios27-tab-icon-wrap">
              <UserPlus size={20} strokeWidth={1.8} />
            </div>
            <span className="ios27-tab-label">Daftar</span>
          </button>
        )}
      </div>

      {/* Apple Native Home Indicator Floating Capsule */}
      <div className="ios27-home-indicator-wrap" aria-hidden="true">
        <div className="ios27-home-indicator-bar" />
      </div>
    </nav>
  );
}
