import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  LogOut,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Bell,
  Search,
  Activity,
  User,
  PlusCircle,
  Clock,
  CheckCircle2,
  Languages,
  Home,
  FileCheck2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    to: "/doctor/dashboard",
    icon: LayoutDashboard,
    label: "Clinical Dashboard",
    badge: "Live",
  },
  { to: "/doctor/patients", icon: Users, label: "Assigned Patients" },
  {
    to: "/doctor/appointments",
    icon: Calendar,
    label: "Consultation Schedule",
  },
  { to: "/doctor/two-minute-doctor", icon: Clock, label: "Two-Minute Doctor", badge: "OPD" },
  { to: "/doctor/bol-ke-batao", icon: Languages, label: "Bol Ke Batao (Voice)" },
  { to: "/doctor/report-decoded", icon: FileCheck2, label: "Report Decoded" },
  { to: "/doctor/going-home-right", icon: Home, label: "Going Home Right" },
  { to: "/doctor/chat", icon: MessageSquare, label: "Doctor-Patient Chat" },
];

export default function DoctorLayout() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const [collapsed, setCollapsed] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(true);

  return (
    <div className="flex h-screen bg-[#070D1E] text-slate-100 overflow-hidden font-sans">
      {/* ── Fixed Clinical Collapsible Sidebar ── */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } transition-all duration-300 ease-in-out border-r border-slate-800/80 bg-[#0B132B]/95 backdrop-blur-xl flex flex-col z-30 shadow-2xl relative`}
      >
        {/* Hospital Brand Header */}
        <div className="h-16 border-b border-slate-800/80 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 flex-shrink-0 flex items-center justify-center">
              <div className="h-full w-full bg-[#0B132B] rounded-[10px] flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    DocAI
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Clinical
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Hospital Workstation
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 w-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Doctor Status Banner */}
        {!collapsed && (
          <div className="p-3 mx-3 my-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnDuty ? "bg-emerald-400" : "bg-amber-400"}`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnDuty ? "bg-emerald-500" : "bg-amber-500"}`}
                ></span>
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {isOnDuty ? "On Duty — Clinic Active" : "Off Duty / Break"}
              </span>
            </div>
            <button
              onClick={() => setIsOnDuty(!isOnDuty)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              Toggle
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/40"
                    : "text-slate-400 hover:bg-slate-850 hover:text-slate-100 hover:bg-slate-800/60"
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0 text-cyan-400 group-hover:scale-110 transition-transform" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{label}</span>
                  {badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick EHR Lookup Action */}
        {!collapsed && (
          <div className="p-3 mx-3 mb-2 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-800/30">
            <div className="flex items-center gap-2 mb-1.5 text-cyan-300 text-xs font-semibold">
              <Activity className="h-4 w-4" />
              <span>Fast Clinical Action</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Issue prescription or review assigned patient chart
            </p>
            <Button
              asChild
              size="sm"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-900/40"
            >
              <Link to="/doctor/patients">
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Open Patient Chart
              </Link>
            </Button>
          </div>
        )}

        {/* Doctor Identity & Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#091024]">
          <div
            className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} mb-2`}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-cyan-950/50 flex-shrink-0">
              {user ? getInitials(user.firstName, user.lastName) : "DR"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                  Dr. {user?.firstName} {user?.lastName}
                  <CheckCircle2 className="h-3 w-3 text-cyan-400 inline" />
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${
              collapsed ? "px-0 justify-center" : "justify-start text-xs"
            }`}
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            title="Logout"
          >
            <LogOut className={`h-4 w-4 ${collapsed ? "" : "mr-2"}`} />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* ── Main Workstation Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Clinical Topbar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0B132B]/80 backdrop-blur-xl px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/40">
                Physician Console
              </span>
              <span className="text-slate-500 text-sm hidden sm:inline">•</span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Triage Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs font-medium">
              <ShieldAlert className="h-4 w-4 text-red-400 animate-pulse" />
              <span>ER Triage Active</span>
            </div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 relative"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-[#0B132B]"></span>
            </Button>

            {/* Doctor Profile Pill */}
            <Link
              to="/doctor/dashboard"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all text-xs"
            >
              <div className="h-7 w-7 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50 flex items-center justify-center font-bold">
                {user ? getInitials(user.firstName, user.lastName) : "MD"}
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-semibold text-slate-200 block leading-tight">
                  Dr. {user?.firstName}
                </span>
                <span className="text-[10px] text-cyan-400 block leading-tight">
                  Attending Physician
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#070D1E] via-[#091124] to-[#0A1429] p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
