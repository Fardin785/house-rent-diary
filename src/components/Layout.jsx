import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Users, FileText, Menu, X, Download, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouterState();
  const currentPath = router.location.pathname;

  // close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPath]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div id="app">
      {/* Sidebar */}
      <aside id="sidebar" className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="brand-text">{t('brand')}</span>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${currentPath === '/' ? 'active' : ''}`}>
            <Home size={20} />
            <span>{t('nav.dashboard')}</span>
          </Link>
          <Link to="/tenants" className={`nav-item ${currentPath.startsWith('/tenants') ? 'active' : ''}`}>
            <Users size={20} />
            <span>{t('nav.tenants')}</span>
          </Link>
          <Link to="/records" className={`nav-item ${currentPath.startsWith('/records') ? 'active' : ''}`}>
            <FileText size={20} />
            <span>{t('nav.records')}</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')}
          >
            <Globe size={16} /> {i18n.language === 'en' ? 'বাংলা' : 'English'}
          </button>
          
          <div className="pwa-install-hint" style={{ display: 'none', marginTop: '10px' }}>
            <button className="btn btn-outline btn-sm">
              <Download size={16} /> {t('nav.installApp')}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="mobile-header">
        <button id="btn-menu" className="btn-icon" aria-label="Menu" onClick={toggleSidebar}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="mobile-brand">{t('brand')}</span>
        <button 
          className="btn-icon" 
          aria-label="Language Toggle"
          onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')}
        >
          <Globe size={20} />
        </button>
      </header>

      {/* Overlay */}
      <div 
        id="sidebar-overlay" 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      ></div>

      {/* Main Content */}
      <main id="main-content" className="main-content">
        {children}
      </main>
    </div>
  );
}
