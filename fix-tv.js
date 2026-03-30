const fs = require('fs');

const file = 'public/tv.html';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings to help matching
content = content.replace(/\r\n/g, '\n');

let changes = 0;

function replaceSafe(regex, replacement, name) {
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    console.log('[OK] ' + name);
    changes++;
  } else {
    console.error('[FAIL] ' + name);
  }
}

// 1. CSS
replaceSafe(
  /(\/\* Status Styles \*\/)[\s\S]*?(\/\* ===== ACTIVE CALL HIGHLIGHT \(NEW\) ===== \*\/)/,
  `/* Status Styles - Synced with AI Automation */
      .st-praktek { --status-color: #30d158; --status-bg: rgba(48, 209, 88, 0.2); }
      .st-pendaftaran { --status-color: #ffcc00; --status-bg: rgba(255, 204, 0, 0.2); }
      .st-terjadwal { --status-color: #64d2ff; --status-bg: rgba(100, 210, 255, 0.2); opacity: 0.8; }
      .st-selesai { --status-color: #0a84ff; --status-bg: rgba(10, 132, 255, 0.2); opacity: 0.6; }
      .st-penuh { --status-color: #ff9f0a; --status-bg: rgba(255, 159, 10, 0.2); }
      .st-operasi { --status-color: #bf5af2; --status-bg: rgba(191, 90, 242, 0.2); }
      .st-cuti { --status-color: #ff453a; --status-bg: rgba(255, 69, 58, 0.2); opacity: 0.65; }
      .st-libur { --status-color: #8e8e93; --status-bg: rgba(142, 142, 147, 0.2); display: none; }

      .st-praktek .initials { background: rgba(48, 209, 88, 0.15); color: #30d158; }
      .st-pendaftaran .initials { background: rgba(255, 204, 0, 0.15); color: #ffcc00; }
      .st-terjadwal .initials { background: rgba(100, 210, 255, 0.15); color: #64d2ff; }
      .st-selesai .initials { background: rgba(10, 132, 255, 0.15); color: #0a84ff; }
      .st-penuh .initials { background: rgba(255, 159, 10, 0.15); color: #ff9f0a; }
      .st-cuti .initials { background: rgba(255, 69, 58, 0.12); color: #ff453a; }
      .st-operasi .initials { background: rgba(191, 90, 242, 0.15); color: #bf5af2; }

      .platter.st-praktek, .platter.st-pendaftaran { z-index: 5; }
      .platter.st-praktek { background: rgba(48, 209, 88, 0.1); border-color: rgba(48, 209, 88, 0.35); }
      .platter.st-pendaftaran { background: rgba(255, 204, 0, 0.1); border-color: rgba(255, 204, 0, 0.35); animation: pendaftaran-pulse 2s infinite; }
      @keyframes pendaftaran-pulse { 0% { border-color: rgba(255,204,0,0.2) } 50% { border-color: rgba(255,204,0,0.6) } 100% { border-color: rgba(255,204,0,0.2) } }
      
      [data-theme="light"] .platter.st-praktek { background: rgba(48, 209, 88, 0.06); border-color: rgba(48, 209, 88, 0.2); }
      [data-theme="light"] .platter.st-pendaftaran { background: rgba(255, 204, 0, 0.06); }
      
      .platter.st-praktek .jam-val, .platter.st-pendaftaran .jam-val { color: var(--status-color); font-size: 14px; }
      
      $2`,
  "CSS mapping block"
);

// 2. processData Logic
replaceSafe(
  /let status = \(doc\.status \|\| ""\)\.toUpperCase\(\);\s+if \(status\.includes\("BUKA"\) && timeState === "past"\) \{\s+status = "SELESAI";\s+\}/,
  `let status = (doc.status || "").toUpperCase();`,
  "processData logic remove past to SELESAI"
);

// 3. _detectChanges active condition
replaceSafe(
  /const isNowActive =\s+checkTime\(d\.Jam\) && \(st\.includes\("BUKA"\) \|\| st\.includes\("PENUH"\)\);/,
  `// Active logic: Driven by server statuses
            const isNowActive = st === "PRAKTEK" || st === "PENDAFTARAN" || st === "PENUH";`,
  "_detectChanges isNowActive"
);

// 3b. _detectChanges notifications replacement
replaceSafe(
  /\/\/ 1\. Time-based Start[\s\S]*?\/\/ 3\. Status Override Handlers \(Manual triggers\)[\s\S]*?\} else if \(st === "OPERASI"\) \{[\s\S]*?\}\s+\}\s+\}/,
  `// Status Driven Notifs over AI Sync
              if (st === "PENDAFTARAN") {
                Island.show("Loket Buka", \`Pendaftaran poli \${name} dimulai\`, "info", "assignment", 8000);
              } else if (st === "PRAKTEK") {
                Island.show("Praktek Dimulai", \`\${name} Mulai Melayani Pasien\`, "success", "door_front", 8000);
              } else if (st === "PENUH") {
                 Island.show("Kuota Penuh", \`Poli \${name} penuh\`, "warn", "front_hand", 10000);
              } else if (st === "SELESAI") {
                 Island.show("Selesai", \`Pelayanan \${name} selesai\`, "info", "check_circle", 8000);
              } else if (st === "OPERASI") {
                 Island.show("Operasi", \`\${name} dlm operasi\`, "warn", "local_hospital", 10000);
              }
            }`,
  "_detectChanges notification logic"
);

// 4. makeCard classes mapped directly string replace
replaceSafe(
  /let c = "st-nopoli",\s+i = "block",\s+l = d\.Status;\s+if \(st\.includes\("BUKA"\)\) \{[\s\S]*?\}\s+const avatarText/g,
  `let c = "st-nopoli", i = "block", l = d.Status;
            if (st === "PRAKTEK") { c = "st-praktek"; i = "check_circle"; l = "PRAKTEK"; }
            else if (st === "PENDAFTARAN") { c = "st-pendaftaran"; i = "assignment"; l = "PENDAFTARAN"; }
            else if (st === "TERJADWAL") { c = "st-terjadwal"; i = "schedule"; l = "TERJADWAL"; }
            else if (st === "SELESAI") { c = "st-selesai"; i = "done_all"; l = "SELESAI"; }
            else if (st === "PENUH") { c = "st-penuh"; i = "groups"; l = "PENUH"; }
            else if (st === "OPERASI") { c = "st-operasi"; i = "local_hospital"; l = "OPERASI"; }
            else if (st === "CUTI") { c = "st-cuti"; i = "flight"; l = "CUTI"; }
            else if (st === "LIBUR") { c = "st-libur"; i = "block"; l = "LIBUR"; }
            const avatarText`,
  "makeCard logic classes"
);

// 5. Update render count loops
const countReg = /if \(s\.includes\("BUKA"\)\) countBuka\+\+;\s+else if \(s\.includes\("PENUH"\)\) countPenuh\+\+;/;
replaceSafe(
  countReg,
  `if (["PRAKTEK", "PENDAFTARAN", "TERJADWAL"].includes(s)) countBuka++;
              else if (s === "PENUH") countPenuh++;`,
  "count rendering updates"
);

console.log('Total specific changes applied:', changes);
if (changes > 0) fs.writeFileSync(file, content);
