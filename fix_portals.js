const fs = require('fs');

function fixFile(path) {
  let code = fs.readFileSync(path, 'utf8');
  
  // Ensure react-dom is imported
  if (!code.includes('createPortal')) {
    code = code.replace(/import \{([^}]+)\} from 'react';/, "import { $1 } from 'react';\nimport { createPortal } from 'react-dom';");
    if (!code.includes('createPortal')) {
        // if no import { ... } from 'react', just add it
        code = "import { createPortal } from 'react-dom';\n" + code;
    }
  }

  // Find the modals and wrap them in createPortal(..., document.body)
  // For DoctorCard.tsx
  code = code.replace(
    /(\{\/\* iOS 27 Bottom Sheet Modal \*\/\}\s*\{isExpanded && \(\s*)(<div className="ios-sheet-backdrop"[\s\S]*?<\/div>\s*<\/div>\s*)(\}\s*\))/g,
    `$1typeof document !== 'undefined' ? createPortal(
        $2,
        document.body
      ) : null$3`
  );

  code = code.replace(
    /(\{\/\* iOS 27 Haptic Touch Context Menu \*\/\}\s*\{showContextMenu && \(\s*)(<div className="ios-context-backdrop"[\s\S]*?<\/div>\s*<\/div>\s*)(\}\s*\))/g,
    `$1typeof document !== 'undefined' ? createPortal(
        $2,
        document.body
      ) : null$3`
  );

  fs.writeFileSync(path, code);
}

fixFile('/home/fallonava/simed/src/app/jadwal/components/DoctorCard.tsx');
fixFile('/home/fallonava/simed/src/app/jadwal/components/WeeklyView.tsx');
