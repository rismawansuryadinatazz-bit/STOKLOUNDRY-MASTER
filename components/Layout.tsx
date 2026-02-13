
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Lang } from '../i18n';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  lowStockCount: number;
  isCloudConnected?: boolean;
  isLoadingCloud?: boolean;
  lastSyncedAt?: Date | null;
  onForceRefresh?: () => void;
  isPullLocked?: boolean; 
}

interface NavGroupProps {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  theme: 'light' | 'dark';
  badgeCount?: number;
}

const NavGroup: React.FC<NavGroupProps> = ({ title, icon, isOpen, onToggle, children, theme, badgeCount }) => {
  return (
    <div className="mb-2">
      <button 
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
          theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-800/50 text-slate-300'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <i className={`fas ${icon} w-5 text-center text-indigo-500`}></i>
            {badgeCount && badgeCount > 0 && !isOpen && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <span className="font-bold text-xs uppercase tracking-widest">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
          {badgeCount && badgeCount > 0 && (
             <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
               {badgeCount}
             </span>
          )}
          <i className={`fas fa-chevron-down text-[10px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] mt-1' : 'max-h-0'}`}>
        <div className="pl-4 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ 
  children, user, onLogout, activeTab, setActiveTab, 
  theme, setTheme, lang, setLang, t, lowStockCount,
  isCloudConnected, isLoadingCloud, lastSyncedAt, onForceRefresh,
  isPullLocked
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    core: true,
    warehouses: true,
    planning: true,
    specialty: false,
    management: false,
    system: true
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const navItemClass = (id: string) => `w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-sm ${
    activeTab === id 
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-bold' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sidebarContent = (
    <div className="p-6 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <i className="fas fa-soap text-xl text-white"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">STOCK LAUNDRY</h1>
            <p className="text-[8px] text-indigo-400 font-black uppercase tracking-[0.1em] mt-1">© SURYADINATA 2026</p>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-white p-2">
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <nav className="flex-1">
        <NavGroup title="Monitoring" icon="fa-chart-pie" isOpen={openGroups.core} onToggle={() => toggleGroup('core')} theme={theme} badgeCount={lowStockCount}>
          <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={navItemClass('dashboard')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-grid-2 w-4 text-center text-[10px]"></i>
              <span>{t('dashboard')}</span>
            </div>
          </button>
          <button onClick={() => { setActiveTab('transactions'); setIsMobileMenuOpen(false); }} className={navItemClass('transactions')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-history w-4 text-center text-[10px]"></i>
              <span>{t('transactions')}</span>
            </div>
          </button>
          <button onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }} className={navItemClass('inventory')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-list-check w-4 text-center text-[10px]"></i>
              <span>{t('inventoryList')}</span>
            </div>
          </button>
        </NavGroup>

        <NavGroup title="Perencanaan" icon="fa-calendar-check" isOpen={openGroups.planning} onToggle={() => toggleGroup('planning')} theme={theme}>
          <button onClick={() => { setActiveTab('restockRequirements'); setIsMobileMenuOpen(false); }} className={navItemClass('restockRequirements')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-calculator w-4 text-center text-[10px]"></i>
              <span>{t('restockNeeds')}</span>
            </div>
          </button>
        </NavGroup>

        <NavGroup title="Logistik" icon="fa-warehouse" isOpen={openGroups.warehouses} onToggle={() => toggleGroup('warehouses')} theme={theme}>
          <button onClick={() => { setActiveTab('mainWarehouse'); setIsMobileMenuOpen(false); }} className={navItemClass('mainWarehouse')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-building-circle-check w-4 text-center text-[10px]"></i>
              <span>Gudang Utama</span>
            </div>
          </button>
          <button onClick={() => { setActiveTab('singlesWarehouse'); setIsMobileMenuOpen(false); }} className={navItemClass('singlesWarehouse')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-box-open w-4 text-center text-[10px]"></i>
              <span>Gudang Singles</span>
            </div>
          </button>
          <button onClick={() => { setActiveTab('nuggetWarehouse'); setIsMobileMenuOpen(false); }} className={navItemClass('nuggetWarehouse')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-box-archive w-4 text-center text-[10px]"></i>
              <span>Gudang Nugget</span>
            </div>
          </button>
        </NavGroup>

        <NavGroup title="Layanan" icon="fa-hand-holding-heart" isOpen={openGroups.specialty} onToggle={() => toggleGroup('specialty')} theme={theme}>
          <button onClick={() => { setActiveTab('repairView'); setIsMobileMenuOpen(false); }} className={navItemClass('repairView')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-wrench w-4 text-center text-[10px]"></i>
              <span>Repair</span>
            </div>
          </button>
          <button onClick={() => { setActiveTab('destructionView'); setIsMobileMenuOpen(false); }} className={navItemClass('destructionView')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-fire w-4 text-center text-[10px]"></i>
              <span>Pemusnahan</span>
            </div>
          </button>
        </NavGroup>

        {(user.role === UserRole.ADMIN || user.role === UserRole.LEADER) && (
          <NavGroup title="Manajemen" icon="fa-shield-halved" isOpen={openGroups.management} onToggle={() => toggleGroup('management')} theme={theme}>
            <button onClick={() => { setActiveTab('master'); setIsMobileMenuOpen(false); }} className={navItemClass('master')}>
              <div className="flex items-center space-x-3">
                <i className="fas fa-database w-4 text-center text-[10px]"></i>
                <span>{t('masterData')}</span>
              </div>
            </button>
            <button onClick={() => { setActiveTab('userManagement'); setIsMobileMenuOpen(false); }} className={navItemClass('userManagement')}>
              <div className="flex items-center space-x-3">
                <i className="fas fa-users-cog w-4 text-center text-[10px]"></i>
                <span>User Management</span>
              </div>
            </button>
          </NavGroup>
        )}

        <NavGroup title="Sistem" icon="fa-gears" isOpen={openGroups.system} onToggle={() => toggleGroup('system')} theme={theme}>
          <button onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} className={navItemClass('settings')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-cloud-arrow-up w-4 text-center text-[10px]"></i>
              <span>{t('settings')}</span>
            </div>
          </button>
        </NavGroup>
      </nav>

      <div className="mt-8 pt-8 border-t border-slate-800 space-y-6">
         <div className="flex items-center justify-between px-2">
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tema</span>
           <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-slate-800 text-indigo-400'}`}><i className={`fas ${theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i></button>
         </div>
      </div>

      <div className="mt-auto pt-8 border-t border-slate-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">{user.name.charAt(0)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 uppercase font-black">{user.role}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all font-black uppercase text-[10px]"><i className="fas fa-power-off"></i><span>Logout</span></button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900'}`}>
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white z-30 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg"><i className="fas fa-soap text-white"></i></div>
          <span className="font-black text-sm tracking-tight">STOCK LAUNDRY</span>
        </div>
        <div className="flex items-center space-x-4">
          {isPullLocked && <i className="fas fa-lock text-rose-500 text-xs" title="Protection Active"></i>}
          {isLoadingCloud ? (
             <i className="fas fa-sync fa-spin text-indigo-400 text-sm"></i>
          ) : (
            <button onClick={onForceRefresh} title="Sync Cloud">
              <i className={`fas fa-cloud ${isCloudConnected ? 'text-green-500' : 'text-slate-600'} text-sm`}></i>
            </button>
          )}
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-xl"><i className="fas fa-bars"></i></button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex w-72 flex-shrink-0 flex-col z-20 border-r border-slate-800 bg-slate-900`}>
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[150] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="relative w-80 max-w-[85%] bg-slate-900 flex flex-col h-full animate-slideRight">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar relative">
        <div className="max-w-7xl mx-auto animate-fadeIn">
          {/* Top Bar Desktop Only */}
          <div className="hidden md:flex justify-end items-center mb-6 space-x-4">
             {isPullLocked && (
               <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-rose-500 bg-rose-500/5 px-3 py-1.5 rounded-full border border-rose-500/10">
                 <i className="fas fa-lock"></i>
                 <span>Database Protected</span>
               </div>
             )}
             
             {lastSyncedAt && (
               <div className="text-[10px] font-black uppercase text-slate-400">
                 {t('lastSynced')}: <span className="text-slate-500 font-mono">{formatTime(lastSyncedAt)}</span>
               </div>
             )}
             
             {isLoadingCloud ? (
               <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-indigo-500 bg-indigo-500/5 px-3 py-1.5 rounded-full border border-indigo-500/10">
                 <i className="fas fa-sync fa-spin"></i>
                 <span>{t('syncing')}</span>
               </div>
             ) : (
               isCloudConnected ? (
                 <button 
                  onClick={onForceRefresh}
                  className="group flex items-center space-x-2 text-[10px] font-black uppercase text-green-500 bg-green-500/5 px-3 py-1.5 rounded-full border border-green-500/10 hover:bg-green-500 hover:text-white transition-all"
                 >
                   <i className="fas fa-cloud group-hover:scale-110 transition-transform"></i>
                   <span>{t('cloudReady')}</span>
                 </button>
               ) : (
                 <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-slate-400 bg-slate-500/5 px-3 py-1.5 rounded-full border border-slate-500/10">
                   <i className="fas fa-cloud-slash"></i>
                   <span>Local Only</span>
                 </div>
               )
             )}
          </div>
          {children}
        </div>
      </main>

      <style>{`
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .animate-slideRight { animation: slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Layout;
