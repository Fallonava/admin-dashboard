'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Edit2, Brain, Database,
  CheckCircle, XCircle, Search, RefreshCw, Tag,
  Sparkles, BookOpen, ChevronRight, Save, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KBItem {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = ['BPJS', 'Pendaftaran', 'Fasilitas', 'Triage', 'Jadwal', 'Umum', 'Farmasi', 'Rawat Inap'];

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  BPJS:         { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  Pendaftaran:  { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Fasilitas:    { color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  Triage:       { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  Jadwal:       { color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  Umum:         { color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  Farmasi:      { color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
  'Rawat Inap': { color: 'text-pink-700',    bg: 'bg-pink-50',    border: 'border-pink-200' },
};

const defaultCfg = { color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };

export default function BotStudioPage() {
  const [items, setItems] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editItem, setEditItem] = useState<KBItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Umum', title: '', content: '', tags: '', isActive: true });
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  // AI LLM Settings State
  const [aiSettings, setAiSettings] = useState({ provider: 'gemini', apiKey: '', aiEnabled: false, aiModel: 'gemini-1.5-flash', systemPrompt: '' });
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [savingAi, setSavingAi] = useState(false);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge-base');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      showToast('Gagal memuat data Knowledge Base', 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAiSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/ai');
      const data = await res.json();
      if (data && !data.error) setAiSettings(data);
    } catch (err) {
      console.warn("Gagal memuat konfigurasi AI:", err);
    }
  }, []);

  const handleSaveAiSettings = async () => {
    setSavingAi(true);
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiSettings)
      });
      if (res.ok) {
        showToast('✅ Konfigurasi AI External berhasil disimpan!');
        setShowAiSettings(false);
      } else throw new Error();
    } catch {
      showToast('❌ Gagal menyimpan konfigurasi AI', 'err');
    } finally {
      setSavingAi(false);
    }
  };

  useEffect(() => { 
    fetchItems();
    fetchAiSettings();
  }, [fetchItems, fetchAiSettings]);

  const openAddForm = () => {
    setEditItem(null);
    setForm({ category: 'Umum', title: '', content: '', tags: '', isActive: true });
    setShowForm(true);
  };

  const handleEdit = (item: KBItem) => {
    setEditItem(item);
    setForm({ category: item.category, title: item.title, content: item.content, tags: item.tags.join(', '), isActive: item.isActive });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        ...(editItem ? { id: editItem.id } : {})
      };
      const res = await fetch('/api/knowledge-base', {
        method: editItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Unknown error');
      showToast(editItem ? '✅ Data diperbarui & embedding di-refresh!' : '✅ Data berhasil ditambahkan & AI belajar!');
      setShowForm(false);
      fetchItems();
    } catch (err: any) {
      showToast('❌ Gagal: ' + err.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}" dari otak AI?`)) return;
    try {
      await fetch('/api/knowledge-base', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      showToast('🗑️ Data berhasil dihapus dari Knowledge Base.');
      fetchItems();
    } catch {
      showToast('Gagal menghapus data', 'err');
    }
  };

  const filteredItems = items.filter(i => {
    const matchCat = selectedCategory ? i.category === selectedCategory : true;
    const matchSearch = search
      ? i.title.toLowerCase().includes(search.toLowerCase()) || i.content.toLowerCase().includes(search.toLowerCase()) || i.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      : true;
    return matchCat && matchSearch;
  });

  const activeCount = items.filter(i => i.isActive).length;

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-[1400px] mx-auto pb-24">

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-5 right-5 z-[999] px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl border transition-all',
          toast.type === 'ok'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100'
            : 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-100'
        )}>
          {toast.msg}
        </div>
      )}

      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-600 rounded-[14px] text-white shadow-lg shadow-indigo-500/20">
              <Brain size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">Bot Training Studio</h1>
          </div>
          <p className="text-slate-500 font-medium max-w-xl text-sm">
            Kelola <span className="font-bold text-indigo-600">Custom Knowledge Base</span> — Sumber kecerdasan Virtual Assistant RS. Data yang Anda tambahkan akan otomatis dikonversi menjadi vektor AI untuk pencarian semantik.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAiSettings(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-100 transition-all shadow-sm"
          >
            <Sparkles size={15} /> Pengaturan LLM (AI Eksternal)
          </button>
          <button
            onClick={fetchItems}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={16} /> Tambah Pengetahuan
          </button>
        </div>
      </section>

      {/* ─── AI SETTINGS PANEL (LLM SWITCH CONFIG) ─────────────────────── */}
      {showAiSettings && (
        <section className="bg-slate-900 text-slate-300 rounded-2xl border border-slate-700 shadow-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-400" />
              AI Pembantu (Singularity Mode)
            </h2>
            <button onClick={() => setShowAiSettings(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div>
                <div className="text-sm font-bold text-white mb-1">Aktifkan AI Eksternal (Gemini)</div>
                <div className="text-xs text-slate-400">Jika mati, bot 100% menggunakan Local RAG dan Regex (Offline). Jika hidup, AI menjahit data RAG menjadi kalimat yang lebih natural.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={aiSettings.aiEnabled} onChange={e => setAiSettings(s => ({ ...s, aiEnabled: e.target.checked }))} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Provider AI</label>
                  <select value={aiSettings.provider} onChange={e => setAiSettings(s => ({ ...s, provider: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="gemini">Google Gemini</option>
                    <option value="openai" disabled>OpenAI (Coming Soon)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">API Key {aiSettings.provider}</label>
                  <input type="password" value={aiSettings.apiKey} onChange={e => setAiSettings(s => ({ ...s, apiKey: e.target.value }))} placeholder="AIzA..." className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500" />
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">System Prompt (Karakteristik & Batasan)</label>
              <textarea rows={4} value={aiSettings.systemPrompt} onChange={e => setAiSettings(s => ({ ...s, systemPrompt: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 resize-y" />
            </div>

            <div className="flex justify-end pt-2">
               <button onClick={handleSaveAiSettings} disabled={savingAi} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                 <Save size={16} /> {savingAi ? 'Menyimpan...' : 'Simpan Konfigurasi AI'}
               </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── STATS ───────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Dataset', value: items.length, icon: <Database size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Aktif di AI', value: activeCount, icon: <CheckCircle size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Non-Aktif', value: items.length - activeCount, icon: <XCircle size={18} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Kategori', value: new Set(items.map(i => i.category)).size, icon: <Tag size={18} />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
        ].map(stat => (
          <div key={stat.label} className={cn('bg-white rounded-2xl p-4 border flex items-center gap-4 shadow-sm hover:shadow-md transition-all', stat.border)}>
            <div className={cn('p-2.5 rounded-xl', stat.bg)}>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{stat.value}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ─── FORM PANEL ─────────────────────────────────────────────────── */}
      {showForm && (
        <section className="bg-white rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-500" />
              {editItem ? 'Edit Pengetahuan AI' : 'Tambah Pengetahuan Baru'}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Kategori</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tags (pisah koma)</label>
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="bpjs, gratis, cara daftar..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Judul / Pertanyaan Pemicu</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Contoh: Cara mendaftar menggunakan BPJS Kesehatan"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Isi Jawaban / Informasi Detail</label>
              <textarea
                required
                rows={5}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Tuliskan jawaban lengkap yang harus diketahui pasien..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-y leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span className="text-sm font-semibold text-slate-600">Aktifkan di otak AI sekarang</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-md shadow-indigo-200"
                >
                  <Save size={15} />
                  {saving ? 'Memproses + Mengajari AI...' : (editItem ? 'Simpan Perubahan' : 'Tambah & Ajari AI')}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* ─── FILTERS ────────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari judul, isi, atau tag..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['', ...CATEGORIES].map(cat => (
            <button
              key={cat || 'all'}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all',
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              )}
            >
              {cat || 'Semua'}
            </button>
          ))}
        </div>
      </section>

      {/* ─── LIST ───────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
            Memuat dataset AI...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100">
            <BookOpen size={40} className="mb-3 opacity-30" />
            <p className="font-semibold">Belum ada pengetahuan{selectedCategory ? ` di kategori "${selectedCategory}"` : ''}.</p>
            <p className="text-sm mt-1">Klik <strong>Tambah Pengetahuan</strong> untuk mulai melatih AI!</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const cfg = CATEGORY_CONFIG[item.category] ?? defaultCfg;
            return (
              <div
                key={item.id}
                className={cn(
                  'group bg-white rounded-2xl border p-5 flex gap-4 items-start transition-all hover:shadow-md hover:-translate-y-px',
                  item.isActive ? 'border-slate-200' : 'border-slate-100 opacity-70'
                )}
              >
                {/* Left accent */}
                <div className={cn('w-1 h-full min-h-[40px] rounded-full flex-shrink-0 mt-1', cfg.bg, 'border', cfg.border)}
                  style={{ width: 3, minHeight: 40, borderRadius: 4 }}
                />

                <div className="flex-1 min-w-0">
                  {/* Meta Row */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
                      {item.category}
                    </span>
                    {!item.isActive && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border text-amber-700 bg-amber-50 border-amber-200">
                        Non-Aktif
                      </span>
                    )}
                    {item.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <p className="text-[15px] font-bold text-slate-800 mb-1 truncate">{item.title}</p>

                  {/* Content preview */}
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{item.content}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-all"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ─── AI ENHANCEMENT TIP ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200 flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 mb-3">💡 Tips Mencerdaskan AI Lokal Anda</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
              {[
                { tip: 'Tulis judul sebagai pertanyaan nyata yang ditanyakan pasien (bukan judul formal).' },
                { tip: 'Gunakan variasi kata sinonim di kolom Tags (mis: "kis", "kartu", "bpjs", "gratis").' },
                { tip: 'Semakin panjang & detail isi jawaban, semakin tinggi akurasi AI.' },
                { tip: 'Kelompokkan dengan Kategori yang tepat untuk pencarian yang lebih efisien.' },
                { tip: 'Tambahkan contoh pertanyaan di akhir isi jawaban sebagai konteks tambahan.' },
                { tip: 'Nonaktifkan entri lama daripada menghapus, untuk menjaga riwayat pelatihan.' },
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-white/70 rounded-xl p-3 border border-indigo-100">
                  <ChevronRight size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span>{t.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
