import { useState, useEffect } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { io } from "socket.io-client";
import {
  LayoutDashboard,
  User,
  ClipboardList,
  FileText,
  Calendar,
  MessageSquare,
  LogOut,
  Stethoscope,
  Pill,
  HeartPulse,
  X,
  Menu,
  Sparkles,
  Languages,
  Home,
  FileCheck2,
  Clock,
  Sun,
  Moon,
  Video,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useThemeStore } from "@/store/themeStore";
import { useTranslation } from "@/store/languageStore";
import EmergencyVideoModal from "@/components/emergency/EmergencyVideoModal";
import { EmergencyCallRecord } from "@/services/emergency.service";
import { useToast } from "@/store/notificationStore";

export default function PatientLayout() {
  const { user, accessToken } = useAuthStore();
  const logoutMutation = useLogout();
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage, t } = useTranslation();
  const { success } = useToast();

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [activeEmergencyCall, setActiveEmergencyCall] = useState<EmergencyCallRecord | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/patient/dashboard", icon: LayoutDashboard, label: t.dashboard },
    {
      to: "/patient/consultations",
      icon: Stethoscope,
      label: t.aiConsultation,
      highlight: true,
    },
    { to: "/patient/report-decoded", icon: FileCheck2, label: t.reportDecoded, highlight: true },
    { to: "/patient/going-home-right", icon: Home, label: t.goingHomeRight },
    { to: "/patient/bol-ke-batao", icon: Languages, label: t.bolKeBatao },
    { to: "/patient/two-minute-doctor", icon: Clock, label: t.twoMinDoctor },
    { to: "/patient/appointments", icon: Calendar, label: t.appointments },
    {
      to: "/patient/medical-history",
      icon: ClipboardList,
      label: t.medicalHistory,
    },
    { to: "/patient/documents", icon: FileText, label: t.documents },
    { to: "/patient/prescriptions", icon: Pill, label: language === "hi" ? "डॉक्टर के पर्चे" : "My Prescriptions" },
    { to: "/patient/chat", icon: MessageSquare, label: t.messages },
    { to: "/patient/profile", icon: User, label: t.profile },
  ];

  // Listen for live emergency call acceptance/reassignment notifications
  useEffect(() => {
    if (!accessToken) return;
    const socketUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "")
      : window.location.origin;

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
    });

    socket.on("emergency_accepted", (call: EmergencyCallRecord) => {
      setActiveEmergencyCall(call);
      setShowEmergencyModal(true);
      success(
        language === "hi" ? "डॉक्टर वीडियो कॉल से जुड़ गए हैं!" : "Doctor Accepted Emergency Call!",
        `${call.assignedDoctorName} (${call.assignedDoctorSpecialization})`
      );
    });

    socket.on("emergency_reassigned", (call: EmergencyCallRecord & { message?: string }) => {
      setActiveEmergencyCall(call);
      success(
        language === "hi" ? "कॉल दूसरे उपलब्ध डॉक्टर को भेजी गई" : "Emergency Call Reassigned",
        call.message || `Assigned to ${call.assignedDoctorName}`
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, language]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      {/* ── Friendly Rounded Sidebar (Desktop) ── */}
      <aside className="hidden md:flex w-64 border-r border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col z-20 shadow-sm">
        {/* Brand Header */}
        <div className="p-5 border-b border-sky-100/80 dark:border-slate-800">
          <Link to="/patient/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-sky-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
                DocAI
              </span>
              <span className="text-[10px] block text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">
                {t.patientPortal}
              </span>
            </div>
          </Link>
        </div>

        {/* AI Quick Start Widget in Sidebar */}
        <div className="p-3 mx-3 my-2 rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 dark:from-sky-950/50 dark:to-emerald-950/40 border border-sky-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 text-xs font-bold mb-1">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            <span>{t.aiConsultation}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">
            {language === "hi"
              ? "लक्षण बताएं और घरेलू उपचार पाएं"
              : "Check symptoms & home remedies 24/7"}
          </p>
          <Button
            asChild
            size="sm"
            className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Link to="/patient/consultations">{t.startAiConsultation}</Link>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, highlight }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                    : highlight
                      ? "text-sky-700 dark:text-sky-300 bg-sky-50/70 dark:bg-sky-950/40 hover:bg-sky-100/80 font-bold"
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
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-400 to-teal-300 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
              {user ? getInitials(user.firstName, user.lastName) : "PT"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full inline-block">
                {t.patientPortal}
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
            {t.signOut}
          </Button>
        </div>
      </aside>

      {/* ── Main Patient Companion Container ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Friendly Top Header */}
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
                {t.welcomeBack},
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {user?.firstName} {user?.lastName} 👋
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Prominent Emergency Live Video Call Button */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all animate-pulse"
              title="Immediate Live Video Emergency Call"
            >
              <Video className="h-4 w-4 text-white" />
              <span className="hidden sm:inline">{t.emergencyBtn}</span>
              <span className="sm:hidden">{t.emergencyShort}</span>
            </button>

            {/* Hindi / English Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/70 dark:bg-slate-800 text-sky-800 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold transition"
              title="Switch Language (English / हिंदी)"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{language === "en" ? "EN | हिंदी" : "हिंदी | EN"}</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-100 flex items-center justify-center transition"
              title={theme === "dark" ? t.lightMode : t.darkMode}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications Bell */}
            <NotificationBell />

            {/* Profile Avatar */}
            <Link
              to="/patient/profile"
              className="h-8 w-8 rounded-xl bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-200 flex items-center justify-center text-xs font-bold border border-sky-200 dark:border-sky-700 hover:ring-2 hover:ring-sky-300 transition-all"
            >
              {user ? getInitials(user.firstName, user.lastName) : "PT"}
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
                  DocAI Health
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold ${
                        isActive
                          ? "bg-sky-500 text-white"
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

      {/* ── Live WebRTC Emergency Video Modal ── */}
      <EmergencyVideoModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        role="PATIENT"
        initialCall={activeEmergencyCall}
      />
    </div>
  );
}
