'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  source?: string;
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const pathname = usePathname() || '';
  const role = pathname.startsWith('/publik') ? 'public' : 'admin';

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        sender: 'ai',
        text: role === 'admin'
          ? 'Halo Komandan! 🫡 Saya siap membantu.\nTanya soal jadwal dokter, rekap harian, status broadcast WA, atau informasi RS lainnya.'
          : 'Halo! Selamat datang di Asisten Virtual RS. 🏥\nTanyakan jadwal dokter, cara daftar BPJS, atau info layanan kami.'
      }]);
    }
  }, [role, messages.length]);

  // Riwayat memori, hanya di-track di memori komponen (hilang kalau refresh, sesuai desain privasi)
  const sendMessage = async (e: React.FormEvent, overrideInput?: string) => {
    e.preventDefault();
    const finalInput = overrideInput || input;
    if (!finalInput.trim() || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: finalInput };
    const historyPayload = messages.slice(-4).map(m => ({ sender: m.sender, text: m.text })); 
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.text, 
          role,
          conversationHistory: historyPayload
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'ai',
        sender: 'ai',
        text: data.reply || 'Maaf, saya tidak mengerti.',
        source: data.source
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'err',
        sender: 'ai',
        text: '❌ Gangguan koneksi ke server AI.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Render text dengan **bold** markdown
  const renderText = (text: string) =>
    text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl shadow-indigo-300/40 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 bg-gradient-to-br from-indigo-500 to-violet-600 text-white border border-indigo-400/30',
          isOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'
        )}
        title="Buka AI Assistant"
      >
        <Sparkles size={22} />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 flex flex-col w-[360px] sm:w-[400px] shadow-2xl shadow-slate-200 overflow-hidden rounded-3xl border border-slate-200/80 transition-all duration-300 ease-out',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        )}
        style={{
          height: '560px',
          maxHeight: 'calc(100vh - 40px)',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-black text-[14px] leading-tight">SIMED AI Assistant</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/70 text-[11px] font-medium">Online • Mode {role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar bg-slate-50/50">
          {messages.map(m => (
            <div key={m.id} className={cn('flex', m.sender === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed',
                  m.sender === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-sm shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-700 rounded-bl-sm border border-slate-200 shadow-sm'
                )}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {renderText(m.text)}
                {m.source === 'semantic-rag' && (
                  <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-indigo-500 flex items-center gap-1 font-medium">
                    <Sparkles size={9} /> Dijawab oleh AI Vektor Lokal
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                {[0, 150, 300].map(delay => (
                  <span key={delay} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input & Smart Prompts */}
        <div className="bg-white border-t border-slate-100 flex flex-col">
          {/* Smart Prompts Chips */}
          <div className="flex overflow-x-auto custom-scrollbar px-4 pt-3 pb-1 gap-2">
            {(role === 'admin' 
              ? ["📊 Rekap kunjungan hari ini", "📱 Ringkasan broadcast WA", "🏖️ Siapa dokter yang cuti?", "📅 Jadwal dokter hari ini"]
              : ["📅 Jadwal Spesialis Anak", "💊 Ingin berobat Poli Dalam", "🕒 Kapan dr. Budi cuti?", "❓ Cara daftar BPJS"]
            ).map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setInput(prompt);
                  // Optional: if we want to auto-send, we can call sendMessage immediately, but it's safer to just fill the input so they can read it, or we trigger form sub by simulating. We'll just set it. 
                  // Wait, UX-wise Apple Intelligence auto-sends. Let's auto send.
                  setTimeout(() => {
                    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                    sendMessage(fakeEvent, prompt);
                  }, 50);
                }}
                className="whitespace-nowrap flex-shrink-0 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-[11px] font-bold text-slate-500 rounded-lg transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Form Area */}
          <form onSubmit={(e) => sendMessage(e, input)} className="relative flex items-center p-4 pt-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ketik keluhan atau pertanyaan..."
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-full pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-5 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white disabled:opacity-30 transition-all hover:shadow-md shadow-indigo-200"
            >
              <Send size={14} className="-ml-0.5" />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 pb-3 font-medium">
            Powered by Local Semantic AI Engine
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </>
  );
}
