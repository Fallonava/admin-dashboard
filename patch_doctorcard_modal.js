const fs = require('fs');
const path = '/home/fallonava/simed/src/app/jadwal/components/DoctorCard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Needs X icon from lucide-react if not imported
if (!code.includes('X, ')) {
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { X, $1 } from 'lucide-react';");
}

// 1. Replace the sheet title area
code = code.replace(
  /<h3 className="doc-name mb-12 text-center" style=\{\{ fontSize: '16px' \}\}>\{doctor\.name\}<\/h3>/,
  `<div className="ios-sheet-header">
              <h3 className="ios-sheet-title">{doctor.name}</h3>
              <button className="ios-close-btn" onClick={(e) => { e.stopPropagation(); toggleExpand(); }}>
                <X size={18} />
              </button>
            </div>`
);

// 2. Replace the quick actions area
const oldActionsRegex = /<div className="drawer-quick-actions"[\s\S]*?<\/div>\s*<\/div>, document\.body/;
const newActions = `<div className="drawer-quick-actions">
            <a
              href={\`https://wa.me/6282323446076?text=Halo%20RSU%20Siaga%20Medika,%20saya%20ingin%20konsultasi%20jadwal%20\${encodeURIComponent(
                doctor.name
              )}%20(\${encodeURIComponent(doctor.specialty)})\`}
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

            <button
              type="button"
              className="ios-large-action-btn btn-primary-ios"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCalendar(e);
              }}
              title="Simpan Jadwal ke Kalender HP"
            >
              <Calendar size={18} />
              <span>Simpan ke Kalender</span>
            </button>

            <button
              type="button"
              className="ios-large-action-btn btn-secondary-ios"
              onClick={(e) => {
                e.stopPropagation();
                handleShare(e);
              }}
              title="Bagikan Informasi Dokter"
            >
              <Share2 size={18} />
              <span>Bagikan Dokter</span>
            </button>
          </div>
        </div>, document.body`;

code = code.replace(oldActionsRegex, newActions);

fs.writeFileSync(path, code);
