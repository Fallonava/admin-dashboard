import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import type { Doctor, Settings } from "@/lib/data-service";

export function useAutomation() {
    const { data: doctors } = useSWR<Doctor[]>('/api/doctors');
    const { data: settings } = useSWR<Settings>('/api/settings');

    // Heartbeat: Trigger automation every 30 seconds to ensure it stays "alive"
    useEffect(() => {
        const triggerAutomation = async () => {
            try {
                // We use a internal-only or protected route. 
                // Since this runs in the browser, it needs the session cookie which is already there.
                await fetch('/api/automation/run', { method: 'GET' });
            } catch (e) {
                console.error('[heartbeat] Failed to trigger automation:', e);
            }
        };

        // Initial trigger
        triggerAutomation();

        const interval = setInterval(triggerAutomation, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, []);

    // listen for server-sent events to refresh immediately
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const es = new EventSource('/api/stream/doctors');
        es.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data);
                if (msg.type === 'doctors') {
                    mutate('/api/doctors');
                }
            } catch (e) {
                console.warn('invalid SSE message', e);
            }
        };
        es.onerror = () => {
            // attempt reconnect after delay
            es.close();
            setTimeout(() => {
                // just create a new EventSource
                const newEs = new EventSource('/api/stream/doctors');
                newEs.onmessage = es.onmessage;
                newEs.onerror = es.onerror;
            }, 5000);
        };
        return () => es.close();
    }, []);
}
