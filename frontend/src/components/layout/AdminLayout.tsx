import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ShieldAlert,
  LogOut,
  Shield,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store/themeStore';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Platform Analytics' },
  { to: '/admin/audit-logs', icon: ShieldAlert, label: 'Audit Logs' },
];

export default function AdminLayout() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-purple-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-sm">
        <div className="p-5 border-b border-purple-100/80 dark:border-slate-800">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-purple-700 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-purple-500/20 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">DocAI</span>
              <span className="text-[10px] block text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-purple-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
              {user ? getInitials(user.firstName, user.lastName) : 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-100 dark:bg-purple-950 px-1.5 py-0.2 rounded-full inline-block">
                Super Admin
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-purple-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              System Administration Workstation
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-100 flex items-center justify-center transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition"
            >
              Landing Page
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
