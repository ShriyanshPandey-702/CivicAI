import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, User, FileText, Bot, FolderOpen,
  ClipboardList, Bell, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import TricolorStrip from './TricolorStrip';
import Navbar from './Navbar';
import { ThemeToggle } from '../ui/theme-toggle';
import { useCitizen } from '@/lib/CitizenContext';
import { useTranslation } from '@/hooks/useTranslation';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { citizenProfile, citizenId, schemeCards, analysisComplete, appliedSchemes, notificationCount } = useCitizen();
  const { t } = useTranslation();

  const name = (citizenProfile?.name as string) || 'Citizen';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'C';

  // Profile completion: 0 → no citizen, 25 → id only, 50 → has profile, 75 → has analysis, 100 → has applied
  const profileComplete = !citizenId ? 0
    : !citizenProfile?.name ? 25
    : !analysisComplete ? 50
    : appliedSchemes.length > 0 ? 100
    : 75;

  const schemeCount = analysisComplete ? schemeCards.length : 0;
  const appliedCount = appliedSchemes.length;

  const sidebarItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), to: '/dashboard', badge: 0 },
    { icon: User, label: t('register.step1'), to: '/dashboard/profile', badge: 0 },
    { icon: FileText, label: t('dashboard.eligible_schemes'), to: '/dashboard/schemes', badge: schemeCount },
    { icon: Bot, label: t('agent.title').split(' ')[0] + ' AI', to: '/dashboard/agent', badge: 0 },
    { icon: FolderOpen, label: t('dashboard.doc_vault'), to: '/dashboard/documents', badge: 0 },
    { icon: ClipboardList, label: t('dashboard.applied'), to: '/dashboard/apply', badge: appliedCount },
    { icon: Bell, label: 'Notifications', to: '/dashboard/notifications', badge: notificationCount },
    { icon: Settings, label: 'Settings', to: '/dashboard/settings', badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TricolorStrip />
      <Navbar />
      <div className="flex pt-[calc(3px+4rem)]">
        {/* Sidebar */}
        <aside className={`hidden md:flex flex-col bg-card border-r border-border fixed top-[calc(3px+4rem)] bottom-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
          {/* User info */}
          {!collapsed && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold text-foreground truncate">{name}</div>
                  {citizenId ? (
                    <div className="text-xs text-ashoka-green flex items-center gap-1">✓ Verified</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Not registered</div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Profile</span><span>{profileComplete}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-saffron rounded-full transition-all duration-700"
                    style={{ width: `${profileComplete}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Theme switch (mobile-only) */}
          <div className="md:hidden border-b border-border p-2 flex justify-center">
            <ThemeToggle />
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-2 overflow-auto">
            {sidebarItems.map(item => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-md ${
                    active
                      ? 'bg-primary/10 text-primary font-medium shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary' : ''}`} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sign out */}
          <div className="p-2 border-t border-border">
            <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/5 mx-0 transition-colors">
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </Link>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 bg-card border border-border rounded-full p-1 shadow-md hover:bg-muted hover:scale-110 transition-all"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </aside>

        {/* Main content */}
        <main className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-60'} p-4 md:p-8`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
