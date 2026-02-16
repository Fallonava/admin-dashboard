import { useState } from "react";
import { X } from "lucide-react";
import useSWR from "swr";
import type { Doctor } from "@/lib/data-service";

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

export function LeaveRequestModal({ isOpen, onClose, onSubmit }: LeaveRequestModalProps) {
    const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
    const [newLeave, setNewLeave] = useState({
        doctor: "",
        type: "Vacation",
        startDate: "",
        endDate: "",
        status: "Pending"
    });

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!newLeave.doctor || !newLeave.startDate || !newLeave.endDate) return;

        // Validation: End Date cannot be before Start Date
        if (new Date(newLeave.endDate) < new Date(newLeave.startDate)) {
            alert("End date cannot be before start date");
            return;
        }

        await onSubmit({
            ...newLeave,
            dates: `${newLeave.startDate} - ${newLeave.endDate}`,
            avatar: "/avatars/default.png" // Placeholder, ideally fetch doctor's avatar
        });

        setNewLeave({ doctor: "", type: "Vacation", startDate: "", endDate: "", status: "Pending" });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/50 relative backdrop-blur-xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
                <h3 className="text-base font-bold text-white mb-5">Add Leave Request</h3>

                <div className="space-y-3.5">
                    <div>
                        <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Doctor Name</label>
                        <select
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all [&>option]:bg-slate-900"
                            value={newLeave.doctor}
                            onChange={e => setNewLeave({ ...newLeave, doctor: e.target.value })}
                            autoFocus
                        >
                            <option value="" disabled>Select Doctor</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.name}>{doc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Type</label>
                        <select
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all [&>option]:bg-slate-900"
                            value={newLeave.type}
                            onChange={e => setNewLeave({ ...newLeave, type: e.target.value as any })}
                        >
                            <option value="Vacation">Vacation</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Conference">Conference</option>
                            <option value="Personal">Personal</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">Start</label>
                            <input
                                type="date"
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all [color-scheme:dark]"
                                value={newLeave.startDate}
                                onChange={e => setNewLeave({ ...newLeave, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1.5">End</label>
                            <input
                                type="date"
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-sm text-white focus:border-blue-500/50 outline-none transition-all [color-scheme:dark]"
                                value={newLeave.endDate}
                                onChange={e => setNewLeave({ ...newLeave, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!newLeave.doctor || !newLeave.startDate || !newLeave.endDate}
                        className="w-full py-2.5 mt-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                    >
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
    );
}
