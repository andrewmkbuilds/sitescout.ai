import { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Search, Users, Gauge, Mail, Sparkles, Megaphone, FileText,
  BarChart3, Building2, Plug, Settings as SettingsIcon, PanelLeftClose, Bot,
  PanelLeft, Menu, X, LogOut, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import PageErrorBoundary from './PageErrorBoundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const nav = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/discover', label: 'Discover Businesses', icon: Search },
  { to: '/app/leads', label: 'Leads', icon: Users },
  { to: '/app/audits', label: 'Website Audits', icon: Gauge },
  { to: '/app/outreach', label: 'AI Outreach', icon: Mail },
  { to: '/app/agents', label: 'AI Agents', icon: Bot },
  { to: '/app/templates', label: 'Pitch Templates', icon: FileText },
  { to: '/app/concepts', label: 'Website Concepts', icon: Sparkles },
  { to: '/app/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/team', label: 'Team Workspace', icon: Building2 },
  { to: '/app/integrations', label: 'Integrations', icon: Plug },
  { to: '/app/settings', label: 'Settings', icon: SettingsIcon },
];

function NavItem({ item, collapsed, mobile, onNavigate }) {
  const location = useLocation();
  const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-sidebar-primary/10 text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      } ${collapsed && !mobile ? 'justify-center' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {(!collapsed || mobile) && <span>{item.label}</span>}
    </Link>
  );
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = nav.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label || 'SiteScout AI';

  const handleLogout = () => {
    logout(false);
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className={`hidden border-r border-sidebar-border bg-sidebar md:flex md:flex-col transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && <Logo to="/app" />}
          <button onClick={() => setCollapsed((c) => !c)} className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent" aria-label="Toggle sidebar">
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin p-3">
          {nav.map((item) => <NavItem key={item.to} item={item} collapsed={collapsed} />)}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          {!collapsed ? (
            <Badge variant="outline" className="w-full justify-center gap-1.5 py-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Demo mode · Configure providers
            </Badge>
          ) : (
            <div className="flex justify-center"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Demo mode" /></div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-sidebar-border bg-sidebar">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <Logo to="/app" />
              <button onClick={() => setMobileOpen(false)} className="rounded-md p-1.5 hover:bg-sidebar-accent"><X className="h-5 w-5" /></button>
            </div>
            <nav className="space-y-1 p-3">
              {nav.map((item) => <NavItem key={item.to} item={item} mobile onNavigate={() => setMobileOpen(false)} />)}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 hover:bg-muted md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden text-sm sm:inline">{user?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/app/settings"><SettingsIcon className="mr-2 h-4 w-4" /> Settings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/app/integrations"><Plug className="mr-2 h-4 w-4" /> Integrations</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <PageErrorBoundary key={location.pathname}>
              <Outlet />
            </PageErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}