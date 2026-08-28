import React, { useEffect, useState } from 'react';

export interface DynamicIslandAlert {
    title: string;
    message: string;
    type: 'success' | 'error' | 'idle' | 'warning';
}

export default function DynamicIsland({ alert }: { alert: DynamicIslandAlert | null }) {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        if (alert) {
            setIsVisible(true);
            const timer = setTimeout(() => setIsVisible(false), 3000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [alert]);

    if (!isVisible || !alert) return null;

    return (
        <div className="dynamic-island-container">
            <div className={`dynamic-island island-expanded type-${alert.type}`}>
                <div className="island-leading">
                    <span className="island-icon material-icons-round">
                        {alert.type === 'success' ? 'check_circle' : alert.type === 'error' ? 'error' : 'info'}
                    </span>
                </div>
                <div className="island-content">
                    <div className="island-title">{alert.title}</div>
                    <div className="island-sub">{alert.message}</div>
                </div>
            </div>
        </div>
    );
}
