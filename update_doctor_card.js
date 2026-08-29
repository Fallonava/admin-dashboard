const fs = require('fs');
const path = '/home/fallonava/simed/src/app/jadwal/components/DoctorCard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace standard accordion drawer with Bottom Sheet
code = code.replace(
  /\{\/\* Expandable Accordion Drawer for Extra Context \(Apple Inset Metric List\) \*\/\}\s*\{isExpanded && \(\s*<div className="platter-expanded-drawer">/g,
  `{/* iOS 27 Bottom Sheet Modal */}
      {isExpanded && (
        <div className="ios-sheet-backdrop" onClick={(e) => { e.stopPropagation(); toggleExpand(); }}>
          <div className="ios-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ios-sheet-drag-handle" />
            <h3 className="doc-name mb-12 text-center" style={{ fontSize: '16px' }}>{doctor.name}</h3>
            <div className="drawer-metric-list">`
);

// We need to close the drawer correctly. The original ends with </div> </div> )}
// We replace the ending of the drawer
code = code.replace(
  /<div className="drawer-quick-actions">/g,
  `<div className="drawer-quick-actions" style={{ marginTop: '20px' }}>`
);

// Add context menu state and touch handlers
code = code.replace(
  /const \[copiedCode, setCopiedCode\] = useState\(false\);/,
  `const [copiedCode, setCopiedCode] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      triggerHaptic('success');
      setShowContextMenu(true);
    }, 500);
    setPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };`
);

// Inject touch events into the main platter
code = code.replace(
  /tabIndex=\{0\}\s*aria-expanded=\{isExpanded\}/,
  `tabIndex={0}
      aria-expanded={isExpanded}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onContextMenu={(e) => {
        // Prevent default context menu on long press
        e.preventDefault();
        triggerHaptic('success');
        setShowContextMenu(true);
      }}`
);

// Inject the Context Menu Modal at the very end of the component
const contextMenuJSX = `
      {/* iOS 27 Haptic Touch Context Menu */}
      {showContextMenu && (
        <div className="ios-context-backdrop" onClick={(e) => { e.stopPropagation(); setShowContextMenu(false); }}>
          <div className="ios-context-card-clone">
            {/* Clone minimal visual of the card */}
            <div className="card-main-content">
              <div className="card-avatar-col">
                <div className="avatar-squircle">
                  {doctor.image ? (
                    <img src={doctor.image} alt={doctor.name} className="avatar-img" />
                  ) : (
                    <SpecialistIcon department={doctor.specialty} size={24} className="avatar-spec-icon" />
                  )}
                </div>
              </div>
              <div className="card-info-col">
                <h3 className="doc-name">{doctor.name}</h3>
                <span className="doc-spec-badge text-blue">{doctor.specialty}</span>
              </div>
            </div>
          </div>
          <div className="ios-context-menu" onClick={(e) => e.stopPropagation()}>
            <button className="ios-context-menu-item" onClick={(e) => { setShowContextMenu(false); handleFavorite(e); }}>
              <span>{isFavorite ? 'Hapus dari Favorit' : 'Jadikan Favorit'}</span>
              <Star size={16} className={isFavorite ? 'fill-star text-yellow' : ''} />
            </button>
            <button className="ios-context-menu-item" onClick={(e) => { setShowContextMenu(false); handleAddToCalendar(e); }}>
              <span>Tambah ke Kalender</span>
              <Calendar size={16} />
            </button>
            <button className="ios-context-menu-item" onClick={(e) => { setShowContextMenu(false); handleShare(e); }}>
              <span>Bagikan Dokter</span>
              <Share2 size={16} />
            </button>
          </div>
        </div>
      )}
`;

code = code.replace(
  /    <\/div>\s*\);\s*\}\s*$/g,
  `    ${contextMenuJSX}
    </div>
  );
}
`
);

fs.writeFileSync(path, code);
