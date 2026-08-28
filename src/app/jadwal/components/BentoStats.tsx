import React from 'react';
import { Doctor } from '../types';
import { CheckCircle2, CalendarX } from 'lucide-react';

interface BentoStatsProps {
    doctors: Doctor[];
}

export default function BentoStats({ doctors }: BentoStatsProps) {
    const presentCount = doctors.filter((d) => d.status === 'PRAKTEK').length;
    const totalCount = doctors.length;
    const leaveCount = doctors.filter((d) => d.status === 'CUTI').length;
    const presentPercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    return (
        <div className="bento-grid mb-24">
            <div className="bento-card-main">
                <div className="bento-card-top">
                    <div className="bento-icon-coin praktek">
                        <CheckCircle2 size={18} />
                    </div>
                    <div className="bento-status-pill praktek">Hadir</div>
                </div>
                <div className="bento-num-wrap">
                    <span className="bento-num">{presentCount}</span>
                    <span className="bento-unit">Poli</span>
                </div>
                <div className="bento-text-group">
                    <span className="bento-title">Praktek</span>
                    <span className="bento-sub">Siap Melayani</span>
                </div>
            </div>

            <div className="bento-card-main">
                <div className="bento-card-top">
                    <div className="bento-icon-coin cuti">
                        <CalendarX size={18} />
                    </div>
                    <div className="bento-status-pill cuti">Libur</div>
                </div>
                <div className="bento-num-wrap">
                    <span className="bento-num">{leaveCount}</span>
                    <span className="bento-unit">Dokter</span>
                </div>
                <div className="bento-text-group">
                    <span className="bento-title">Cuti / Libur</span>
                    <span className="bento-sub">Tidak Praktik</span>
                </div>
            </div>

            <div className="bento-card-main bento-span-full">
                <div className="bento-flex-row">
                    <div className="bento-flex-info">
                        <div className="bento-title">Tingkat Kehadiran</div>
                        <div className="bento-sub">Rasio dokter praktik hari ini</div>
                    </div>
                    <div className="bento-large-num">{presentPercentage}%</div>
                </div>
            </div>
        </div>
    );
}
