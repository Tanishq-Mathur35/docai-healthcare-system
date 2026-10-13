import { useState, useEffect } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { io } from "socket.io-client";
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
  Activity,
  Sun,
  Moon,
  Video,
  ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useThemeStore } from "@/store/themeStore";
import EmergencyVideoModal from "@/components/emergency/EmergencyVideoModal";
import { EmergencyCallRecord } from "@/services/emergency.service";
import { useToast } from "@/store/notificationStore";

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
  const { user, accessToken } = useAuthStore();
  const logoutMutation = useLogout();
  const { theme, toggleTheme } = useThemeStore();
  const { success } = useToast();

  const [isOnDuty, setIsOnDuty] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [incomingCall, setIncomingCall] = useState<EmergencyCallRecord | null>(null);

  // Listen for incoming patient emergency calls
  useEffect(() => {
    if (!accessToken) return;
    const socketUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "")
      : window.location.origin;

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
    });

    socket.on("emergency_incoming", (call: EmergencyCallRecord) => {
      setIncomingCall(call);
      setShowEmergencyModal(true);
      success(
        `🚨 Incoming Emergency Call: ${call.patientName}`,
        call.reason || "Urgent live video consultation requested"
      );
    });

    socket.on("emergency_missed", () => {
      setIncomingCall(null);
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      {/* ── Light Clean Sidebar (Desktop) ── */}
      <aside className="hidden md:flex w-64 border-r border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col z-20 shadow-sm">
        {/* Brand Header */}
        <div className="p-5 border-b border-sky-100/80 dark:border-slate-800">
          <Link to="/doctor/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-sky-600 to-teal-400 rounded-2xl flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
                DocAI
              </span>
              <span className="text-[10px] block text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">
                Doctor Workstation
              </span>
            </div>
          </Link>
        </div>

        {/* Doctor Duty Status Card */}
        <div className="p-3 mx-3 my-2 rounded-2xl bg-gradient-to-r from-sky-50 to-teal-50 dark:from-sky-950/50 dark:to-teal-950/40 border border-sky-100 dark:border-slate-800 flex items-center justify-between">
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
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {isOnDuty ? "Clinic Active" : "On Break"}
            </span>
          </div>
          <button
            onClick={() => setIsOnDuty(!isOnDuty)}
            className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
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
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-sky-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-400 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
              {user ? getInitials(user.firstName, user.lastName) : "DR"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                Dr. {user?.firstName} {user?.lastName}
                <CheckCircle2 className="h-3 w-3 text-sky-600 inline flex-shrink-0" />
              </p>
              <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold bg-teal-100/70 dark:bg-teal-950/60 px-1.5 py-0.2 rounded-full inline-block truncate max-w-full">
                Attending Physician
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

      {/* ── Main Container ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Clean Top Header */}
        <header className="h-16 border-b border-sky-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Physician Console
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Dr. {user?.firstName} {user?.lastName} 🩺
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Emergency Video Console Button */}
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                incomingCall && incomingCall.status === "RINGING"
                  ? "bg-red-600 text-white animate-bounce"
                  : "bg-red-50 dark:bg-red-950/60 hover:bg-red-100 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              }`}
            >
              {incomingCall && incomingCall.status === "RINGING" ? (
                <ShieldAlert className="h-4 w-4" />
              ) : (
                <Video className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className="hidden sm:inline">
                {incomingCall && incomingCall.status === "RINGING"
                  ? `Incoming SOS: ${incomingCall.patientName}`
                  : "Emergency Video Desk"}
              </span>
              <span className="sm:hidden">SOS</span>
            </button>

            {/* Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-sky-800 dark:text-sky-300 text-xs font-bold">
              <Activity className="h-3.5 w-3.5 text-sky-600" />
              <span>OPD Active</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-100 flex items-center justify-center transition"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Avatar Pill */}
            <Link
              to="/doctor/dashboard"
              className="h-8 w-8 rounded-xl bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-200 flex items-center justify-center text-xs font-bold border border-sky-200 dark:border-sky-700 hover:ring-2 hover:ring-sky-300 transition-all"
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
              className="w-64 h-full bg-white dark:bg-slate-900 p-4 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-lg text-slate-900 dark:text-white">
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
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"
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
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#F0F7FF] via-[#F8FAFC] to-[#F1F8F6] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* ── Live WebRTC Emergency Video Modal (Doctor Side) ── */}
      <EmergencyVideoModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        role="DOCTOR"
        initialCall={incomingCall}
      />
    </div>
  );
}
