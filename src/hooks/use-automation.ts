import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import type { Doctor, Settings } from "@/lib/data-service";

export function useAutomation() {
    const { data: doctors } = useSWR<Doctor[]>('/api/doctors');
    const { data: settings } = useSWR<Settings>('/api/settings');

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
