import React, { useEffect } from 'react';
import { CheckCircle2, Info, Star, Share2, Copy } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'favorite' | 'share' | 'copy';
  title: string;
  description?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={16} className="toast-icon-green" />;
      case 'favorite':
        return <Star size={16} className="toast-icon-amber fill-amber" />;
      case 'share':
        return <Share2 size={16} className="toast-icon-blue" />;
      case 'copy':
        return <Copy size={16} className="toast-icon-blue" />;
      case 'info':
      default:
        return <Info size={16} className="toast-icon-blue" />;
    }
  };

  return (
    <aside className="ios27-toast-container" onClick={onDismiss} aria-live="polite">
      <div className="ios27-toast-capsule">
        <span className="toast-top-specular" aria-hidden="true" />
        <div className="toast-leading-icon">{getIcon()}</div>
        <div className="toast-content">
          <span className="toast-title">{toast.title}</span>
          {toast.description && <span className="toast-desc">{toast.description}</span>}
        </div>
      </div>
    </aside>
  );
}
