import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../lib/haptics';
import { MessageCircle, PhoneCall, UserPlus } from 'lucide-react';

interface FloatingDockProps {
  onOpenGeneralRegistration?: () => void;
}

export default function FloatingDock({ onOpenGeneralRegistration }: FloatingDockProps) {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ios-floating-dock-container">
      <div className="ios-floating-dock material-regular">
        {/* Live status capsule */}
        <div className="dock-status-group">
          <span className="dock-live-dot"></span>
          <div className="dock-info-col">
            <span className="dock-title">RSU Siaga Medika</span>
            <span className="dock-clock">{timeStr ? `${timeStr} WIB` : 'Live Sinkron'}</span>
          </div>
        </div>

        {/* Dock Action Buttons */}
        <div className="dock-action-group">
          <a
            href="https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20bertanya%20informasi%20layanan%20dan%20jadwal"
            target="_blank"
            rel="noopener noreferrer"
            className="dock-wa-btn"
            onClick={() => triggerHaptic('light')}
          >
            <MessageCircle size={18} />
            <span>Bantuan WA</span>
          </a>

          {onOpenGeneralRegistration && (
            <button
              className="dock-reg-btn"
              onClick={() => {
                triggerHaptic('medium');
                onOpenGeneralRegistration();
              }}
            >
              <span>Daftar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
