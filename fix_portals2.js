const fs = require('fs');

function fixDoctorCard(path) {
  let code = fs.readFileSync(path, 'utf8');
  if (!code.includes('createPortal')) {
    code = code.replace(/import \{([^}]+)\} from 'react';/, "import { $1 } from 'react';\nimport { createPortal } from 'react-dom';");
  }

  code = code.replace(
    /\{\/\* iOS 27 Bottom Sheet Modal \*\/\}\s*\{isExpanded && \(\s*<div className="ios-sheet-backdrop" onClick=\{\(e\) => \{ e.stopPropagation\(\); toggleExpand\(\); \}\}>/,
    `{/* iOS 27 Bottom Sheet Modal */}
      {isExpanded && typeof document !== 'undefined' ? createPortal(
        <div className="ios-sheet-backdrop" onClick={(e) => { e.stopPropagation(); toggleExpand(); }}>`
  );

  code = code.replace(
    /          <\/div>\s*<\/div>\s*\)\}\s*\{\/\* iOS 27 Haptic Touch Context Menu \*\/\}/,
    `          </div>
        </div>, document.body
      ) : null}

      {/* iOS 27 Haptic Touch Context Menu */}`
  );

  code = code.replace(
    /\{\/\* iOS 27 Haptic Touch Context Menu \*\/\}\s*\{showContextMenu && \(\s*<div className="ios-context-backdrop" onClick=\{\(e\) => \{ e.stopPropagation\(\); setShowContextMenu\(false\); \}\}>/,
    `{/* iOS 27 Haptic Touch Context Menu */}
      {showContextMenu && typeof document !== 'undefined' ? createPortal(
        <div className="ios-context-backdrop" onClick={(e) => { e.stopPropagation(); setShowContextMenu(false); }}>`
  );

  code = code.replace(
    /          <\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\);\s*\}/,
    `          </div>
        </div>, document.body
      ) : null}
    </div>
  );
}`
  );

  fs.writeFileSync(path, code);
}

function fixWeeklyView(path) {
  let code = fs.readFileSync(path, 'utf8');
  if (!code.includes('createPortal')) {
    code = code.replace(/import \{([^}]+)\} from 'react';/, "import { $1 } from 'react';\nimport { createPortal } from 'react-dom';");
  }

  code = code.replace(
    /\{\/\* iOS 27 Bottom Sheet Modal \*\/\}\s*\{isExpanded && \(\s*<div className="ios-sheet-backdrop" onClick=\{\(e\) => \{ e.stopPropagation\(\); toggleExpand\(doc.id\); \}\}>/,
    `{/* iOS 27 Bottom Sheet Modal */}
                {isExpanded && typeof document !== 'undefined' ? createPortal(
                  <div className="ios-sheet-backdrop" onClick={(e) => { e.stopPropagation(); toggleExpand(doc.id); }}>`
  );

  code = code.replace(
    /                    <\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\);\s*\}\)\}\s*<\/div>\s*\)\}/,
    `                    </div>
                  </div>, document.body
                ) : null}
              </div>
            );
          })}
        </div>
      )}`
  );

  fs.writeFileSync(path, code);
}

fixDoctorCard('/home/fallonava/simed/src/app/jadwal/components/DoctorCard.tsx');
fixWeeklyView('/home/fallonava/simed/src/app/jadwal/components/WeeklyView.tsx');
