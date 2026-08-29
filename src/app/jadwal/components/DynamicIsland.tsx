import React, { useEffect, useState } from 'react';
import { triggerHaptic } from '../lib/haptics';
import { CheckCircle2, AlertCircle, Info, Activity, Volume2, ShieldAlert, Sparkles } from 'lucide-react';
import type { BroadcastRule } from '../types';

export interface DynamicIslandAlert {
  title: string;
  message: string;
  type: 'success' | 'error' | 'idle' | 'warning' | 'broadcast';
}

interface DynamicIslandProps {
  alert: DynamicIslandAlert | null;
  broadcasts?: BroadcastRule[];
  activeDoctorCount?: number;
  totalDoctorCount?: number;
}

export default function DynamicIsland({
  alert,
  broadcasts = [],
  activeDoctorCount = 0,
  totalDoctorCount = 0,
}: DynamicIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Active broadcast banner
  const activeBroadcast = broadcasts.find((b) => b.active);

  useEffect(() => {
    if (alert || activeBroadcast) {
      setIsExpanded(true);
      const timer = setTimeout(() => setIsExpanded(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [alert, activeBroadcast]);

  const toggleExpand = () => {
    triggerHaptic('light');
    setIsExpanded(!isExpanded);
  };

  const displayType = activeBroadcast
    ? activeBroadcast.alertLevel === 'CRITICAL'
      ? 'error'
      : 'warning'
    : alert
    ? alert.type
    : 'idle';

  return (
    <div className="dynamic-island-container">
      <div
        className={`dynamic-island ${isExpanded ? 'island-expanded' : 'island-compact'} ${
          activeBroadcast ? 'has-broadcast' : ''
        } type-${displayType}`}
        onClick={toggleExpand}
      >
        {isExpanded ? (
          <div className="island-expanded-view">
            {activeBroadcast ? (
              <div className="island-broadcast-row">
                <div className="island-leading">
                  <ShieldAlert size={20} className="text-amber" />
                </div>
                <div className="island-content">
                  <div className="island-title">Pengumuman Rumah Sakit</div>
                  <div className="island-sub">{activeBroadcast.message}</div>
                </div>
              </div>
            ) : alert ? (
              <div className="island-alert-row">
                <div className="island-leading">
                  {alert.type === 'success' ? (
                    <CheckCircle2 size={20} className="text-green" />
                  ) : alert.type === 'error' ? (
                    <AlertCircle size={20} className="text-red" />
                  ) : (
                    <Info size={20} className="text-blue" />
                  )}
                </div>
                <div className="island-content">
                  <div className="island-title">{alert.title}</div>
                  <div className="island-sub">{alert.message}</div>
                </div>
              </div>
            ) : (
              <div className="island-operational-row">
                <div className="island-status-head">
                  <div className="island-brand-tag">
                    <span className="brand-live-dot"></span>
                    <span>Live Operasional Poliklinik</span>
                  </div>
                  <span className="island-badge-pill">{activeDoctorCount} Sedang Praktek</span>
                </div>
                <div className="island-sub-stats">
                  <span>RSU Siaga Medika Purbalingga — Pelayanan Rawat Jalan & Spesialis</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="island-compact-row">
            <div className="island-leading-dot"></div>
            <span className="island-compact-txt">
              {activeBroadcast
                ? 'Pengumuman RS'
                : alert
                ? alert.title
                : `${activeDoctorCount} Dokter Aktif`}
            </span>
            <div className="island-wave-indicator">
              <span className="wave-bar b1"></span>
              <span className="wave-bar b2"></span>
              <span className="wave-bar b3"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
