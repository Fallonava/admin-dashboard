const fs = require('fs');
const path = '/home/fallonava/simed/src/app/jadwal/jadwal.css';
let code = fs.readFileSync(path, 'utf8');

// Update compact-status pill shape
code = code.replace(
  /\.status-pill\.compact-status\s*\{[^}]+\}/,
  `.status-pill.compact-status {
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 9999px;
  flex-shrink: 0;
  border: none;
}`
);

// Remove borders and increase tint slightly for all st-* classes
code = code.replace(
  /\.st-praktek\s*\{[^}]+\}/,
  `.st-praktek { background: rgba(52, 199, 89, 0.15); color: var(--ios-green); border: none; }`
);
code = code.replace(
  /\.st-terjadwal\s*\{[^}]+\}/,
  `.st-terjadwal { background: rgba(0, 122, 255, 0.15); color: var(--ios-blue); border: none; }`
);
code = code.replace(
  /\.st-cuti\s*\{[^}]+\}/,
  `.st-cuti { background: rgba(255, 59, 48, 0.15); color: var(--ios-red); border: none; }`
);
code = code.replace(
  /\.st-libur\s*\{[^}]+\}/,
  `.st-libur { background: rgba(255, 149, 0, 0.15); color: var(--ios-orange); border: none; }`
);
code = code.replace(
  /\.st-selesai\s*\{[^}]+\}/,
  `.st-selesai { background: rgba(142, 142, 147, 0.15); color: var(--ios-gray); border: none; }`
);
code = code.replace(
  /\.st-operasi\s*\{[^}]+\}/,
  `.st-operasi { background: rgba(175, 82, 222, 0.15); color: var(--ios-purple); border: none; }`
);
code = code.replace(
  /\.st-penuh\s*\{[^}]+\}/,
  `.st-penuh { background: rgba(255, 45, 85, 0.15); color: var(--ios-pink); border: none; }`
);

// We had a Dark Mode override for .st-cuti at the bottom of the file
code = code.replace(
  /\[data-theme="dark"\] \.st-cuti,[\s\S]*?body\.dark \.st-cuti\s*\{[^}]+\}/,
  `[data-theme="dark"] .st-cuti,
html.dark .st-cuti,
body.dark .st-cuti {
  background: rgba(255, 69, 58, 0.2);
  color: var(--ios-red);
  border: none;
}`
);

fs.writeFileSync(path, code);
