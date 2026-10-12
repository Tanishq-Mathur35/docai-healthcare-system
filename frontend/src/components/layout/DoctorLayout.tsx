import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  LogOut,
  Stethoscope,
  CheckCircle2,
  Menu,
  X,
  Bell,
  Activity,
  UserCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const navItems = [
  {
    to: "/doctor/dashboard",
    icon: LayoutDashboard,
    label: "Clinical Dashboard",
  },
  {
    to: "/doctor/patients",
    icon: Users,
    label: "Assigned Patients",
  },
  {
    to: "/doctor/appointments",
    icon: Calendar,
    label: "Consultation Schedule",
  },
  {
    to: "/doctor/chat",
    icon: MessageSquare,
    label: "Doctor-Patient Chat",
  },
];

export default function DoctorLayout() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
      {/* ── Light Clean Sidebar (Desktop) ── */}
      <aside className="hidden md:flex w-64 border-r border-sky-100 bg-white flex-col z-20 shadow-sm">
        {/* Brand Header */}
        <div className="p-5 border-b border-sky-100/80">
          <Link to="/doctor/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-sky-600 to-teal-400 rounded-2xl flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                DocAI
              </span>
              <span className="text-[10px] block text-sky-600 font-bold uppercase tracking-wider">
                Doctor Workstation
              </span>
            </div>
          </Link>
        </div>

        {/* Doctor Duty Status Card */}
        <div className="p-3 mx-3 my-2 rounded-2xl bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isOnDuty ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isOnDuty ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <span className="text-xs font-bold text-slate-700">
              {isOnDuty ? "Clinic Active" : "On Break"}
            </span>
          </div>
          <button
            onClick={() => setIsOnDuty(!isOnDuty)}
            className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
          >
            Toggle
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-sky-100 bg-slate-50/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-400 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
              {user ? getInitials(user.firstName, user.lastName) : "DR"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                Dr. {user?.firstName} {user?.lastName}
                <CheckCircle2 className="h-3 w-3 text-sky-600 inline flex-shrink-0" />
              </p>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-100/70 px-1.5 py-0.2 rounded-full inline-block truncate max-w-full">
                Attending Physician
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* ── Main Container ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Clean Top Header */}
        <header className="h-16 border-b border-sky-100 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-xs font-medium text-slate-500">
                Physician Console
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Dr. {user?.firstName} {user?.lastName} 🩺
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold">
              <Activity className="h-3.5 w-3.5 text-sky-600" />
              <span>OPD Active</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Avatar Pill */}
            <Link
              to="/doctor/dashboard"
              className="h-8 w-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold border border-sky-200 hover:ring-2 hover:ring-sky-300 transition-all"
            >
              {user ? getInitials(user.firstName, user.lastName) : "DR"}
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-64 h-full bg-white p-4 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-lg text-slate-900">
                  DocAI Physician
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold ${
                        isActive
                          ? "bg-sky-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#F0F7FF] via-[#F8FAFC] to-[#F1F8F6] p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
