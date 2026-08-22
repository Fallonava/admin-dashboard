import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CalendarDays } from "lucide-react";
import useSWR from "swr";
import type { Doctor } from "@/lib/data-service";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { cn } from "@/lib/utils";
import { formatDateKey } from "@/lib/holidays";

const TIPE_CUTI = [
  { value: "Sakit", label: "🤒 Sakit" },
  { value: "Liburan", label: "🏖 Liburan" },
  { value: "Pribadi", label: "👤 Pribadi" },
  { value: "Konferensi", label: "🎤 Seminar" },
  { value: "Lainnya", label: "📋 Lainnya" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function LeaveRequestModal({ isOpen, onClose, onSubmit }: Props) {
  const { data: doctors = [] } = useSWR<Doctor[]>('/api/doctors');
  const [form, setForm] = useState({
    doctor: "",
    doctorId: "",
    type: "Sakit",
    startDate: "",
    endDate: "",
    reason: "",
    replacementDoctor: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const isValid = form.doctor && form.startDate && form.endDate;
  const isEndBeforeStart = form.endDate && form.startDate && new Date(form.endDate) < new Date(form.startDate);

  // Preset date duration helpers
  const applyPreset = (type: "today" | "tomorrow" | "3days" | "1week") => {
    const start = new Date();
    const end = new Date();

    if (type === "today") {
      // 1 day today
    } else if (type === "tomorrow") {
      start.setDate(start.getDate() + 1);
      end.setDate(end.getDate() + 1);
    } else if (type === "3days") {
      end.setDate(end.getDate() + 2);
    } else if (type === "1week") {
      end.setDate(end.getDate() + 6);
    }

    setForm({
      ...form,
      startDate: formatDateKey(start),
      endDate: formatDateKey(end),
    });
  };

  const handleSubmit = async () => {
    if (!isValid || isEndBeforeStart) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        doctor: form.doctor,
        doctorId: form.doctorId,
        type: form.type,
        dates: `${form.startDate} - ${form.endDate}`,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        replacementDoctor: form.replacementDoctor || null,
        avatar: "/avatars/default.png",
      });
      setForm({ doctor: "", doctorId: "", type: "Sakit", startDate: "", endDate: "", reason: "", replacementDoctor: "" });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="clay-surface rounded-[32px] p-6 sm:p-7 w-full max-w-sm animate-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col shadow-2xl border border-zinc-200/50 dark:border-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200/50 dark:border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] clay-icon-emerald flex items-center justify-center text-white shrink-0 shadow-sm">
              <CalendarDays className="h-5 w-5 relative z-10" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Tambah Cuti Dokter
              </h3>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">
                Catat Jadwal Tidak Hadir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full clay-button text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all active:scale-90"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-3 relative z-10">
          {/* Dokter Select with Avatar */}
          <SearchableSelect
            label="Nama Dokter"
            placeholder="Pilih Dokter..."
            searchPlaceholder="Cari nama atau poli..."
            noResultsText="Dokter tidak ditemukan"
            options={doctors.map((d) => ({
              value: d.id,
              label: d.name,
              sublabel: d.specialty,
              image: d.image,
            }))}
            value={form.doctorId}
            onChange={(docId: string) => {
              const doc = doctors.find((d) => d.id === docId);
              if (doc) {
                setForm({ ...form, doctorId: doc.id, doctor: doc.name });
              }
            }}
          />

          {/* Dokter Pengganti (Relief Doctor) */}
          <SearchableSelect
            label="Dokter Pengganti (Opsional)"
            placeholder="Pilih Dokter Pengganti (jika ada)..."
            searchPlaceholder="Cari dokter pengganti..."
            noResultsText="Tidak ada dokter"
            options={[
              { value: "", label: "— Tanpa Dokter Pengganti —", sublabel: "Jadwal kosong / diliburkan" },
              ...doctors
                .filter((d) => d.id !== form.doctorId)
                .map((d) => ({
                  value: d.name,
                  label: d.name,
                  sublabel: d.specialty,
                  image: d.image,
                })),
            ]}
            value={form.replacementDoctor}
            onChange={(repName: string) => {
              setForm({ ...form, replacementDoctor: repName });
            }}
          />

          {/* Tipe Cuti */}
          <div>
            <label className="text-[10.5px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
              Jenis Cuti
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TIPE_CUTI.map((t, i) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={cn(
                    "px-3 py-2 rounded-[14px] text-xs font-black text-left transition-all active:scale-95",
                    i === TIPE_CUTI.length - 1 && TIPE_CUTI.length % 2 !== 0 ? "col-span-2 text-center" : "",
                    form.type === t.value
                      ? "clay-pill-emerald text-white shadow-sm"
                      : "clay-button text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10.5px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Periode Cuti
              </label>
              <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400">Pilihan Cepat:</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-2">
              <button
                type="button"
                onClick={() => applyPreset("today")}
                className="py-1 px-1.5 rounded-[10px] clay-button text-[9.5px] font-black text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 active:scale-95"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => applyPreset("tomorrow")}
                className="py-1 px-1.5 rounded-[10px] clay-button text-[9.5px] font-black text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 active:scale-95"
              >
                Besok
              </button>
              <button
                type="button"
                onClick={() => applyPreset("3days")}
                className="py-1 px-1.5 rounded-[10px] clay-button text-[9.5px] font-black text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 active:scale-95"
              >
                3 Hari
              </button>
              <button
                type="button"
                onClick={() => applyPreset("1week")}
                className="py-1 px-1.5 rounded-[10px] clay-button text-[9.5px] font-black text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 active:scale-95"
              >
                1 Minggu
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9.5px] font-black text-zinc-400 uppercase block mb-0.5">Tanggal Mulai</span>
                <input
                  type="date"
                  className="w-full clay-inset rounded-[14px] px-2.5 py-2 text-xs font-black text-zinc-800 dark:text-zinc-100 outline-none"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <span className="text-[9.5px] font-black text-zinc-400 uppercase block mb-0.5">Tanggal Selesai</span>
                <input
                  type="date"
                  className={cn(
                    "w-full clay-inset rounded-[14px] px-2.5 py-2 text-xs font-black text-zinc-800 dark:text-zinc-100 outline-none",
                    isEndBeforeStart && "ring-2 ring-rose-500"
                  )}
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            {isEndBeforeStart && (
              <p className="text-[10px] text-rose-500 font-black mt-1">Tanggal selesai tidak boleh sebelum mulai</p>
            )}
          </div>

          {/* Keterangan */}
          <div>
            <label className="text-[10.5px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
              Keterangan Alasan <span className="normal-case text-zinc-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="cth. Seminar Nasional, Istirahat..."
              className="w-full clay-inset rounded-[16px] px-3.5 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isValid || !!isEndBeforeStart || isSubmitting}
            className="w-full h-11 mt-1 clay-pill-emerald text-white rounded-[18px] font-black text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center shadow-md"
          >
            <span>{isSubmitting ? "Menyimpan..." : "Simpan Jadwal Cuti"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

