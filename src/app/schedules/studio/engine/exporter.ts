import { RenderOptions } from "./renderer";
import { DoctorScheduleItem, LeaveDoctorItem } from "../types";

export interface ShareDataPayload {
  selectedDate: Date;
  hospitalName: string;
  hotlinePhone: string;
  websiteUrl: string;
  specMap: Record<string, DoctorScheduleItem[]>;
  leaveDoctors: LeaveDoctorItem[];
}

export function downloadCanvasImage(
  canvas: HTMLCanvasElement,
  filename: string,
  format: "png" | "webp" | "jpeg" = "png",
  quality = 0.95
) {
  const mimeType = format === "webp" ? "image/webp" : format === "jpeg" ? "image/jpeg" : "image/png";
  const dataUrl = canvas.toDataURL(mimeType, quality);
  const link = document.createElement("a");
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return false;
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);
    return true;
  } catch (err) {
    console.error("Failed to copy image to clipboard:", err);
    return false;
  }
}

export async function shareDirectWhatsApp(
  canvas: HTMLCanvasElement,
  payload: ShareDataPayload
): Promise<boolean> {
  const { selectedDate, hospitalName, hotlinePhone, websiteUrl, specMap, leaveDoctors } = payload;
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dateFormatted = `${days[selectedDate.getDay()]}, ${selectedDate.getDate()} ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  // Formatted WhatsApp caption
  let caption = `🏥 *${hospitalName.toUpperCase()}*\n`;
  caption += `📅 *JADWAL RESMI POLIKLINIK* (${dateFormatted})\n\n`;

  Object.entries(specMap).forEach(([spec, docs]) => {
    caption += `🩺 *POLI ${spec.toUpperCase()}*\n`;
    docs.forEach((d) => {
      const statusIcon = d.status === "CUTI" ? "🔴 (Cuti)" : d.status === "PENUH" ? "🟠 (Penuh)" : "🟢";
      caption += `  • ${d.doctorName} ${statusIcon} - ${d.time}\n`;
    });
    caption += `\n`;
  });

  if (leaveDoctors.length > 0) {
    caption += `📢 *DOKTER CUTI HARI INI:*\n`;
    leaveDoctors.forEach((l) => {
      caption += `  • ${l.doctorName} (Poli ${l.specialty})${l.replacement ? ` ➔ Pengganti: ${l.replacement}` : ""}\n`;
    });
    caption += `\n`;
  }

  caption += `📞 *Hotline Registrasi:* ${hotlinePhone}\n`;
  caption += `🌐 *Portal Publik:* https://${websiteUrl}\n`;

  // 1. Try Native Web Share API with image file
  if (navigator.canShare && navigator.share) {
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) {
        const file = new File([blob], `jadwal-dokter-${selectedDate.toISOString().slice(0, 10)}.png`, {
          type: "image/png",
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Jadwal Dokter ${hospitalName}`,
            text: caption,
            files: [file],
          });
          return true;
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Native share failed, falling back to URL scheme:", err);
      }
    }
  }

  // 2. Fallback: Copy image to clipboard and open WhatsApp Web with pre-filled text
  await copyCanvasToClipboard(canvas);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(caption)}`;
  window.open(waUrl, "_blank");
  return true;
}

export function renderHighResExport(
  renderFn: (canvas: HTMLCanvasElement, data: any, options: RenderOptions) => void,
  data: any,
  options: RenderOptions,
  scaleMultiplier: 2 | 3 = 2,
  filename = "poster-jadwal-hd"
) {
  const offscreen = document.createElement("canvas");
  renderFn(offscreen, data, { ...options, scaleFactor: scaleMultiplier });
  downloadCanvasImage(offscreen, `${filename}-${scaleMultiplier === 3 ? "300dpi-print" : "retina-hd"}`, "png");
}
