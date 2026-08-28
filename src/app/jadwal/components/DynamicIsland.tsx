import React, { useEffect, useState } from 'react';
import { triggerHaptic } from '../lib/haptics';

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
              <span className="island-icon material-icons-round">
                {alert.type === 'success' ? 'check_circle' : alert.type === 'error' ? 'error' : 'info'}
              </span>
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
            <div className="island-trailing-icon material-icons-round">medical_services</div>
          </div>
        )}
      </div>
    </div>
  );
}
