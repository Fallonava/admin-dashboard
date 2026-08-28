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
  // ponytail: standard native tabbar pattern with pure css liquid glass and haptic touch
  return (
    <nav className="ios27-tabbar-container" aria-label="Navigasi Utama">
      <div className="ios27-tabbar material-regular">
        {/* Tab 1: Hari Ini */}
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
            <Calendar size={22} strokeWidth={activeTab === 'today' ? 2.4 : 1.8} />
            {todayCount > 0 && (
              <span className="ios27-tab-badge" aria-label={`${todayCount} dokter praktek`}>
                {todayCount}
              </span>
            )}
          </div>
          <span className="ios27-tab-label">Hari Ini</span>
        </button>

        {/* Tab 2: Keseluruhan */}
        <button
          type="button"
          className={`ios27-tab-item ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('selection');
            onTabChange('weekly');
          }}
          aria-label="Jadwal Keseluruhan"
        >
          <div className="ios27-tab-icon-wrap">
            <CalendarDays size={22} strokeWidth={activeTab === 'weekly' ? 2.4 : 1.8} />
          </div>
          <span className="ios27-tab-label">Keseluruhan</span>
        </button>

        {/* Tab 3: Quick Action Center (Daftar / Registrasi Cepat) */}
        {onOpenRegistration && (
          <button
            type="button"
            className="ios27-tab-item ios27-tab-primary-action"
            onClick={() => {
              triggerHaptic('medium');
              onOpenRegistration();
            }}
            aria-label="Daftar Online Poliklinik"
          >
            <div className="ios27-primary-action-pill">
              <UserPlus size={18} strokeWidth={2.4} />
              <span className="ios27-primary-action-txt">Daftar</span>
            </div>
          </button>
        )}

        {/* Tab 4: Cuti Dokter */}
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
            <CalendarOff size={22} strokeWidth={activeTab === 'leaves' ? 2.4 : 1.8} />
            {leavesCount > 0 && (
              <span className="ios27-tab-badge badge-red" aria-label={`${leavesCount} dokter cuti`}>
                {leavesCount}
              </span>
            )}
          </div>
          <span className="ios27-tab-label">Cuti</span>
        </button>

        {/* Tab 5: Cari Dokter */}
        {onSearchFocus && (
          <button
            type="button"
            className="ios27-tab-item"
            onClick={() => {
              triggerHaptic('selection');
              onSearchFocus();
            }}
            aria-label="Cari Dokter Spesialis"
          >
            <div className="ios27-tab-icon-wrap">
              <Search size={22} strokeWidth={1.8} />
            </div>
            <span className="ios27-tab-label">Cari</span>
          </button>
        )}
      </div>

      {/* Apple Native Home Indicator Bar */}
      <div className="ios27-home-indicator-wrap" aria-hidden="true">
        <div className="ios27-home-indicator-bar" />
      </div>
    </nav>
  );
}
