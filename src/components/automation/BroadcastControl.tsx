"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Trash2, Edit3, X, Power, PowerOff, Save, MonitorPlay } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BroadcastRule } from "@/lib/data-service";

const ALERT_COLORS: Record<string, { bg: string; text: string; badge: string; border: string }> = {
    Information: { bg: "bg-blue-500/10", text: "text-blue-400", badge: "bg-blue-500", border: "border-blue-500/20" },
    Warning: { bg: "bg-amber-500/10", text: "text-amber-400", badge: "bg-amber-500", border: "border-amber-500/20" },
    Critical: { bg: "bg-red-500/10", text: "text-red-400", badge: "bg-red-500", border: "border-red-500/20" },
};

const EMPTY_RULE: Partial<BroadcastRule> = {
    message: "",
    alertLevel: "Information",
    targetZone: "All Zones",
    duration: 60,
    active: true,
};

export function BroadcastControl() {
    const [rules, setRules] = useState<BroadcastRule[]>([]);
    const [editingRule, setEditingRule] = useState<Partial<BroadcastRule> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchRules(); }, []);

    const fetchRules = async () => {
        try {
            const res = await fetch('/api/automation');
            setRules(await res.json());
        } catch { /* silent */ }
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
        fetchRules();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this broadcast rule?")) return;
        await fetch(`/api/automation?id=${id}`, { method: 'DELETE' });
        fetchRules();
    };

    const handleToggle = async (rule: BroadcastRule) => {
        await fetch('/api/automation', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...rule, active: !rule.active })
        });
        fetchRules();
    };

    const activePreview = rules.find(r => r.active);

    return (
        <div className="rounded-2xl border border-white/[0.06] bg-slate-950/40 p-6 backdrop-blur-xl h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                        <Megaphone className="text-orange-400 h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Broadcast Rules</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Manage display notifications & alerts</p>
                    </div>
                </div>
                <button
                    onClick={() => { setIsCreating(true); setEditingRule({ ...EMPTY_RULE }); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-lg shadow-blue-600/15 transition-all active:scale-95"
                >
                    <Plus size={14} /> New Rule
                </button>
            </div>

            {/* Live Preview */}
            <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Live Preview</span>
                    {activePreview && (
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] text-red-400 font-bold tracking-wider">LIVE</span>
                        </div>
                    )}
                </div>
                <div className="relative aspect-[21/9] bg-slate-950 rounded-xl overflow-hidden border border-white/[0.06] shadow-inner">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <MonitorPlay className="h-10 w-10 text-slate-700" />
                    </div>
                    {activePreview ? (
                        <>
                            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur border border-white/10 p-2.5 rounded-lg max-w-[220px]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className={cn("h-1.5 w-1.5 rounded-full", ALERT_COLORS[activePreview.alertLevel]?.badge)} />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{activePreview.alertLevel}</span>
                                </div>
                                <p className="text-[10px] text-slate-200 leading-snug">{activePreview.message}</p>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-900/80 to-transparent p-3">
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-[9px] font-bold text-white px-2 py-0.5 rounded", ALERT_COLORS[activePreview.alertLevel]?.badge)}>
                                        {activePreview.alertLevel.toUpperCase()}
                                    </span>
                                    <span className="text-[9px] text-slate-400">{activePreview.targetZone} · {activePreview.duration}min</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-xs text-slate-600 font-medium">No active broadcast</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rules List */}
            <div className="flex-1 overflow-y-auto space-y-2 -mr-2 pr-2">
                {rules.length === 0 && (
                    <div className="text-center py-10">
                        <Megaphone size={24} className="mx-auto text-slate-700 mb-2" />
                        <p className="text-xs text-slate-500">No broadcast rules yet</p>
                        <p className="text-[10px] text-slate-600">Create one to get started</p>
                    </div>
                )}

                {rules.map((rule) => {
                    const color = ALERT_COLORS[rule.alertLevel] || ALERT_COLORS.Information;
                    return (
                        <div
                            key={rule.id}
                            className={cn(
                                "group relative rounded-xl p-3.5 border transition-all",
                                rule.active
                                    ? `${color.bg} ${color.border}`
                                    : "bg-white/[0.01] border-white/[0.04] opacity-60"
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={cn(
                                            "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                            color.bg, color.text
                                        )}>
                                            {rule.alertLevel}
                                        </span>
                                        <span className="text-[9px] text-slate-500 font-medium">{rule.targetZone}</span>
                                        <span className="text-[9px] text-slate-600">· {rule.duration}min</span>
                                    </div>
                                    <p className="text-sm text-white/90 leading-snug font-medium truncate">{rule.message}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button
                                        onClick={() => handleToggle(rule)}
                                        className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            rule.active ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-500 hover:bg-white/5"
                                        )}
                                        title={rule.active ? "Deactivate" : "Activate"}
                                    >
                                        {rule.active ? <Power size={13} /> : <PowerOff size={13} />}
                                    </button>
                                    <button
                                        onClick={() => { setEditingRule({ ...rule }); setIsCreating(false); }}
                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <Edit3 size={13} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Edit / Create Modal ──────────────────────── */}
            {editingRule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/50 backdrop-blur-xl relative">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-base font-bold text-white">
                                {isCreating ? "Create Broadcast Rule" : "Edit Broadcast Rule"}
                            </h3>
                            <button onClick={() => { setEditingRule(null); setIsCreating(false); }} className="text-slate-500 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Message</label>
                                <textarea
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all h-20 resize-none placeholder:text-slate-600"
                                    placeholder="Enter broadcast message..."
                                    value={editingRule.message}
                                    onChange={e => setEditingRule({ ...editingRule, message: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Alert Level</label>
                                    <select
                                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                        value={editingRule.alertLevel}
                                        onChange={e => setEditingRule({ ...editingRule, alertLevel: e.target.value as any })}
                                    >
                                        <option value="Information">Information</option>
                                        <option value="Warning">Warning</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Target Zone</label>
                                    <select
                                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                        value={editingRule.targetZone}
                                        onChange={e => setEditingRule({ ...editingRule, targetZone: e.target.value as any })}
                                    >
                                        <option value="All Zones">All Zones</option>
                                        <option value="Lobby Only">Lobby Only</option>
                                        <option value="ER &amp; Wards">ER &amp; Wards</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Duration</label>
                                    <span className="text-[10px] text-blue-400 font-mono font-bold">{editingRule.duration} min</span>
                                </div>
                                <input
                                    type="range"
                                    min="15" max="120" step="15"
                                    value={editingRule.duration}
                                    onChange={e => setEditingRule({ ...editingRule, duration: Number(e.target.value) })}
                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => { setEditingRule(null); setIsCreating(false); }}
                                    className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                                    {saving ? 'Saving...' : isCreating ? 'Create Rule' : 'Update Rule'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
