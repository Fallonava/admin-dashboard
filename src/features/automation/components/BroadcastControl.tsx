"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Megaphone, Plus, Trash2, Edit3, X, Power, PowerOff, Save, MonitorPlay, Sparkles, AlertTriangle, Zap, ShieldAlert, Wrench, Info, ChevronDown, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BroadcastRule } from "@/lib/data-service";

const ALERT_COLORS: Record<string, { bg: string; text: string; badgeBg: string; border: string; cardBg: string; cardBorder: string; gradient: string }> = {
    Information: {
        bg: "bg-blue-50/80", text: "text-blue-700", badgeBg: "bg-gradient-to-r from-blue-500 to-indigo-500",
        border: "border-blue-200/60", cardBg: "bg-gradient-to-br from-blue-50/50 to-indigo-50/30", cardBorder: "border-blue-200/40",
        gradient: "from-blue-100 to-indigo-100"
    },
    Warning: {
        bg: "bg-amber-50/80", text: "text-amber-700", badgeBg: "bg-gradient-to-r from-amber-500 to-orange-500",
        border: "border-amber-200/60", cardBg: "bg-gradient-to-br from-amber-50/50 to-orange-50/30", cardBorder: "border-amber-200/40",
        gradient: "from-amber-100 to-orange-100"
    },
    Critical: {
        bg: "bg-rose-50/80", text: "text-rose-700", badgeBg: "bg-gradient-to-r from-rose-500 to-red-600",
        border: "border-rose-200/60", cardBg: "bg-gradient-to-br from-rose-50/50 to-red-50/30", cardBorder: "border-rose-200/40",
        gradient: "from-rose-100 to-red-100"
    },
};

const PRESETS = [
    { icon: Wrench, label: "Gangguan Sistem", message: "Mohon maaf, sedang terjadi gangguan pada sistem pendaftaran. Silakan hubungi petugas untuk bantuan.", alertLevel: "Warning" as const, color: "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 border-amber-200/60 shadow-inner" },
    { icon: ShieldAlert, label: "Maintenance", message: "Sistem sedang dalam pemeliharaan terjadwal. Layanan akan kembali normal dalam beberapa saat.", alertLevel: "Information" as const, color: "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 border-blue-200/60 shadow-inner" },
    { icon: AlertTriangle, label: "Darurat", message: "PERHATIAN: Terjadi situasi darurat. Mohon ikuti instruksi petugas keamanan.", alertLevel: "Critical" as const, color: "bg-gradient-to-br from-rose-50 to-red-50 text-rose-700 border-rose-200/60 shadow-inner" },
    { icon: Info, label: "Info Umum", message: "", alertLevel: "Information" as const, color: "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 border-slate-200/60 shadow-inner" },
];

const EMPTY_RULE: Partial<BroadcastRule> = {
    message: "",
    alertLevel: "Information",
    targetZone: "All Zones",
    duration: 60,
    active: true,
};

export function BroadcastControl() {
    const { data: rules = [] } = useSWR<BroadcastRule[]>('/api/automation');
    const [editingRule, setEditingRule] = useState<Partial<BroadcastRule> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [stoppingAll, setStoppingAll] = useState(false);

    const CustomDropdown = ({ value, options, onChange, label, placeholder, className }: any) => {
        const [open, setOpen] = useState(false);
        const selectedLabel = options.find((o: any) => o.value === value)?.label || placeholder || "Select";

        return (
            <div className={cn("relative z-30 flex-1", className)} onMouseLeave={() => setOpen(false)}>
                {label && <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.15em] block mb-2">{label}</label>}
                <button 
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="flex justify-between items-center w-full bg-white border border-slate-200/80 rounded-[18px] p-3.5 text-sm text-slate-800 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-300 min-h-[50px] shadow-sm hover:border-orange-300"
                >
                    <span className="truncate pr-2 font-black">{selectedLabel}</span>
                    <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-300 flex-shrink-0", open && "rotate-180")} />
                </button>
                
                <div className={cn(
                    "absolute top-[calc(100%+8px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-[20px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-1.5 transition-all duration-300 origin-top z-50 max-h-[220px] overflow-y-auto custom-scrollbar",
                    open ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
                )}>
                    {options.map((opt: any) => (
                        <button
                            type="button"
                            key={opt.value}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(opt.value); setOpen(false); }}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-[14px] text-sm font-bold transition-all duration-200 mb-1 last:mb-0 truncate",
                                value === opt.value 
                                    ? "bg-gradient-to-r from-orange-50 to-rose-50 text-orange-700 shadow-sm" 
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const handleSave = async () => {
        if (!editingRule?.message?.trim()) return;
        setSaving(true);
        const method = editingRule.id ? 'PUT' : 'POST';
        await fetch('/api/automation', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingRule)
        });
        setSaving(false);
        setEditingRule(null);
        setIsCreating(false);
        mutate('/api/automation');
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus broadcast rule ini?")) return;
        await fetch(`/api/automation?id=${id}`, { method: 'DELETE' });
        mutate('/api/automation');
    };

    const handleToggle = async (rule: BroadcastRule) => {
        await fetch('/api/automation', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...rule, active: !rule.active })
        });
        mutate('/api/automation');
    };

    const handleStopAll = async () => {
        setStoppingAll(true);
        const activeRules = rules.filter(r => r.active);
        await Promise.all(activeRules.map(rule =>
            fetch('/api/automation', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...rule, active: false })
            })
        ));
        setStoppingAll(false);
        mutate('/api/automation');
    };

    const handlePreset = (preset: typeof PRESETS[0]) => {
        setIsCreating(true);
        setEditingRule({
            ...EMPTY_RULE,
            message: preset.message,
            alertLevel: preset.alertLevel,
        });
    };

    const activePreview = rules.find(r => r.active);
    const alertColor = activePreview ? ALERT_COLORS[activePreview.alertLevel] : null;
    const hasActiveBroadcast = rules.some(r => r.active);

    return (
        <div className="flex flex-col h-full bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden group transition-all duration-500 hover:shadow-[0_8px_50px_rgba(0,0,0,0.08)] hover:bg-white/80 p-1">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 h-80 w-80 bg-gradient-to-bl from-orange-400/20 to-rose-400/20 blur-[80px] -z-10 pointer-events-none group-hover:scale-110 transition-transform duration-700 ease-out" />

            <div className="p-6 md:p-8 flex flex-col h-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[20px] bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 group-hover:scale-105 transition-all duration-500 border border-white/20">
                            <Tv size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Emergency Broadcast</h3>
                            <p className="text-[11px] text-orange-600 font-mono uppercase tracking-[0.2em] mt-1 font-bold">Popup Display Control</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {hasActiveBroadcast && (
                            <button
                                onClick={handleStopAll}
                                disabled={stoppingAll}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 rounded-full flex items-center gap-2 text-xs font-black border border-rose-200 transition-all active:scale-95 shadow-sm"
                            >
                                <PowerOff size={16} />
                                {stoppingAll ? 'Stopping...' : 'Stop All'}
                            </button>
                        )}
                        <button
                            onClick={() => { setIsCreating(true); setEditingRule({ ...EMPTY_RULE }); }}
                            className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-[13px] font-black shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)] hover:shadow-[0_8px_25px_-6px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                            <Plus size={18} /> Custom
                        </button>
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="mb-8 relative z-10">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 px-2">Template Cepat</span>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {PRESETS.map((preset, i) => {
                            const Icon = preset.icon;
                            return (
                                <button
                                    key={i}
                                    onClick={() => handlePreset(preset)}
                                    className={cn(
                                        "flex flex-col items-center gap-2.5 p-4 rounded-[24px] border border-white/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-95 bg-white/50 backdrop-blur-sm",
                                        preset.color
                                    )}
                                >
                                    <div className="p-2 bg-white/60 rounded-[14px] shadow-sm">
                                        <Icon size={20} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-wider">{preset.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Live Preview */}
                <div className="mb-8 relative z-10">
                    <div className="flex justify-between items-center mb-3 px-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Display Preview</span>
                        {activePreview && (
                            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200/80 px-3 py-1.5 rounded-full shadow-sm">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </div>
                                <span className="text-[10px] text-rose-700 font-black tracking-widest uppercase">ON AIR</span>
                            </div>
                        )}
                    </div>

                    <div className="relative aspect-[21/9] bg-slate-900 rounded-[32px] overflow-hidden border-[6px] border-slate-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] group/preview">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900 pointer-events-none" />
                        {/* Realistic glass reflection */}
                        <div className="absolute -inset-10 bg-gradient-to-tr from-white/5 via-white/10 to-transparent -rotate-12 translate-x-1/2 opacity-30 pointer-events-none" />
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                            <MonitorPlay className="h-20 w-20 text-slate-500" />
                        </div>

                        {activePreview && alertColor ? (
                            <>
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-500">
                                    <div className={cn("bg-white/90 backdrop-blur-2xl rounded-[32px] p-6 max-w-[320px] text-center border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-700", alertColor.border)}>
                                        <div className={cn("inline-flex items-center justify-center w-14 h-14 rounded-[20px] mb-4 shadow-inner", alertColor.bg)}>
                                            <AlertTriangle size={28} className={alertColor.text} strokeWidth={2.5} />
                                        </div>
                                        <div className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-2", alertColor.text)}>
                                            {activePreview.alertLevel}
                                        </div>
                                        <p className="text-sm text-slate-800 leading-relaxed font-bold line-clamp-3">
                                            {activePreview.message}
                                        </p>
                                        <div className="text-[10px] text-slate-400 font-mono mt-4 font-bold bg-slate-100/80 px-3 py-1.5 rounded-full inline-block">
                                            {activePreview.targetZone.replace('_', ' ')} • {activePreview.duration}m
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <MonitorPlay className="h-10 w-10 text-slate-600 group-hover/preview:scale-110 transition-transform duration-700" />
                                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">No active broadcast</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rules List */}
                <div className="space-y-4 relative z-10 mt-auto">
                    <div className="flex items-center justify-between px-2 mb-3">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Broadcast Rules</span>
                        <span className="text-[11px] font-mono font-bold text-slate-400 bg-white/60 px-2 py-0.5 rounded-full border border-slate-200/50">{rules.length} total</span>
                    </div>

                    {rules.length === 0 && (
                        <div className="text-center py-12 bg-white/40 backdrop-blur-sm border border-slate-200/60 rounded-[32px] shadow-sm">
                            <Megaphone size={32} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-sm font-black text-slate-500">Belum ada broadcast rule</p>
                            <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Gunakan template di atas atau buat custom.</p>
                        </div>
                    )}

                    {rules.map((rule) => {
                        const color = ALERT_COLORS[rule.alertLevel] || ALERT_COLORS.Information;
                        return (
                            <div key={rule.id} className="group/item flex items-center justify-between p-5 bg-white/60 backdrop-blur-sm rounded-[28px] border border-white/80 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] hover:border-orange-200/60 transition-all duration-300 hover:-translate-y-0.5">
                                <div className="flex items-center gap-5 overflow-hidden">
                                    <div className={cn(
                                        "w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-inner group-hover/item:scale-110 transition-transform duration-500 border",
                                        rule.active ? cn(color.badgeBg, "text-white border-transparent") : "bg-slate-100/80 text-slate-400 border-slate-200/60"
                                    )}>
                                        <AlertTriangle size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-[8px] border shadow-sm",
                                                color.bg, color.text, color.border
                                            )}>
                                                {rule.alertLevel}
                                            </span>
                                            {rule.active && (
                                                <span className="text-[9px] font-black uppercase tracking-widest text-rose-700 bg-rose-100 px-2.5 py-1 rounded-[8px] border border-rose-200 flex items-center gap-1.5 shadow-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                    LIVE
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-600 font-bold bg-white/80 px-2.5 py-1 rounded-[8px] border border-slate-200/80 shadow-sm">
                                                {rule.targetZone.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-50/80 px-2 py-1 rounded-[8px] border border-slate-200/50">
                                                {rule.duration}m
                                            </span>
                                        </div>
                                        <p className={cn("text-[15px] leading-snug font-bold line-clamp-2", rule.active ? "text-slate-800" : "text-slate-500")}>
                                            {rule.message}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex-shrink-0 bg-white/95 backdrop-blur-xl px-2 py-2 rounded-[20px] border border-slate-200/80 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)]">
                                        <button
                                            onClick={() => handleToggle(rule)}
                                            className={cn(
                                                "p-2.5 rounded-[14px] transition-all duration-200 font-bold text-[10px] flex items-center gap-1 uppercase tracking-wider",
                                                rule.active
                                                    ? "text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200"
                                                    : "text-slate-500 bg-slate-100 hover:text-emerald-700 hover:bg-emerald-100/80"
                                            )}
                                        >
                                            {rule.active ? <Power size={16} /> : <PowerOff size={16} />}
                                        </button>
                                        <div className="w-px h-6 bg-slate-200/80 mx-1" />
                                        <button
                                            onClick={() => { setEditingRule({ ...rule }); setIsCreating(false); }}
                                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-[14px] transition-colors"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(String(rule.id))}
                                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[14px] transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Premium Glassmorphic Modal */}
                {editingRule && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[40px] p-8 w-full max-w-lg shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                            <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-orange-300/30 to-rose-300/30 blur-[60px] -z-10 pointer-events-none" />

                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3.5 rounded-[20px] bg-gradient-to-tr from-orange-100 to-rose-100 text-orange-600 border border-orange-200/60 shadow-inner">
                                        <Sparkles size={22} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                        {isCreating ? "Buat Broadcast" : "Edit Broadcast"}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => { setEditingRule(null); setIsCreating(false); }}
                                    className="p-2.5 bg-slate-100/80 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors border border-slate-200/60"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2 px-1">Pesan Broadcast</label>
                                    <textarea
                                        className="w-full bg-slate-50/50 border border-slate-200/80 rounded-[24px] p-5 text-[15px] font-bold text-slate-800 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-300 h-32 resize-none placeholder:text-slate-400 shadow-inner"
                                        placeholder="Tulis pesan broadcast untuk ditampilkan di layar display..."
                                        value={editingRule.message}
                                        onChange={e => setEditingRule({ ...editingRule, message: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <CustomDropdown 
                                        label="Level Alert"
                                        value={editingRule.alertLevel}
                                        options={[
                                            { value: 'Information', label: 'ℹ️ Information' },
                                            { value: 'Warning', label: '⚠️ Warning' },
                                            { value: 'Critical', label: '🚨 Critical' },
                                        ]}
                                        onChange={(v: any) => setEditingRule({ ...editingRule, alertLevel: v })}
                                    />
                                    <CustomDropdown 
                                        label="Target Zone"
                                        value={editingRule.targetZone}
                                        options={[
                                            { value: 'All_Zones', label: 'All Zones' },
                                            { value: 'Lobby_Only', label: 'Lobby Only' },
                                            { value: 'ER_Wards', label: 'ER & Wards' },
                                        ]}
                                        onChange={(v: any) => setEditingRule({ ...editingRule, targetZone: v })}
                                    />
                                </div>

                                <div className="bg-slate-50/80 p-5 rounded-[24px] border border-slate-200/60 shadow-sm">
                                    <div className="flex justify-between mb-4 items-center px-1">
                                        <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Durasi (Menit)</label>
                                        <span className="text-sm text-orange-700 font-mono font-black bg-orange-100 px-3 py-1.5 rounded-[12px] border border-orange-200 shadow-sm">{editingRule.duration}m</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="15" max="120" step="15"
                                        value={editingRule.duration}
                                        onChange={e => setEditingRule({ ...editingRule, duration: Number(e.target.value) })}
                                        className="w-full h-3 bg-slate-200/80 rounded-full appearance-none cursor-pointer accent-orange-500 transition-all shadow-inner"
                                    />
                                    <div className="flex justify-between mt-3 px-2 text-[10px] text-slate-400 font-mono font-bold">
                                        <span>15</span><span>60</span><span>120</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => { setEditingRule(null); setIsCreating(false); }}
                                        className="flex-1 py-4.5 rounded-full border-2 border-slate-200/80 text-slate-500 hover:text-slate-800 text-[15px] font-black hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 py-4.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-600 text-white text-[15px] font-black hover:from-orange-400 hover:to-rose-500 transition-all shadow-[0_10px_25px_-6px_rgba(244,63,94,0.5)] active:scale-[0.98] flex items-center justify-center gap-2 hover:shadow-[0_10px_30px_-6px_rgba(244,63,94,0.6)] border border-rose-500/50"
                                    >
                                        {saving ? <div className="h-5 w-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" /> : <Zap size={20} strokeWidth={2.5} />}
                                        {saving ? 'Menyimpan...' : isCreating ? 'Broadcast Sekarang' : 'Update Broadcast'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
