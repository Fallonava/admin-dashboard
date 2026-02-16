import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { LeaveRequest } from "@/lib/data-service";

export function LeaveRequests() {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            const res = await fetch('/api/leaves');
            if (res.ok) {
                const data = await res.json();
                setLeaves(data);
            }
        } catch (error) {
            console.error("Failed to fetch leaves", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();

        // Poll for updates every 10 seconds to keep in sync
        const interval = setInterval(fetchLeaves, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleApprove = async (id: number) => {
        try {
            const res = await fetch('/api/leaves', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'Approved' })
            });

            if (res.ok) {
                // Optimistic update or refetch
                fetchLeaves();
            }
        } catch (error) {
            console.error("Failed to approve", error);
        }
    };

    // Filter lists
    const pendingRequests = leaves.filter(l => l.status === 'Pending');
    const approvedRequests = leaves.filter(l => l.status === 'Approved').slice(0, 5); // Show last 5

    if (isLoading && leaves.length === 0) {
        return (
            <div className="w-80 border-l border-white/5 bg-slate-900/50 p-6 backdrop-blur-xl h-full ml-6 hidden xl:flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="w-80 border-l border-white/5 bg-slate-900/50 p-6 backdrop-blur-xl h-full ml-6 hidden xl:block overflow-y-auto">
            <h2 className="text-lg font-bold text-white">Leave Requests</h2>
            <p className="text-xs text-slate-500 mb-6">Manage Cuti Approvals</p>

            <div className="space-y-6">
                {pendingRequests.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                        <p className="text-xs text-slate-500">No pending requests</p>
                    </div>
                ) : (
                    pendingRequests.map((req) => (
                        <div key={req.id} className="rounded-xl border border-white/5 bg-slate-800/50 p-4 transition-all hover:bg-slate-800/80">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar>
                                    <AvatarImage src={req.avatar} />
                                    <AvatarFallback className="bg-slate-700 text-white font-bold text-xs">{req.doctor.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">{req.doctor}</h3>
                                    <p className="text-xs text-slate-400">{req.specialty || "General"}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Type</span>
                                    <span className="text-amber-400 font-medium bg-amber-400/10 px-2 py-0.5 rounded text-[10px]">{req.type}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Dates</span>
                                    <span className="text-slate-300">{req.dates}</span>
                                </div>
                                {req.reason && (
                                    <div className="text-[10px] text-slate-500 italic border-l-2 border-slate-700 pl-2 mt-2">
                                        "{req.reason}"
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <Button
                                    onClick={() => handleApprove(req.id)}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 h-8 text-xs"
                                >
                                    Approve Request
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Recently Approved</h3>
                <div className="space-y-3">
                    {approvedRequests.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic">No approved leaves yet.</p>
                    ) : (
                        approvedRequests.map((app, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={app.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-80 text-[10px] text-white">
                                        {app.doctor.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">{app.doctor}</p>
                                    <p className="text-[10px] text-slate-500">{app.dates}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
