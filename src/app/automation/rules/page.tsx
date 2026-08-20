"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Plus, Edit2, Trash2, Save, X, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

interface AutomationRule {
    id: number;
    name: string;
    condition: any;
    action: any;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function AutomationRulesPage() {
    const { data: rulesData, mutate, isLoading, error } = useSWR<AutomationRule[]>('/api/automation-rules');
    const rules = Array.isArray(rulesData) ? rulesData : [];
    const [editing, setEditing] = useState<AutomationRule | null>(null);
    const [open, setOpen] = useState(false);

    const openEditor = (rule?: AutomationRule) => {
        if (rule) setEditing(rule);
        else setEditing({ id: 0, name: '', condition: {}, action: {}, active: true, createdAt: '', updatedAt: '' });
        setOpen(true);
    };

    const closeEditor = () => {
        setOpen(false);
    };

    useEffect(() => {
        setPreview(null);
    }, [editing]);

    const [preview, setPreview] = useState<any>(null);

    const saveRule = async () => {
        if (!editing) return;
        const method = editing.id ? 'PUT' : 'POST';
        const dto = { ...editing };
        const res = await fetch('/api/automation-rules', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
        });
        if (res.ok) {
            mutate();
            closeEditor();
            setPreview(null);
        } else {
            alert('Failed to save rule');
        }
    };

    const deleteRule = async (id: number) => {
        if (!confirm('Hapus rule ini?')) return;
        await fetch(`/api/automation-rules?id=${id}`, { method: 'DELETE' });
        mutate();
    };

    return (
        <div className="p-2 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-32 lg:pb-8 text-zinc-900 dark:text-zinc-100">
            <PageHeader
                icon={<Sparkles size={22} className="text-white" strokeWidth={2.5} />}
                title="Aturan Automasi"
                accentWord="Automasi"
                accentColor="text-violet-600 dark:text-violet-400"
                subtitle="Konfigurasi aturan automasi sinkronisasi SIMED & TV Display"
                iconClay="clay-icon-violet"
                accentBarGradient="from-indigo-500 via-violet-500 to-purple-500"
                actions={
                    <button
                        onClick={() => openEditor()}
                        className="clay-pill-violet px-5 py-2.5 rounded-2xl text-white flex items-center justify-center gap-2 text-xs font-black w-full sm:w-auto active:scale-95 transition-all shadow-md"
                    >
                        <Plus size={16} strokeWidth={2.5} /> Aturan Baru
                    </button>
                }
            />
            {error && (
                <div className="mb-4 p-4 clay-pill-rose text-white rounded-2xl text-xs font-bold">
                    Gagal memuat rules. Pastikan Anda memiliki akses administrator.
                </div>
            )}
            <div className="space-y-3">
                {rules.map(rule => (
                    <div key={rule.id} className="clay-surface flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[24px] gap-4 shadow-md">
                        <div>
                            <p className="font-black text-sm text-zinc-900 dark:text-zinc-100">{rule.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn("text-[10px] font-black px-2.5 py-0.5 rounded-full", rule.active ? "clay-pill-emerald text-white" : "clay-button text-zinc-500")}>
                                    {rule.active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-200/60 dark:border-white/5">
                            <button onClick={() => openEditor(rule)} className="p-2.5 clay-button text-blue-600 dark:text-blue-400 rounded-xl active:scale-95 transition-all"><Edit2 size={16} /></button>
                            <button onClick={() => deleteRule(rule.id)} className="p-2.5 clay-button text-rose-600 dark:text-rose-400 rounded-xl active:scale-95 transition-all"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                {rules.length === 0 && (
                    <div className="clay-surface p-12 rounded-[28px] text-center text-zinc-400 font-bold text-xs">
                        Belum ada rule yang dibuat.
                    </div>
                )}
            </div>

            {/* Editor dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg clay-surface rounded-[36px] p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <DialogTitle className="text-lg font-black text-zinc-900 dark:text-zinc-100">{editing?.id ? 'Edit Rule' : 'Aturan Baru'}</DialogTitle>
                        <DialogClose asChild>
                            <button className="p-2 clay-button text-zinc-500 rounded-full active:scale-95"><X size={16}/></button>
                        </DialogClose>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Nama Rule</label>
                            <input
                                type="text"
                                className="w-full clay-inset rounded-2xl px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                                value={editing?.name || ''}
                                onChange={e => setEditing(editing ? { ...editing, name: e.target.value } : null)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Condition (JSON)</label>
                            <textarea
                                className="w-full clay-inset rounded-2xl p-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 outline-none resize-none"
                                rows={4}
                                value={editing ? JSON.stringify(editing.condition, null, 2) : ''}
                                onChange={e => {
                                    try {
                                        const obj = JSON.parse(e.target.value);
                                        setEditing(editing ? { ...editing, condition: obj } : null);
                                    } catch { }
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5">Action (JSON)</label>
                            <textarea
                                className="w-full clay-inset rounded-2xl p-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 outline-none resize-none"
                                rows={4}
                                value={editing ? JSON.stringify(editing.action, null, 2) : ''}
                                onChange={e => {
                                    try {
                                        const obj = JSON.parse(e.target.value);
                                        setEditing(editing ? { ...editing, action: obj } : null);
                                    } catch { }
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="active_check"
                                checked={editing?.active || false}
                                onChange={e => setEditing(editing ? { ...editing, active: e.target.checked } : null)}
                                className="rounded"
                            />
                            <label htmlFor="active_check" className="text-xs font-black text-zinc-700 dark:text-zinc-300">Status Aktif</label>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2.5">
                        <button
                            onClick={async () => {
                                if (!editing) return;
                                const res = await fetch('/api/automation-rules/test', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ rule: editing })
                                });
                                if (res.ok) {
                                    const data = await res.json();
                                    setPreview(data.updates);
                                } else {
                                    alert('Preview failed');
                                }
                            }}
                            className="px-4 py-2.5 rounded-xl clay-pill-amber text-white font-black text-xs w-full sm:w-auto text-center active:scale-95"
                        >Preview</button>
                        <button onClick={closeEditor} className="px-4 py-2.5 rounded-xl clay-button text-zinc-600 dark:text-zinc-300 font-black text-xs w-full sm:w-auto text-center active:scale-95">Batal</button>
                        <button onClick={saveRule} className="px-5 py-2.5 rounded-xl clay-pill-blue text-white font-black text-xs w-full sm:w-auto text-center active:scale-95 shadow-md">Simpan</button>
                    </div>
                    {preview && (
                        <div className="mt-4 p-4 clay-inset rounded-2xl">
                            <h3 className="font-black text-xs mb-2">Preview Pembaruan</h3>
                            {preview.length > 0 ? (
                                <ul className="list-disc pl-5 text-xs font-mono">
                                    {preview.map((u: any, idx: number) => (
                                        <li key={idx}>{`id=${u.id} → status=${u.status}`}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-zinc-400 font-bold">Tidak ada perubahan yang akan diterapkan.</p>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
