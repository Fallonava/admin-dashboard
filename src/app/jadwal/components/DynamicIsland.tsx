import React, { useEffect, useState } from 'react';
import { triggerHaptic } from '../lib/haptics';
import { CheckCircle2, AlertCircle, Info, Activity } from 'lucide-react';

export interface DynamicIslandAlert {
  title: string;
  message: string;
  type: 'success' | 'error' | 'idle' | 'warning';
}

interface DynamicIslandProps {
  alert: DynamicIslandAlert | null;
  activeDoctorCount?: number;
}

export default function DynamicIsland({ alert, activeDoctorCount = 0 }: DynamicIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsExpanded(true);
      const timer = setTimeout(() => setIsExpanded(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const toggleExpand = () => {
    triggerHaptic('light');
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="dynamic-island-container">
      <div
        className={`dynamic-island ${isExpanded ? 'island-expanded' : 'island-compact'} ${
          alert ? `type-${alert.type}` : ''
        }`}
        onClick={toggleExpand}
      >
        {isExpanded && alert ? (
          <>
            <div className="island-leading">
              {alert.type === 'success' ? (
                <CheckCircle2 size={18} className="text-green" />
              ) : alert.type === 'error' ? (
                <AlertCircle size={18} className="text-red" />
              ) : (
                <Info size={18} className="text-blue" />
              )}
            </div>
            <div className="island-content">
              <div className="island-title">{alert.title}</div>
              <div className="island-sub">{alert.message}</div>
            </div>
          </>
        ) : isExpanded ? (
          <div className="island-content-expanded">
            <div className="island-row">
              <span className="brand-live-dot"></span>
              <span className="island-title">RSU Siaga Medika Pemalang</span>
            </div>
            <div className="island-sub">
              {activeDoctorCount} Dokter Spesialis Sedang Bertugas Hari Ini
            </div>
          </div>
        ) : (
          <div className="island-compact-row">
            <div className="island-leading-dot"></div>
            <span className="island-compact-txt">
              {alert ? alert.title : `${activeDoctorCount} Dokter Aktif`}
            </span>
            <Activity size={14} className="island-trailing-icon" />
          </div>
        )}
      </div>
    </div>
  );
}
