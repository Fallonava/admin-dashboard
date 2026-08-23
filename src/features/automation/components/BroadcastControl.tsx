"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Megaphone, Plus, Trash2, Edit3, X, Power, PowerOff, Save, MonitorPlay, Sparkles, AlertTriangle, Zap, ShieldAlert, Wrench, Info, ChevronDown, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BroadcastRule } from "@/lib/data-service";

const ALERT_COLORS: Record<string, { clayPill: string; text: string; bg: string }> = {
    Information: {
        clayPill: "clay-pill-blue text-white",
        text: "text-blue-600 dark:text-blue-400",
        bg: "clay-button text-blue-700 dark:text-blue-300"
    },
    Warning: {
        clayPill: "clay-pill-amber text-white",
        text: "text-amber-600 dark:text-amber-400",
        bg: "clay-button text-amber-700 dark:text-amber-300"
    },
    Critical: {
        clayPill: "clay-pill-rose text-white",
        text: "text-rose-600 dark:text-rose-400",
        bg: "clay-button text-rose-700 dark:text-rose-300"
    },
};

const PRESETS = [
    { icon: Wrench, label: "Gangguan Sistem", message: "Mohon maaf, sedang terjadi gangguan pada sistem pendaftaran. Silakan hubungi petugas untuk bantuan.", alertLevel: "Warning" as const, pill: "clay-pill-amber text-white" },
    { icon: ShieldAlert, label: "Maintenance", message: "Sistem sedang dalam pemeliharaan terjadwal. Layanan akan kembali normal dalam beberapa saat.", alertLevel: "Information" as const, pill: "clay-pill-blue text-white" },
    { icon: AlertTriangle, label: "Darurat", message: "PERHATIAN: Terjadi situasi darurat. Mohon ikuti instruksi petugas keamanan.", alertLevel: "Critical" as const, pill: "clay-pill-rose text-white" },
    { icon: Info, label: "Info Umum", message: "", alertLevel: "Information" as const, pill: "clay-button text-zinc-700 dark:text-zinc-300" },
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
                {label && <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-[0.15em] block mb-2">{label}</label>}
                <button 
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="flex justify-between items-center w-full clay-button rounded-[18px] p-3.5 text-sm text-zinc-800 dark:text-zinc-200 outline-none transition-all min-h-[50px] active:scale-95"
                >
                    <span className="truncate pr-2 font-black">{selectedLabel}</span>
                    <ChevronDown size={16} className={cn("text-zinc-400 transition-transform duration-200 flex-shrink-0", open && "rotate-180")} />
                </button>
                
                <div className={cn(
                    "absolute top-[calc(100%+8px)] left-0 w-full clay-surface rounded-[20px] p-1.5 transition-all duration-200 origin-top z-50 max-h-[220px] overflow-y-auto custom-scrollbar",
                    open ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
                )}>
                    {options.map((opt: any) => (
                        <button
                            type="button"
                            key={opt.value}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(opt.value); setOpen(false); }}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-[14px] text-sm font-extrabold transition-all duration-200 mb-1 last:mb-0 truncate",
                                value === opt.value 
                                    ? "clay-pill-amber text-white" 
                                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
        <div className="flex flex-col h-full clay-surface rounded-[36px] overflow-hidden p-6 md:p-8 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[20px] clay-pill-amber flex items-center justify-center text-white shadow-md">
                        <Tv size={26} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Emergency Broadcast</h3>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono uppercase tracking-[0.2em] mt-1 font-bold">Popup Display Control</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {hasActiveBroadcast && (
                        <button
                            onClick={handleStopAll}
                            disabled={stoppingAll}
                            className="clay-pill-rose text-white px-4 py-2.5 rounded-full flex items-center gap-2 text-xs font-black transition-all active:scale-95 shadow-sm"
                        >
                            <PowerOff size={16} />
                            {stoppingAll ? 'Stopping...' : 'Stop All'}
                        </button>
                    )}
                    <button
                        onClick={() => { setIsCreating(true); setEditingRule({ ...EMPTY_RULE }); }}
                        className="clay-pill-amber text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-[13px] font-black transition-all active:scale-95"
                    >
                        <Plus size={18} /> Custom
                    </button>
                </div>
            </div>

            {/* Quick Presets */}
            <div className="mb-8 relative z-10">
                <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] block mb-3 px-2">Template Cepat</span>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {PRESETS.map((preset, i) => {
                        const Icon = preset.icon;
                        return (
                            <button
                                key={i}
                                onClick={() => handlePreset(preset)}
                                className={cn(
                                    "flex flex-col items-center gap-2.5 p-4 rounded-[24px] clay-button transition-all active:scale-95"
                                )}
                            >
                                <div className="p-2.5 clay-inset rounded-[14px]">
                                    <Icon size={20} strokeWidth={2.5} className="text-zinc-700 dark:text-zinc-300" />
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
                    <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">Live Display Preview</span>
                    {activePreview && (
                        <div className="flex items-center gap-2 clay-pill-rose text-white px-3 py-1.5 rounded-full shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-black tracking-widest uppercase">ON AIR</span>
                        </div>
                    )}
                </div>

                <div className="relative aspect-[21/9] bg-slate-950 rounded-[32px] overflow-hidden clay-inset border-4 border-zinc-300 dark:border-zinc-800 shadow-inner group/preview flex items-center justify-center">
                    {activePreview && alertColor ? (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                            <div className="clay-surface rounded-[30px] p-6 max-w-[340px] text-center shadow-2xl animate-in zoom-in-95 duration-400">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-[20px] mb-3 clay-button">
                                    <AlertTriangle size={28} className={alertColor.text} strokeWidth={2.5} />
                                </div>
                                <div className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-2", alertColor.text)}>
                                    {activePreview.alertLevel}
                                </div>
                                <p className="text-sm text-zinc-800 dark:text-zinc-100 leading-relaxed font-black line-clamp-3">
                                    {activePreview.message}
                                </p>
                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-3 font-bold clay-inset px-3 py-1 rounded-full inline-block">
                                    {activePreview.targetZone.replace('_', ' ')} • {activePreview.duration}m
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 text-zinc-600">
                            <MonitorPlay className="h-10 w-10 text-zinc-600" />
                            <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em]">No active broadcast</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rules List */}
            <div className="space-y-4 relative z-10 mt-auto">
                <div className="flex items-center justify-between px-2 mb-3">
                    <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">Broadcast Rules</span>
                    <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 clay-button px-2.5 py-0.5 rounded-full">{rules.length} total</span>
                </div>

                {rules.length === 0 && (
                    <div className="text-center py-12 clay-inset rounded-[32px]">
                        <Megaphone size={32} className="mx-auto text-zinc-400 mb-3" />
                        <p className="text-sm font-black text-zinc-600 dark:text-zinc-300">Belum ada broadcast rule</p>
                        <p className="text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">Gunakan template di atas atau buat custom.</p>
                    </div>
                )}

                {rules.map((rule) => {
                    const color = ALERT_COLORS[rule.alertLevel] || ALERT_COLORS.Information;
                    return (
                        <div key={rule.id} className="group/item flex items-center justify-between p-5 clay-surface rounded-[26px] transition-all duration-200">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className={cn(
                                    "w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-sm",
                                    rule.active ? color.clayPill : "clay-button text-zinc-400"
                                )}>
                                    <AlertTriangle size={22} strokeWidth={2.5} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-[10px]",
                                            color.clayPill
                                        )}>
                                            {rule.alertLevel}
                                        </span>
                                        {rule.active && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white clay-pill-rose px-2.5 py-1 rounded-[10px] flex items-center gap-1.5 shadow-sm">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                LIVE
                                            </span>
                                        )}
                                        <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-bold clay-button px-2.5 py-1 rounded-[10px]">
                                            {rule.targetZone.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-mono font-black clay-inset px-2 py-1 rounded-[10px]">
                                            {rule.duration}m
                                        </span>
                                    </div>
                                    <p className={cn("text-[14px] leading-snug font-black line-clamp-2", rule.active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500")}>
                                        {rule.message}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 transition-opacity duration-200 flex-shrink-0 clay-inset px-2 py-1.5 rounded-[18px]">
                                    <button
                                        onClick={() => handleToggle(rule)}
                                        className={cn(
                                            "p-2 rounded-[12px] transition-all font-black text-[10px] flex items-center gap-1 uppercase tracking-wider",
                                            rule.active ? "clay-pill-emerald text-white" : "clay-button text-zinc-500"
                                        )}
                                        title={rule.active ? "Nonaktifkan" : "Aktifkan"}
                                    >
                                        {rule.active ? <Power size={15} /> : <PowerOff size={15} />}
                                    </button>
                                    <button
                                        onClick={() => { setEditingRule({ ...rule }); setIsCreating(false); }}
                                        className="p-2 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 clay-button rounded-[12px] transition-colors"
                                        title="Edit"
                                    >
                                        <Edit3 size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(String(rule.id))}
                                        className="p-2 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 clay-button rounded-[12px] transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Claymorphic Modal */}
            {editingRule && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="clay-surface rounded-[36px] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3.5">
                                <div className="p-3 rounded-[18px] clay-pill-amber text-white shadow-sm">
                                    <Sparkles size={20} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    {isCreating ? "Buat Broadcast" : "Edit Broadcast"}
                                </h3>
                            </div>
                            <button
                                onClick={() => { setEditingRule(null); setIsCreating(false); }}
                                className="p-2.5 clay-button rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors active:scale-95"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-[0.2em] block mb-2 px-1">Pesan Broadcast</label>
                                <textarea
                                    className="w-full clay-inset rounded-[22px] p-4 text-[14px] font-bold text-zinc-800 dark:text-zinc-100 outline-none transition-all h-28 resize-none placeholder:text-zinc-400"
                                    placeholder="Tulis pesan broadcast untuk ditampilkan di layar display..."
                                    value={editingRule.message}
                                    onChange={e => setEditingRule({ ...editingRule, message: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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

                            <div className="clay-inset p-4 rounded-[22px]">
                                <div className="flex justify-between mb-3 items-center px-1">
                                    <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-[0.2em]">Durasi (Menit)</label>
                                    <span className="text-xs text-white font-mono font-black clay-pill-amber px-3 py-1 rounded-[10px]">{editingRule.duration}m</span>
                                </div>
                                <input
                                    type="range"
                                    min="15" max="120" step="15"
                                    value={editingRule.duration}
                                    onChange={e => setEditingRule({ ...editingRule, duration: Number(e.target.value) })}
                                    className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-amber-500 transition-all"
                                />
                                <div className="flex justify-between mt-2 px-2 text-[10px] text-zinc-400 font-mono font-black">
                                    <span>15</span><span>60</span><span>120</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setEditingRule(null); setIsCreating(false); }}
                                    className="flex-1 py-3.5 rounded-2xl clay-button text-zinc-600 dark:text-zinc-300 text-[14px] font-black transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-3.5 rounded-2xl clay-pill-amber text-white text-[14px] font-black transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {saving ? <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Zap size={18} strokeWidth={2.5} />}
                                    {saving ? 'Menyimpan...' : isCreating ? 'Broadcast Sekarang' : 'Update Broadcast'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
