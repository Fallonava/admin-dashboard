// ─── PDF PRINT ENGINE ─────────────────────────────────────────────────────────
// Generates a modern, aesthetic A4-landscape PDF template for staff schedules.
// Uses browser window.print() — no external dependencies needed.

import { eachDayOfInterval, startOfMonth, endOfMonth, format, getDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface ShiftDef {
  id: string; label: string; timeSenin: string; timeSabtu: string; hours: number;
}
interface StaffConfig {
  id: string; staffName: string; cycle: string[]; isSpecial: boolean; sortOrder: number;
}

const SHIFT_PRINT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  P6:  { bg: '#fdf4ff', text: '#a21caf', border: '#e879f9' },
  P7:  { bg: '#f0f9ff', text: '#0369a1', border: '#38bdf8' },
  P8:  { bg: '#eef2ff', text: '#3730a3', border: '#818cf8' },
  P9:  { bg: '#f0fdf4', text: '#15803d', border: '#4ade80' },
  P10: { bg: '#f0fdfa', text: '#0f766e', border: '#2dd4bf' },
  P12: { bg: '#fffbeb', text: '#b45309', border: '#fbbf24' },
  CT:  { bg: '#fff7ed', text: '#c2410c', border: '#fb923c' },
  L:   { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' },
};

function getShiftBadgeStyle(shiftId: string): string {
  const c = SHIFT_PRINT_COLORS[shiftId] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  return `background:${c.bg};color:${c.text};border:1.5px solid ${c.border};`;
}

function getDayBgStyle(shiftId: string | undefined, isSun: boolean): string {
  if (isSun) return 'background:#fff1f2;';
  if (!shiftId) return 'background:#fafafa;';
  const c = SHIFT_PRINT_COLORS[shiftId];
  if (!c) return '';
  return `background:${c.bg}22;`;
}

export function generateSchedulePDF(
  currentMonth: Date,
  staffList: StaffConfig[],
  overrides: Record<string, Record<string, string>>,
  shifts: Record<string, ShiftDef>,
  getEffectiveShift: (staff: StaffConfig, dateStr: string, day: Date) => string | undefined,
  staffSummaries: Record<string, { hours: number; libur: number; cuti: number }>,
) {
  const days: Date[] = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: idLocale });
  const printedAt = new Date().toLocaleString('id-ID', { 
    dateStyle: 'long', timeStyle: 'short' 
  });

  // ── Build day header cells ──
  const dayHeaders = days.map((day: Date) => {
    const isSun = getDay(day) === 0;
    const dayName = format(day, 'E', { locale: idLocale }).slice(0, 2);
    const dayNum = format(day, 'd');
    return `
      <th class="col-day" style="
        padding:3px 1px;text-align:center;
        border:1px solid #e2e8f0;font-size:7px;font-weight:700;
        background:${isSun ? '#fff1f2' : '#f8fafc'};
        color:${isSun ? '#f43f5e' : '#64748b'};vertical-align:bottom;
      ">
        <div style="line-height:1;font-size:6.5px">${dayName}</div>
        <div style="font-size:9px;font-weight:900;color:${isSun ? '#e11d48' : '#1e293b'};margin-top:1px">${dayNum}</div>
      </th>`;
  }).join('');

  // ── Build staff rows ──
  const staffRows = staffList.map((staff, rowIdx) => {
    const stats = staffSummaries[staff.id] ?? { hours: 0, libur: 0, cuti: 0 };
    const rowBg = rowIdx % 2 === 0 ? '#ffffff' : '#fafbff';

    const dayCells = days.map((day: Date) => {
      const isSun = getDay(day) === 0;
      const dateStr = format(day, 'yyyy-MM-dd');
      const shiftId = isSun ? undefined : getEffectiveShift(staff, dateStr, day);
      const hasOverride = !isSun && !!overrides[staff.id]?.[dateStr] && overrides[staff.id]?.[dateStr] !== 'CLEAR';

      if (isSun) {
        return `<td style="background:#fff1f2;border:1px solid #fecdd3;text-align:center;padding:1px;">
          <div style="width:6px;height:6px;border-radius:50%;background:#fecdd3;margin:auto;"></div>
        </td>`;
      }

      if (!shiftId) {
        return `<td style="background:#f8fafc;border:1px solid #e2e8f0;"></td>`;
      }

      return `<td style="${getDayBgStyle(shiftId, false)}border:1px solid #e2e8f0;text-align:center;padding:1px;position:relative;">
        <span style="
          display:inline-flex;align-items:center;justify-content:center;
          ${getShiftBadgeStyle(shiftId)}
          font-size:7px;font-weight:800;
          border-radius:4px;
          padding:1px 2px;
          width:22px;
          position:relative;
          white-space:nowrap;
        ">${shiftId}${hasOverride ? '<span style="position:absolute;top:-2px;right:-2px;width:4px;height:4px;background:#f97316;border-radius:50%;border:1px solid white;"></span>' : ''}</span>
      </td>`;
    }).join('');

    return `
      <tr style="background:${rowBg};">
        <td style="
          background:${rowBg};
          padding:4px 8px;border:1px solid #e2e8f0;
          font-size:9px;font-weight:700;color:#1e293b;
          white-space:nowrap;width:140px;
          border-left:3px solid #6366f1;
        ">
          <div style="display:flex;align-items:center;gap:5px;">
            <div style="
              width:20px;height:20px;border-radius:6px;
              background:linear-gradient(135deg,#6366f1,#8b5cf6);
              color:white;font-size:7px;font-weight:900;
              display:flex;align-items:center;justify-content:center;flex-shrink:0;
            ">${staff.staffName.substring(0, 2).toUpperCase()}</div>
            <span style="overflow:hidden;text-overflow:ellipsis;max-width:105px;">${staff.staffName}</span>
          </div>
        </td>
        ${dayCells}
        <td style="
          text-align:center;padding:3px 4px;border:1px solid #e2e8f0;
          background:#f0f4ff;font-size:8px;font-weight:800;color:#4f46e5;
          white-space:nowrap;width:38px;
        ">${stats.hours > 0 ? `${stats.hours}j` : '—'}</td>
        <td style="text-align:center;padding:3px 4px;border:1px solid #e2e8f0;background:#fff7ed;font-size:8px;font-weight:700;color:#ea580c;width:38px;">
          ${stats.cuti > 0 ? stats.cuti : '—'}
        </td>
        <td style="text-align:center;padding:3px 4px;border:1px solid #e2e8f0;background:#f8fafc;font-size:8px;font-weight:700;color:#64748b;width:38px;">
          ${stats.libur > 0 ? stats.libur : '—'}
        </td>
      </tr>`;
  }).join('');

  // ── Legend ──
  const legendItems = ['P6','P7','P8','P9','P10','P12','CT','L'].map(sid => {
    const s = shifts[sid];
    const c = SHIFT_PRINT_COLORS[sid];
    return `<div style="display:flex;align-items:center;gap:5px;">
      <span style="${getShiftBadgeStyle(sid)}font-size:9px;font-weight:800;border-radius:5px;padding:2px 6px;">${sid}</span>
      <span style="font-size:8.5px;color:#64748b;">${s.timeSenin}</span>
    </div>`;
  }).join('');

  // ── Full HTML ──
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Jadwal Petugas TPPRJ — ${monthLabel}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Inter',system-ui,sans-serif;background:#f8fafc;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    @page{size:A4 landscape;margin:10mm 8mm;}
    @media print{
      body{background:white;}
      .no-print{display:none!important;}
      .page{box-shadow:none;margin:0;}
    }
    .page{max-width:1120px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;}

    /* ── HEADER ── */
    .header{
      background:linear-gradient(135deg,#1e1b4b 0%,#312e81 30%,#4338ca 60%,#6d28d9 100%);
      padding:20px 28px;display:flex;justify-content:space-between;align-items:center;
      position:relative;overflow:hidden;
    }
    .header::before{
      content:'';position:absolute;top:-40px;right:-40px;width:200px;height:200px;
      border-radius:50%;background:rgba(255,255,255,.05);
    }
    .header::after{
      content:'';position:absolute;bottom:-60px;right:80px;width:140px;height:140px;
      border-radius:50%;background:rgba(255,255,255,.04);
    }
    .header-left{position:relative;z-index:1;}
    .header h1{font-size:22px;font-weight:900;color:white;letter-spacing:-.5px;line-height:1.1;}
    .header h1 span{color:#a5b4fc;}
    .header p{font-size:11px;color:#c7d2fe;font-weight:600;margin-top:4px;letter-spacing:.5px;text-transform:uppercase;}
    .header-right{position:relative;z-index:1;text-align:right;}
    .month-badge{
      display:inline-block;
      background:rgba(255,255,255,.15);backdrop-filter:blur(8px);
      border:1px solid rgba(255,255,255,.2);
      color:white;font-size:18px;font-weight:900;
      padding:8px 18px;border-radius:12px;letter-spacing:-.3px;
    }
    .printed-at{font-size:9px;color:#a5b4fc;margin-top:6px;font-weight:600;}

    /* ── SUMMARY STRIP ── */
    .summary-strip{
      display:flex;gap:0;background:#f1f5f9;border-bottom:1px solid #e2e8f0;
    }
    .stat-box{
      flex:1;padding:10px 16px;border-right:1px solid #e2e8f0;
    }
    .stat-box:last-child{border-right:none;}
    .stat-label{font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;}
    .stat-value{font-size:20px;font-weight:900;color:#1e293b;line-height:1.2;}
    .stat-sub{font-size:8px;color:#94a3b8;font-weight:600;}

    /* ── TABLE ── */
    .table-wrap{padding:10px 12px;overflow:hidden;}
    table{width:100%;border-collapse:collapse;font-size:8px;table-layout:fixed;}
    thead th{position:relative;top:auto;}
    .col-name{width:140px;font-size:10px;font-weight:800;color:#4f46e5;padding:5px 8px;background:#f8f9ff;border:1px solid #e2e8f0;text-align:left;}
    .col-day{width:26px;}
    .col-stat{width:38px;}

    /* ── LEGEND ── */
    .legend{
      display:flex;flex-wrap:wrap;gap:8px;align-items:center;
      padding:12px 16px;border-top:1px solid #e2e8f0;background:#f8fafc;
    }
    .legend-title{font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-right:4px;}
    .legend-dot{width:5px;height:5px;border-radius:50%;background:#f97316;display:inline-block;margin-right:2px;}

    /* ── FOOTER ── */
    .footer{
      background:linear-gradient(90deg,#1e1b4b,#312e81);
      padding:8px 16px;display:flex;justify-content:space-between;align-items:center;
    }
    .footer span{font-size:8px;color:#a5b4fc;font-weight:600;}
    .footer-logo{font-size:9px;font-weight:900;color:white;}
    .footer-logo span{color:#a5b4fc;}

    /* ── PRINT BUTTON ── */
    .print-btn{
      display:flex;align-items:center;gap:8px;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      color:white;border:none;padding:10px 20px;
      border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;
      font-family:inherit;box-shadow:0 4px 20px rgba(79,70,229,.4);
      transition:all .2s;margin:16px auto;display:block;
    }
    .print-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(79,70,229,.5);}
    .override-note{font-size:8.5px;color:#94a3b8;display:flex;align-items:center;gap:4px;}
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">
    🖨️ Cetak / Simpan sebagai PDF
  </button>

  <div class="page">
    <!-- HEADER -->
    <div class="header">
      <div class="header-left">
        <h1>Jadwal Petugas <span>TPPRJ</span></h1>
        <p>Rekam Medis &amp; Pendaftaran — Sistem MedCore<sup style="font-size:7px">26</sup></p>
      </div>
      <div class="header-right">
        <div class="month-badge">${monthLabel}</div>
        <div class="printed-at">Dicetak: ${printedAt}</div>
      </div>
    </div>

    <!-- SUMMARY STRIP -->
    <div class="summary-strip">
      <div class="stat-box">
        <div class="stat-label">Total Petugas</div>
        <div class="stat-value">${staffList.length}</div>
        <div class="stat-sub">Staf Terdaftar</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Total Hari Kerja</div>
        <div class="stat-value">${days.filter((d: Date) => getDay(d) !== 0).length}</div>
        <div class="stat-sub">Bulan Ini</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Total Override</div>
        <div class="stat-value">${Object.values(overrides).reduce((n, v) => n + Object.keys(v).length, 0)}</div>
        <div class="stat-sub">Perubahan Manual</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Rentang Shift</div>
        <div class="stat-value" style="font-size:14px;">06–20</div>
        <div class="stat-sub">06.00 – 20.00 WIB</div>
      </div>
    </div>

    <!-- MAIN TABLE -->
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="col-name" style="min-width:160px;">Petugas</th>
            ${dayHeaders}
            <th style="min-width:56px;padding:6px;text-align:center;border:1px solid #e2e8f0;background:#eef2ff;color:#4f46e5;font-size:9px;font-weight:800;">JAM</th>
            <th style="min-width:40px;padding:6px;text-align:center;border:1px solid #e2e8f0;background:#fff7ed;color:#ea580c;font-size:9px;font-weight:800;">CT</th>
            <th style="min-width:40px;padding:6px;text-align:center;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:9px;font-weight:800;">L</th>
          </tr>
        </thead>
        <tbody>${staffRows}</tbody>
      </table>
    </div>

    <!-- LEGEND -->
    <div class="legend">
      <span class="legend-title">Kamus Shift</span>
      ${legendItems}
      <div style="margin-left:auto;" class="override-note">
        <span class="legend-dot"></span> Titik oranye = override manual
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <span>© ${new Date().getFullYear()} MedCore Admin — Dokumen internal, jangan disebarluaskan</span>
      <div class="footer-logo">MedCore<span>26</span></div>
      <span>Jadwal bersifat deterministik &amp; dapat berubah sesuai kebijakan</span>
    </div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1200,height=850');
  if (!win) {
    alert('Pop-up diblokir browser. Izinkan pop-up untuk halaman ini dan coba lagi.');
    return;
  }
  win.document.write(html);
  win.document.close();
  // Auto-focus so user can Ctrl+P immediately
  win.focus();
}
