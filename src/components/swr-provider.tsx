'use client';

import { useEffect } from 'react';
import { SWRConfig, mutate } from 'swr';
import { useSocket } from '@/hooks/use-socket';

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
    const { socket, isConnected } = useSocket('global');

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleDoctorUpdate = () => mutate('/api/doctors');
        // Invalidate semua cache key shifts (termasuk ?include=leaves)
        const handleShiftUpdate = () => mutate((key: string) => typeof key === 'string' && key.startsWith('/api/shifts'));
        const handleLeaveUpdate = () => mutate('/api/leaves');
        const handleAutomationUpdate = () => {
            mutate('/api/automation');
            mutate('/api/automation-rules');
            mutate('/api/automation-logs');
        };

        // Listen for standard generic string events that the backend might emit
        socket.on('doctor_updated', handleDoctorUpdate);
        socket.on('doctor_created', handleDoctorUpdate);
        socket.on('doctor_deleted', handleDoctorUpdate);
        
        socket.on('shift_updated', handleShiftUpdate);
        socket.on('shift_created', handleShiftUpdate);
        socket.on('shift_deleted', handleShiftUpdate);

        socket.on('leave_updated', handleLeaveUpdate);
        socket.on('leave_created', handleLeaveUpdate);

        socket.on('automation_updated', handleAutomationUpdate);

        // Also listen for a generic 'invalidate' event with a specific key
        socket.on('invalidate_cache', (key: string) => {
            if (key) mutate(key);
        });

        return () => {
            socket.off('doctor_updated', handleDoctorUpdate);
            socket.off('doctor_created', handleDoctorUpdate);
            socket.off('doctor_deleted', handleDoctorUpdate);
            socket.off('shift_updated', handleShiftUpdate);
            socket.off('shift_created', handleShiftUpdate);
            socket.off('shift_deleted', handleShiftUpdate);
            socket.off('leave_updated', handleLeaveUpdate);
            socket.off('leave_created', handleLeaveUpdate);
            socket.off('automation_updated', handleAutomationUpdate);
            socket.off('invalidate_cache');
        };
    }, [socket, isConnected]);

    return (
        <SWRConfig
            value={{
                fetcher: async (resource, init) => {
                    const res = await fetch(resource, init);
                    const data = await res.json();
                    if (!res.ok) {
                        throw new Error(data.error || 'An error occurred while fetching the data.');
                    }
                    return data;
                },
                // PERFORMA: Jangan refetch saat alt-tab — andalkan WebSocket events
                revalidateOnFocus: false,
                // Tetap fresh saat reconnect setelah offline
                revalidateOnReconnect: true,
                // Deduplicate request yang sama dalam 5 detik
                dedupingInterval: 5000,
                // Safety net: polling setiap 30 detik jika Socket.IO event miss
                // (misal: koneksi flaky, Redis adapter lag, dll)
                refreshInterval: 30000,
                // Retry 3x dengan backoff, skip 4xx errors (client error, jangan retry)
                onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
                    if (error?.message?.includes('401') || error?.message?.includes('403')) return;
                    if (retryCount >= 3) return;
                    setTimeout(() => revalidate({ retryCount }), Math.min(1000 * 2 ** retryCount, 30000));
                },
            }}
        >
            {children}
        </SWRConfig>
    );
};
