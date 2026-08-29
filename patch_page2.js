const fs = require('fs');
const path = '/home/fallonava/simed/src/app/jadwal/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add scroll and island states
code = code.replace(
  /const \[isRefreshing, setIsRefreshing\] = useState<boolean>\(false\);/,
  `const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState(0);
  const [islandMessage, setIslandMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);`
);

// 2. Update the refresh handler
code = code.replace(
  /const handleManualRefresh = async \(\) => \{[\s\S]*?await mutate\(\);[\s\S]*?setIsRefreshing\(false\);/m,
  `const handleManualRefresh = async () => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    setIslandMessage('Memperbarui Data...');
    await mutate();
    setIslandMessage('Pembaruan Selesai');
    setTimeout(() => setIslandMessage(null), 2500);
    setIsRefreshing(false);`
);

// 3. Header Replacement
const oldHeader = `      {/* iOS 27 Glance Capsule Header */}
      <header className="ios27-glance-capsule-bar">
        <div className="dynamic-island">
          <ShieldPlus size={16} className="brand-icon-spin text-green" />
          <span className="brand-text">RSU Siaga Medika</span>
        </div>

        <div className="glance-actions">
          <button type="button" className="glance-btn" onClick={handleManualRefresh} aria-label="Refresh Data">
            <RefreshCw size={16} className={isRefreshing ? 'spin-anim' : ''} />
          </button>
          <button type="button" className="glance-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>`;

const newHeader = `      {/* iOS 27 Dynamic Island & Navigation Header */}
      <header className={\`ios27-glance-capsule-bar \${scrollY > 50 ? 'is-scrolled' : ''}\`}>
        <div className={\`dynamic-island \${islandMessage ? 'is-expanded' : ''}\`} onClick={handleManualRefresh}>
          {islandMessage ? (
            <div className="island-message" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-live-pulse-dot" style={{ background: 'var(--ios-green)', margin: 0 }} />
              <span className="island-text text-sm font-semibold">{islandMessage}</span>
            </div>
          ) : (
            <div className="island-compact" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldPlus size={16} className="brand-icon-spin text-green" />
              <span className="brand-text font-bold">RSU Siaga Medika</span>
            </div>
          )}
        </div>
        
        {/* Inline Title (Appears on scroll) */}
        <h1 
          className="inline-header-title font-bold text-center" 
          style={{ 
            opacity: scrollY > 60 ? 1 : 0, 
            transform: \`translateY(\${scrollY > 60 ? 0 : '10px'})\`,
            position: 'absolute',
            left: 0,
            right: 0,
            pointerEvents: 'none',
            fontSize: '16px',
            transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
          }}
        >
          Jadwal Dokter
        </h1>

        <div className="glance-actions" style={{ zIndex: 10 }}>
          <button type="button" className="glance-btn" onClick={handleManualRefresh} aria-label="Refresh Data">
            <RefreshCw size={16} className={isRefreshing ? 'spin-anim' : ''} />
          </button>
          <button type="button" className="glance-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>`;

code = code.replace(oldHeader, newHeader);

// 4. Large Title
const oldMainContent = `      {/* Main Content View */}
      <main className="main-content main-content-padded">`;

const newMainContent = `      {/* Main Content View */}
      <main className="main-content main-content-padded">
        {/* Large Title Area */}
        <div className="large-title-area mb-20" style={{ 
          opacity: Math.max(0, 1 - scrollY / 50), 
          transform: \`translateY(-\${scrollY * 0.5}px)\`,
          padding: '0 20px',
          marginTop: '10px'
        }}>
          <h1 className="large-title font-bold" style={{ fontSize: '32px', letterSpacing: '-1px' }}>Jadwal Dokter</h1>
          <p className="subtitle text-mute mt-4" style={{ fontSize: '15px' }}>Temukan jadwal praktik spesialis hari ini</p>
        </div>`;

code = code.replace(oldMainContent, newMainContent);

// 5. Variable Blur implementation on header scroll
code = code.replace(
  /className="ios-app-container"/,
  `className="ios-app-container" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 60px)' }}`
);

fs.writeFileSync(path, code);
