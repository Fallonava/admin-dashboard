const fs = require('fs');
const path = '/home/fallonava/simed/src/app/jadwal/components/WeeklyView.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace standard accordion drawer with Bottom Sheet
code = code.replace(
  /\{\/\* Expandable Accordion Drawer for Extra Context \(Apple Inset Metric List\) \*\/\}\s*\{isExpanded && \(\s*<div className="platter-expanded-drawer">/g,
  `{/* iOS 27 Bottom Sheet Modal */}
                {isExpanded && (
                  <div className="ios-sheet-backdrop" onClick={(e) => { e.stopPropagation(); setExpandedDocId(null); }}>
                    <div className="ios-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                      <div className="ios-sheet-drag-handle" />
                      <h3 className="doc-name mb-12 text-center" style={{ fontSize: '16px' }}>{doc.name}</h3>
                      <div className="drawer-metric-list">`
);

code = fs.writeFileSync(path, code);
