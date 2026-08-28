"use client";

import './jadwal.css';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Search, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export default function JadwalPage() {
    const [activeMode, setActiveMode] = useState<'today' | 'weekly' | 'leaves'>('today');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch data exactly like the old script1.js did
    const { data, error, isLoading } = useSWR('/api/display', async (url) => {
        const res = await fetch(url);
        return res.json();
    });

    return (
        <div className="jadwal-container">
            {/* Dynamic Island Area */}
            <div className="dynamic-island-container">
                <div className="dynamic-island">
                    <div className="island-compact">
                        <div className="island-leading"></div>
                        <div className="island-trailing"></div>
                    </div>
                </div>
            </div>

            {/* Header */}
            <header className="ios-nav-header">
                <div className="ios-title-group">
                    <div className="brand-title-row">
                        <h1 className="brand-title">Jadwal Praktik</h1>
                        <span className="brand-city-tag">Pemalang</span>
                    </div>
                    <div className="brand-sub-row">
                        <span className="brand-live-dot"></span>
                        <span className="brand-subtitle">Real-time Sinkronisasi</span>
                    </div>
                </div>
                
                {/* Segmented Control */}
                <div className="ios-mode-switcher ios-mode-switcher-margin">
                    <button 
                        className={`ios-mode-btn ${activeMode === 'today' ? 'active' : ''}`}
                        onClick={() => setActiveMode('today')}
                    >Hari Ini</button>
                    <button 
                        className={`ios-mode-btn ${activeMode === 'weekly' ? 'active' : ''}`}
                        onClick={() => setActiveMode('weekly')}
                    >Keseluruhan</button>
                    <button 
                        className={`ios-mode-btn ${activeMode === 'leaves' ? 'active' : ''}`}
                        onClick={() => setActiveMode('leaves')}
                    >Jadwal Cuti</button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="main-content main-content-padded">
                {isLoading && (
                    <div className="ios-skeleton">
                        <div className="bento-grid">
                            <div className="bento-card-main skeleton-pulse" style={{ height: '120px' }}></div>
                            <div className="bento-card-main skeleton-pulse" style={{ height: '120px' }}></div>
                        </div>
                    </div>
                )}

                {!isLoading && data && activeMode === 'today' && (
                    <div className="today-view">
                        <div className="bento-grid mb-24">
                            <div className="bento-card-main">
                                <div className="bento-title">Hadir Hari Ini</div>
                                <div className="bento-num">{data.doctors?.filter((d: any) => d.status === 'PRAKTEK').length || 0}</div>
                            </div>
                            <div className="bento-card-main">
                                <div className="bento-title">Total Dokter</div>
                                <div className="bento-num">{data.doctors?.length || 0}</div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="ios-search-bar mb-24">
                            <Search className="search-icon" size={20} />
                            <input 
                                type="text" 
                                className="ios-search-input" 
                                placeholder="Cari dokter, spesialis..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Doctor List (Simplified for setup) */}
                        <div className="doctor-list">
                            {/* We will map doctors here */}
                            <div className="ios-empty-state">
                                <div className="ios-empty-title">Setup Next.js Berhasil</div>
                                <div className="ios-empty-sub">UI HTML telah dimigrasi ke React. Dokter dapat dirender di sini.</div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
