import React, { useEffect, useState, useRef } from 'react';
import { triggerHaptic } from '../lib/haptics';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldAlert,
  Star,
  Share2,
  Copy,
  Ticket,
  Calendar,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { BroadcastRule } from '../types';

export interface DynamicIslandAlert {
  id?: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'favorite' | 'share' | 'copy' | 'warning' | 'error' | 'broadcast';
}

interface DynamicIslandProps {
  alert: DynamicIslandAlert | null;
  onDismissAlert?: () => void;
  broadcasts?: BroadcastRule[];
  activeDoctorCount?: number;
  totalDoctorCount?: number;
}

export default function DynamicIsland({
  alert,
  onDismissAlert,
  broadcasts = [],
  activeDoctorCount = 0,
  totalDoctorCount = 0,
}: DynamicIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<DynamicIslandAlert | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active hospital broadcast banner
  const activeBroadcast = broadcasts.find((b) => b.active);

  // When a new alert / notification arrives, morph Dynamic Island smoothly
  useEffect(() => {
    if (alert) {
      setCurrentAlert(alert);
      setIsExpanded(true);

      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setIsExpanded(false);
        setTimeout(() => {
          setCurrentAlert(null);
          onDismissAlert?.();
        }, 360);
      }, 3400);
    }
  }, [alert, onDismissAlert]);

  // Handle active broadcast
  useEffect(() => {
    if (activeBroadcast && !alert) {
      setIsExpanded(true);
      const timer = setTimeout(() => setIsExpanded(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [activeBroadcast, alert]);

  const toggleExpand = () => {
    triggerHaptic('light');
    setIsExpanded((prev) => !prev);
  };

  const getAlertIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-green" />;
      case 'favorite':
        return <Star size={18} className="text-amber fill-amber" />;
      case 'share':
        return <Share2 size={18} className="text-blue" />;
      case 'copy':
        return <Copy size={18} className="text-blue" />;
      case 'warning':
      case 'broadcast':
        return <ShieldAlert size={18} className="text-amber" />;
      case 'error':
        return <AlertCircle size={18} className="text-red" />;
      case 'info':
      default:
        return <Sparkles size={18} className="text-blue" />;
    }
  };

  return (
    <div className="dynamic-island-container" aria-label="Dynamic Island Notifikasi & Status">
      <div
        className={`dynamic-island ${isExpanded ? 'island-expanded' : 'island-compact'} ${
          activeBroadcast ? 'has-broadcast' : ''
        } ${currentAlert ? `has-alert alert-${currentAlert.type}` : 'is-standby'}`}
        onClick={toggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          /* ── 1. EXPANDED / NOTIFICATION MORPH STATE ── */
          <div className="island-expanded-view">
            {currentAlert ? (
              /* Dynamic Notification Event */
              <div className="island-alert-row">
                <div className="island-leading">{getAlertIcon(currentAlert.type)}</div>
                <div className="island-content">
                  <div className="island-title">{currentAlert.title}</div>
                  {currentAlert.message && <div className="island-sub">{currentAlert.message}</div>}
                </div>
                <div className="island-trailing-badge">
                  <span className="island-mini-dot" />
                </div>
              </div>
            ) : activeBroadcast ? (
              /* Hospital Broadcast Announcement */
              <div className="island-broadcast-row">
                <div className="island-leading">
                  <ShieldAlert size={20} className="text-amber" />
                </div>
                <div className="island-content">
                  <div className="island-title">Pengumuman Rumah Sakit</div>
                  <div className="island-sub">{activeBroadcast.message}</div>
                </div>
              </div>
            ) : (
              /* Standby Expanded Operational Summary */
              <div className="island-operational-row">
                <div className="island-status-head">
                  <div className="island-brand-tag">
                    <span className="brand-live-dot" />
                    <span>Live Operasional Poliklinik</span>
                  </div>
                  <span className="island-badge-pill">{activeDoctorCount} Sedang Praktik</span>
                </div>
                <div className="island-sub-stats">
                  <span>RSU Siaga Medika Purbalingga — Rawat Jalan & Spesialis</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── 2. COMPACT STANDBY PILL ── */
          <div className="island-compact-row">
            <div className="island-leading-dot" />
            <span className="island-compact-txt">
              {activeBroadcast
                ? 'Pengumuman RS'
                : `${activeDoctorCount} Dokter Aktif`}
            </span>
            <div className="island-wave-indicator" aria-hidden="true">
              <span className="wave-bar b1" />
              <span className="wave-bar b2" />
              <span className="wave-bar b3" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
