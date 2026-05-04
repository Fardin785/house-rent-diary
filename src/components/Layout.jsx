import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Users, FileText, Calculator, Menu, X, Download, Globe, BookOpen } from 'lucide-react';
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
    <div id="app" className="flex min-h-screen w-full overflow-x-hidden">
      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 w-[var(--sidebar-width)] h-screen bg-sidebar border-r border-border flex flex-col z-100 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] max-md:-translate-x-full ${sidebarOpen ? 'max-md:translate-x-0' : ''}`}
      >
        <div className="flex items-center gap-3 px-5 py-6 border-b border-border">
          <div className="flex items-center justify-center w-[42px] h-[42px] rounded-md bg-gradient-to-br from-accent to-[#a855f7] text-white shadow-glow">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-[1.3rem] font-extrabold tracking-tight bg-gradient-to-br from-accent-hover to-[#c4b5fd] bg-clip-text text-transparent">
            {t('brand')}
          </span>
        </div>

        <nav className="flex-1 p-4 px-3 flex flex-col gap-1">
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-sm text-[0.93rem] font-medium transition-all duration-200 ${
              currentPath === '/'
                ? 'bg-accent-glow text-accent-hover [&_svg]:text-accent'
                : 'text-text-secondary hover:bg-hover hover:text-text-primary'
            }`}
          >
            <Home size={20} />
            <span>{t('nav.dashboard')}</span>
          </Link>
          <Link
            to="/tenants"
            className={`flex items-center gap-3 px-4 py-3 rounded-sm text-[0.93rem] font-medium transition-all duration-200 ${
              currentPath.startsWith('/tenants')
                ? 'bg-accent-glow text-accent-hover [&_svg]:text-accent'
                : 'text-text-secondary hover:bg-hover hover:text-text-primary'
            }`}
          >
            <Users size={20} />
            <span>{t('nav.tenants')}</span>
          </Link>
          <Link
            to="/cost-calculator"
            className={`flex items-center gap-3 px-4 py-3 rounded-sm text-[0.93rem] font-medium transition-all duration-200 ${
              currentPath.startsWith('/cost-calculator')
                ? 'bg-accent-glow text-accent-hover [&_svg]:text-accent'
                : 'text-text-secondary hover:bg-hover hover:text-text-primary'
            }`}
          >
            <Calculator size={20} />
            <span>{t('nav.costCalc')}</span>
          </Link>
          <Link
            to="/family-ledger"
            className={`flex items-center gap-3 px-4 py-3 rounded-sm text-[0.93rem] font-medium transition-all duration-200 ${
              currentPath.startsWith('/family-ledger')
                ? 'bg-accent-glow text-accent-hover [&_svg]:text-accent'
                : 'text-text-secondary hover:bg-hover hover:text-text-primary'
            }`}
          >
            <BookOpen size={20} />
            <span>{t('nav.familyLedger')}</span>
          </Link>
          <Link 
            to="/utility-bills" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-sm text-[0.93rem] font-medium transition-all duration-200 ${
              currentPath.startsWith('/utility-bills')
                ? 'bg-accent-glow text-accent-hover [&_svg]:text-accent'
                : 'text-text-secondary hover:bg-hover hover:text-text-primary'
            }`}
          >
            <Download size={20} />
            <span>{t('nav.utilityBills')}</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <button
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-border rounded-sm bg-transparent text-text-secondary text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 hover:border-accent hover:text-accent hover:bg-accent-glow"
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')}
          >
            <Globe size={16} /> {i18n.language === 'en' ? 'বাংলা' : 'English'}
          </button>
          
          <div className="hidden mt-2.5">
            <button className="flex items-center gap-2 px-3.5 py-1.5 border border-border rounded-sm bg-transparent text-text-secondary text-[0.8rem] font-semibold cursor-pointer transition-all duration-200 hover:border-accent hover:text-accent hover:bg-accent-glow">
              <Download size={16} /> {t('nav.installApp')}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="hidden max-md:flex fixed top-0 left-0 w-screen! box-border h-[var(--mobile-header-height)] bg-sidebar border-b border-border items-center justify-between px-4 z-90">
        <button id="btn-menu" className="inline-flex items-center justify-center w-10 h-10 border-none bg-transparent text-text-secondary rounded-sm cursor-pointer transition-all duration-200 hover:bg-hover hover:text-text-primary" aria-label="Menu" onClick={toggleSidebar}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="font-bold text-[1.1rem] bg-gradient-to-br from-accent-hover to-[#c4b5fd] bg-clip-text text-transparent whitespace-nowrap overflow-hidden text-ellipsis max-w-[60%] text-center">
          {t('brand')}
        </span>
        <button
          className="inline-flex items-center justify-center w-10 h-10 border-none bg-transparent text-text-secondary rounded-sm cursor-pointer transition-all duration-200 hover:bg-hover hover:text-text-primary"
          aria-label="Language Toggle"
          onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')}
        >
          <Globe size={20} />
        </button>
      </header>

      {/* Overlay */}
      <div
        id="sidebar-overlay"
        className={`fixed inset-0 bg-black/50 z-95 backdrop-blur-[4px] ${sidebarOpen ? 'block max-md:block' : 'hidden'}`}
        onClick={closeSidebar}
      ></div>

      {/* Main Content */}
      <main id="main-content" className="ml-[var(--sidebar-width)] flex-1 p-8 min-h-screen max-md:ml-0 max-md:p-4 max-md:pt-[calc(var(--mobile-header-height)+16px)]">
        {children}
      </main>
    </div>
  );
}
