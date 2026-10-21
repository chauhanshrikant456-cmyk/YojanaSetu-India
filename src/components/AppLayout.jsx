import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BadgeCheck, Bell, ClipboardList, Compass, FileCheck2, FolderOpen, Gauge, GitBranch,
  GraduationCap, Layers, LayoutDashboard, ListChecks, LogOut, Menu, ScrollText, ShieldCheck,
  SlidersHorizontal, User as UserIcon, Users
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import BrandMark from '@/components/common/BrandMark';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const STUDENT_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/opportunities', label: 'Opportunities', icon: Compass },
  { to: '/eligibility', label: 'Eligibility check', icon: ShieldCheck },
  { to: '/readiness', label: 'Readiness & what-if', icon: Gauge },
  { to: '/documents', label: 'Document vault', icon: FolderOpen },
  { to: '/applications', label: 'Applications', icon: ClipboardList },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'My profile', icon: UserIcon }
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: Layers },
  { to: '/admin/opportunities', label: 'Schemes & listings', icon: GraduationCap },
  { to: '/admin/rules', label: 'Eligibility rules', icon: ListChecks },
  { to: '/admin/documents', label: 'Document catalog', icon: FileCheck2 },
  { to: '/admin/dependencies', label: 'Prerequisite graph', icon: GitBranch },
  { to: '/admin/scoring', label: 'Scoring weights', icon: SlidersHorizontal },
  { to: '/admin/verification', label: 'Source verification', icon: BadgeCheck },
  { to: '/admin/users', label: 'User directory', icon: Users },
  { to: '/admin/audit', label: 'Audit logs', icon: ScrollText }
];

function NavList({ items, unread = 0, onNavigate }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
          {item.to === '/notifications' && unread > 0 ? (
            <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              {unread}
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const { user, displayName, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const name = displayName || user?.full_name || 'Signed in';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'YS';

  useEffect(() => {
    let active = true;
    base44.entities.Notification.count({ is_read: false })
      .then((count) => {
        if (active) setUnread(Number(count) || 0);
      })
      .catch(() => {
        if (active) setUnread(0);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to="/" onClick={() => setMobileOpen(false)}>
        <BrandMark />
      </Link>
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Preparation</p>
          <NavList items={STUDENT_NAV} unread={unread} onNavigate={() => setMobileOpen(false)} />
        </div>
        {isAdmin ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin console
            </p>
            <NavList items={ADMIN_NAV} onNavigate={() => setMobileOpen(false)} />
          </div>
        ) : null}
      </div>
      <div className="rounded-2xl border border-border bg-muted/50 p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        {isAdmin ? (
          <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <ShieldCheck className="h-3 w-3" />
            Administrator
          </span>
        ) : null}
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-2" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[268px] border-r border-border bg-card lg:block">
        {sidebar}
      </aside>

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              {sidebar}
            </SheetContent>
          </Sheet>

          <Link to="/" className="lg:hidden">
            <BrandMark compact />
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <Link to="/notifications" aria-label="Notifications" className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              {unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {unread}
                </span>
              ) : null}
            </Link>
            <ThemeToggle />
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/dashboard">My dashboard</Link>
            </Button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}