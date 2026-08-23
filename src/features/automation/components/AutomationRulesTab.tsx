"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Trash2, Power, PowerOff, Zap, Shield, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationRule {
  id: string;
  name: string;
  condition: any;
  action: any;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const PRESET_RULES = [
  {
    name: "Auto-Hide Dokter Cuti di TV",
    condition: { status: "CUTI" },
    action: { status: "LIBUR", message: "Sembunyikan dari TV saat cuti" },
  },
  {
    name: "Auto-Selesai Shift Sore",
    condition: { timeRange: "18:00-23:59" },
    action: { status: "SELESAI", message: "Ubah status selesai setelah jam praktek" },
  },
  {
    name: "Auto-Pemberitahuan Darurat",
    condition: { status: "OPERASI" },
    action: { message: "Dokter sedang operasi darurat" },
  },
];

export function AutomationRulesTab() {
  const { data: rulesData, mutate, isLoading } = useSWR<AutomationRule[]>('/api/automation-rules');
  const rules = Array.isArray(rulesData) ? rulesData : [];
  const [isCreating, setIsCreating] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [selectedActionStatus, setSelectedActionStatus] = useState("SELESAI");
  const [saving, setSaving] = useState(false);

  const toggleRule = async (rule: AutomationRule) => {
    try {
      const res = await fetch('/api/automation-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rule,
          active: !rule.active,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Gagal mengubah status aturan: ' + (err.error || 'Terjadi kesalahan'));
      }
    } catch (e: any) {
      alert('Gagal mengubah status aturan: ' + e.message);
    }
    mutate();
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Hapus aturan automasi ini?')) return;
    try {
      const res = await fetch(`/api/automation-rules?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Gagal menghapus aturan: ' + (err.error || 'Terjadi kesalahan'));
      }
    } catch (e: any) {
      alert('Gagal menghapus aturan: ' + e.message);
    }
    mutate();
  };

  const applyPreset = async (preset: typeof PRESET_RULES[0]) => {
    setSaving(true);
    try {
      const res = await fetch('/api/automation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preset.name,
          condition: preset.condition,
          action: preset.action,
          active: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Gagal memasang template: ' + (err.error || 'Terjadi kesalahan'));
      }
      mutate();
    } catch (e: any) {
      alert('Gagal memasang template: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newRuleName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/automation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRuleName,
          condition: { status: "PRAKTEK" },
          action: { status: selectedActionStatus },
          active: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Gagal membuat aturan: ' + (err.error || 'Terjadi kesalahan'));
      } else {
        setNewRuleName("");
        setIsCreating(false);
      }
      mutate();
    } catch (e: any) {
      alert('Gagal membuat aturan: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Template Presets */}
      <div className="clay-surface rounded-[28px] p-5 shadow-md border border-zinc-200/50 dark:border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            <span className="text-xs font-black uppercase text-zinc-700 dark:text-zinc-300 tracking-wider">
              Template Aturan Siap Pakai
            </span>
          </div>
          <span className="text-[10.5px] font-bold text-zinc-400">1-Klik Aktifkan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_RULES.map((preset, idx) => (
            <button
              key={idx}
              disabled={saving}
              onClick={() => applyPreset(preset)}
              className="p-3.5 rounded-[18px] clay-button text-left transition-all active:scale-95 flex flex-col justify-between gap-2 hover:-translate-y-0.5"
            >
              <div>
                <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">{preset.name}</p>
                <p className="text-[10px] text-zinc-400 font-bold mt-1 line-clamp-2">
                  {preset.action.message || `Aksi: Status -> ${preset.action.status}`}
                </p>
              </div>
              <span className="text-[9.5px] font-black text-emerald-600 dark:text-emerald-400 self-end">
                + Pasang Aturan
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Rules List Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
            Daftar Aturan Aktif ({rules.length})
          </h3>
          <p className="text-[10.5px] text-zinc-400 font-bold">
            Aturan background sinkronisasi status dokter & TV display
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="clay-pill-violet text-white px-3.5 py-1.5 rounded-[14px] text-xs font-black flex items-center gap-1.5 active:scale-95 shadow-sm"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Buat Aturan</span>
        </button>
      </div>

      {/* Create Modal/Form */}
      {isCreating && (
        <div className="p-4 rounded-[22px] clay-surface shadow-lg border border-violet-500/30 space-y-3 animate-in fade-in duration-200">
          <p className="text-xs font-black text-violet-600 dark:text-violet-400">Aturan Baru</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Nama Aturan</label>
              <input
                type="text"
                placeholder="cth: Auto-Update Shift Malam"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                className="w-full clay-inset text-xs font-black p-2.5 rounded-[14px] outline-none text-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Target Status Dokter</label>
              <select
                value={selectedActionStatus}
                onChange={(e) => setSelectedActionStatus(e.target.value)}
                className="w-full clay-inset text-xs font-black p-2.5 rounded-[14px] outline-none text-zinc-800 dark:text-zinc-100"
              >
                <option value="SELESAI">SELESAI</option>
                <option value="LIBUR">LIBUR</option>
                <option value="CUTI">CUTI</option>
                <option value="OPERASI">OPERASI</option>
                <option value="PRAKTEK">PRAKTEK</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-3.5 py-1.5 text-xs font-black rounded-[12px] clay-button text-zinc-500"
            >
              Batal
            </button>
            <button
              onClick={handleCreate}
              disabled={!newRuleName.trim() || saving}
              className="px-4 py-1.5 text-xs font-black rounded-[12px] clay-pill-emerald text-white shadow-sm"
            >
              {saving ? "Menyimpan..." : "Simpan Aturan"}
            </button>
          </div>
        </div>
      )}

      {/* Rules Table / Cards */}
      <div className="space-y-2.5">
        {rules.length === 0 ? (
          <div className="text-center py-10 clay-surface rounded-[24px] text-zinc-400 text-xs font-bold">
            Belum ada aturan aktif. Pilih template siap pakai di atas atau buat aturan baru.
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="clay-surface rounded-[20px] p-4 flex items-center justify-between gap-3 shadow-sm hover:-translate-y-0.5 transition-all border border-zinc-200/50 dark:border-white/5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-9 h-9 rounded-[12px] flex items-center justify-center text-white shrink-0 shadow-sm",
                    rule.active ? "clay-pill-emerald" : "clay-button text-zinc-400"
                  )}
                >
                  <Shield size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-[13px] font-black text-zinc-900 dark:text-zinc-100 truncate">
                    {rule.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                        rule.active ? "clay-pill-emerald text-white" : "clay-button text-zinc-400"
                      )}
                    >
                      {rule.active ? "Aktif" : "Nonaktif"}
                    </span>
                    {rule.action?.status && (
                      <span className="text-[10px] font-bold text-zinc-400">
                        Aksi: Ubah status → {rule.action.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleRule(rule)}
                  className={cn(
                    "p-2 rounded-[10px] text-xs font-black transition-all active:scale-95",
                    rule.active ? "clay-pill-emerald text-white" : "clay-button text-zinc-400"
                  )}
                  title={rule.active ? "Matikan" : "Nyalakan"}
                >
                  {rule.active ? <Power size={13} /> : <PowerOff size={13} />}
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-2 rounded-[10px] clay-button text-zinc-400 hover:text-rose-600 transition-all active:scale-95"
                  title="Hapus"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
