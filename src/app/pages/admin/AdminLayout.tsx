import { NavLink, Outlet, useNavigate } from 'react-router';
import { LayoutDashboard, Trees, Map, Users, LogOut, FileText, Bell } from 'lucide-react';
import { cn } from '../../components/ui/utils';
import { useAuth } from '../../contexts/AuthContext';
import { usePlaceRequests } from '../../hooks/useAdminData';

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/parks', label: 'Parks', icon: Map, end: false },
  { to: '/admin/trails', label: 'Trails', icon: Trees, end: false },
  { to: '/admin/reports', label: 'Reports', icon: FileText, end: false },
  { to: '/admin/requests', label: 'Requests', icon: Bell, end: false },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: requests } = usePlaceRequests();
  const openRequestCount = (requests ?? []).filter((r) => r.status === 'open').length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/signin');
  };

  return (
    <div className="flex min-h-screen bg-background font-[Space_Grotesk,sans-serif]">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 flex flex-col bg-card min-h-screen sticky top-0 border-r border-border">
        {/* Logo */}
        <div className="px-6 h-[64px] flex items-center border-b border-border">
          <span className="font-bold text-[13px] tracking-[3px] text-foreground">TRILLO</span>
          <span className="ml-2 text-[10px] font-bold tracking-[1px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-[4px]">
            ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 h-10 rounded-[10px] text-[13.5px] font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {label === 'Requests' && openRequestCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#C96B6B] text-white text-[11px] font-bold flex items-center justify-center">
                  {openRequestCount > 99 ? '99+' : openRequestCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + sign out */}
        <div className="px-3 pb-5 border-t border-border pt-4">
          <div className="px-3 py-2 mb-1">
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 h-10 w-full rounded-[10px] text-[13.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
