'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search, Activity, Stethoscope, Sparkles, Send, Bot, User, Clock } from 'lucide-react';
import { useStreamChat } from '@/hooks/useStreamChat';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PublikPage() {
  const endRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, setInput, isLoading, append, handleSubmit, handleInputChange } = useStreamChat({
    api: '/api/assistant',
    body: { role: 'public' },
    initialMessages: [], // Mulai dengan kosong untuk Search UI yang bersih
  });

  // Auto scroll saat ada pesan baru
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasMessages = messages.length > 0;

  // Render teks simpel untuk hasil markdown
  const renderText = (text: string) => {
    // 1. Tangani Line Breaks menjadi <br />
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // 2. Tangani **Bold** markdown
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={lIdx} className="block min-h-[1.2rem]">
          {parts.map((p, pIdx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-zinc-900">{p.slice(2, -2)}</strong>;
            }
            return <span key={pIdx}>{p}</span>;
          })}
        </span>
      );
    });
  };

  // Sugesti Pencarian (Chips)
  const suggestions = [
    { text: "Jadwal Bedah besok", icon: <Stethoscope size={14} /> },
    { text: "Poliklinik tutup jam berapa?", icon: <Clock size={14} /> },
    { text: "Apakah bisa pakai asuransi?", icon: <Activity size={14} /> },
    { text: "Panduan untuk Rawat Inap", icon: <Sparkles size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans transition-colors duration-500">
      {/* ─── HEADER MINIMALIS ─── */}
      <header className="fixed top-0 w-full z-50 bg-[#fafafa]/80 backdrop-blur-xl border-b border-zinc-200/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Stethoscope size={18} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-zinc-900 tracking-tight text-lg">SIMED</span>
          </div>
          <Link href="/login" className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 font-semibold text-xs rounded-full hover:bg-zinc-50 hover:text-zinc-900 hover:shadow-sm transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
             Admin Akses <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className={cn(
        "flex-1 flex flex-col items-center w-full max-w-5xl mx-auto px-4 sm:px-6 relative transition-all duration-700 ease-out",
        hasMessages ? "pt-24 pb-48" : "justify-center pt-20 pb-0 min-h-[90vh]"
      )}>
        
        {/* 1. MASA KOSONG (Hero / Search Engine UI) */}
        {!hasMessages && (
          <div className="w-full max-w-3xl flex flex-col items-center mt-[-5vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] text-zinc-800 mb-8 text-center leading-tight">
               Apa yang bisa <span className="bg-gradient-to-r from-zinc-900 to-zinc-500 text-transparent bg-clip-text">SIMED</span> bantu <br className="hidden sm:block" /> hari ini?
            </h1>
          </div>
        )}

        {/* 2. MASA CHAT (History Percakapan) */}
        {hasMessages && (
          <div className="w-full flex-1 space-y-8 animate-in fade-in duration-500 mb-8">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex w-full", m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "flex gap-4 max-w-[85%] sm:max-w-[75%]",
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}>
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 border",
                    m.role === 'user' 
                      ? "bg-zinc-100 text-zinc-600 border-zinc-200" 
                      : "bg-white text-emerald-600 border-zinc-200 shadow-sm"
                  )}>
                    {m.role === 'user' ? <User size={16} /> : <Stethoscope size={18} />}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    "px-5 py-4 rounded-3xl text-[15px] leading-relaxed shadow-sm",
                    m.role === 'user' 
                      ? "bg-zinc-100/80 text-zinc-800 rounded-tr-sm border border-zinc-200/50" 
                      : "bg-white text-zinc-700 rounded-tl-sm border border-zinc-200"
                  )}>
                    {renderText(m.content)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.content === '' && (
               <div className="flex w-full justify-start animate-fade-in">
                  <div className="flex gap-4 max-w-[75%]">
                     <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 border bg-white border-zinc-200 text-zinc-400">
                        <Bot size={16} className="animate-pulse" />
                     </div>
                     <div className="px-5 py-4 rounded-3xl rounded-tl-sm bg-white border border-zinc-200 text-zinc-400 text-sm flex gap-1.5 items-center">
                        <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                        <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                        <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                     </div>
                  </div>
               </div>
            )}
            <div ref={endRef} className="h-4" />
          </div>
        )}

        {/* ─── KOTAK PENCARIAN (Input Omnibar) ─── */}
        <div className={cn(
          "w-full max-w-3xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          hasMessages 
            ? "fixed bottom-0 pb-8 pt-12 px-4 sm:px-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/90 to-transparent" 
            : "relative mt-0"
        )}>
          <form 
            onSubmit={handleSubmit} 
            className={cn(
              "relative flex items-center overflow-hidden bg-white transition-all duration-300",
              hasMessages 
                ? "rounded-2xl border border-zinc-300 shadow-[0_4px_30px_rgba(0,0,0,0.06)] ring-4 ring-zinc-50" 
                : "rounded-[32px] border border-zinc-200 shadow-[0_8px_40px_rgba(0,0,0,0.04)] focus-within:shadow-[0_8px_40px_rgba(0,0,0,0.08)] focus-within:border-zinc-300"
            )}
          >
            {!hasMessages && (
              <div className="absolute left-6 text-zinc-400 pointer-events-none">
                <Search size={22} strokeWidth={2.5} />
              </div>
            )}
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Tanya apapun tentang pendaftaran medis..."
              className={cn(
                "w-full bg-transparent text-zinc-800 placeholder:text-zinc-400 focus:outline-none transition-all",
                hasMessages ? "py-4 pl-5 pr-14 text-[15px]" : "py-5 pl-14 pr-16 text-lg sm:text-xl font-medium"
              )}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "absolute flex items-center justify-center bg-zinc-900 text-white rounded-full transition-all disabled:opacity-30 disabled:bg-zinc-200 disabled:text-zinc-400",
                hasMessages 
                  ? "right-3 w-8 h-8" 
                  : "right-4 w-10 h-10 hover:scale-105 active:scale-95"
              )}
            >
              <Send size={hasMessages ? 14 : 16} className="-ml-0.5" />
            </button>
          </form>

          {/* Chips Bawah (Hanya tampil saat kosong) */}
          {!hasMessages && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8 opacity-80">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInput(sug.text);
                    setTimeout(() => append({ role: 'user', content: sug.text }), 100);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 text-[13px] font-medium rounded-full hover:border-zinc-400 hover:text-zinc-900 transition-colors shadow-sm"
                >
                  <span className="text-zinc-400">{sug.icon}</span>
                  {sug.text}
                </button>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
