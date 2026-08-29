const fs = require('fs');
const path = '/home/fallonava/simed/src/app/jadwal/jadwal.css';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /\.skeleton-pulse\s*\{[^}]+\}/,
  `.skeleton-pulse {
  background: var(--surface-well);
  border-radius: var(--radius-card);
  animation: iosBreathe 2s infinite ease-in-out;
}`
);

code = code.replace(
  /\[data-theme="dark"\] \.skeleton-pulse,[\s\S]*?body\.dark \.skeleton-pulse\s*\{[^}]+\}/,
  `[data-theme="dark"] .skeleton-pulse,
html.dark .skeleton-pulse,
body.dark .skeleton-pulse {
  background: #2C2C2E;
}`
);

fs.writeFileSync(path, code);
