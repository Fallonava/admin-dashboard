const fs = require('fs');
const path = '/home/fallonava/simed/src/app/jadwal/components/WeeklyView.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('X, ')) {
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { X, $1 } from 'lucide-react';");
}

code = code.replace(
  /<h3 className="doc-name mb-12 text-center" style=\{\{ fontSize: '16px' \}\}>\{doc\.name\}<\/h3>/,
  `<div className="ios-sheet-header">
                      <h3 className="ios-sheet-title">{doc.name}</h3>
                      <button className="ios-close-btn" onClick={(e) => { e.stopPropagation(); toggleExpand(doc.id); }}>
                        <X size={18} />
                      </button>
                    </div>`
);

const oldActionsRegex = /<div className="drawer-quick-actions">[\s\S]*?<\/div>\s*<\/div>, document\.body\)\s*:\s*null\}/;
const newActions = `<div className="drawer-quick-actions">
                      <a
                        href={\`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20bertanya%20jadwal%20\${encodeURIComponent(
                          doc.name
                        )}%20pada%20hari%20\${activeDateItem?.dayName}\`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ios-large-action-btn btn-whatsapp-ios"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                        }}
                      >
                        <MessageCircle size={18} />
                        <span>Tanya CS WhatsApp</span>
                      </a>
                    </div>
                  </div>, document.body) : null}`;

code = code.replace(oldActionsRegex, newActions);

fs.writeFileSync(path, code);
