/**
 * use-automation.ts
 *
 * PERUBAHAN PERFORMA:
 * - DIHAPUS: browser heartbeat fetch('/api/automation/run') tiap 30s
 *   Server sudah memiliki node-cron ('*\/30 * * * * *'), jadi ini redundan.
 *   N tab x fetch tiap 30s = N*2 request/menit yang tidak perlu.
 * - DIHAPUS: EventSource('/api/stream/doctors') duplikat
 *   Sudah ditangani oleh swr-provider.tsx via Socket.io
 *
 * Hook ini sekarang hanya menyediakan akses data via SWR tanpa side effect network.
 */
import useSWR from "swr";
import type { Doctor, Settings } from "@/lib/data-service";

export function useAutomation() {
    const { data: doctors } = useSWR<Doctor[]>('/api/doctors');
    const { data: settings } = useSWR<Settings>('/api/settings');

    return { doctors, settings };
}
