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

// 2. Tie island message to isRefreshing
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

// 3. Update the Header JSX
code = code.replace(
  /      \{\/\* iOS 27 Glance Capsule Header \*\/\}\s*<header className="ios27-glance-capsule-bar">[\s\S]*?<\/header>/,
  `      {/* iOS 27 Dynamic Island & Navigation Header */}
      <header className={\`ios27-glance-capsule-bar \${scrollY > 50 ? 'is-scrolled' : ''}\`}>
        <div className={\`dynamic-island \${islandMessage ? 'is-expanded' : ''}\`} onClick={handleManualRefresh}>
          {islandMessage ? (
            <div className="island-message">
              <span className="brand-live-pulse-dot" style={{ background: 'var(--ios-green)' }} />
              <span className="island-text text-sm font-semibold">{islandMessage}</span>
            </div>
          ) : (
            <div className="island-compact">
              <ShieldPlus size={16} className="brand-icon-spin text-green" />
              <span className="brand-text">RSU Siaga Medika</span>
            </div>
          )}
        </div>
        
        {/* Inline Title (Appears on scroll) */}
        <h1 className="inline-header-title" style={{ opacity: scrollY > 60 ? 1 : 0, transform: \`translateY(\${scrollY > 60 ? 0 : '10px'})\` }}>
          Jadwal Dokter
        </h1>

        <div className="glance-actions">
          <button type="button" className="glance-btn" onClick={handleManualRefresh} aria-label="Refresh Data">
            <RefreshCw size={16} className={isRefreshing ? 'spin-anim' : ''} />
          </button>
          <button type="button" className="glance-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>`
);

// 4. Update the Main Content for Large Title and Pull-to-search
code = code.replace(
  /      \{\/\* Main Content View \*\/\}\s*<main className="main-content main-content-padded">/,
  `      {/* Main Content View */}
      <main className="main-content main-content-padded">
        {/* Large Title Area */}
        <div className="large-title-area" style={{ opacity: Math.max(0, 1 - scrollY / 50), transform: \`translateY(-\${scrollY * 0.5}px)\` }}>
          <h1 className="large-title">Jadwal Dokter</h1>
          <p className="subtitle">Temukan jadwal praktik spesialis hari ini</p>
        </div>

        {/* Hidden Search Bar (Reveals smoothly) */}
        <div className="search-bar-container" style={{ transform: scrollY > 20 ? 'scale(0.95)' : 'scale(1)', transition: 'transform 0.2s ease' }}>`
);

// Close the search bar container div after the input wrapper
code = code.replace(
  /          <\/div>\s*<\/div>\s*\{\/\* Sub-navigation /m,
  `          </div>
        </div>
        </div>
        
        {/* Sub-navigation `
);

fs.writeFileSync(path, code);
