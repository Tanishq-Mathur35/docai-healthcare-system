import { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
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
  ShieldAlert,
  PhoneCall,
  X,
  Menu,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Ambulance,
  Languages,
  Home,
  FileCheck2,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const navItems = [
  { to: "/patient/dashboard", icon: LayoutDashboard, label: "Home Dashboard" },
  {
    to: "/patient/consultations",
    icon: Stethoscope,
    label: "AI Health Assistant",
    highlight: true,
  },
  { to: "/patient/report-decoded", icon: FileCheck2, label: "Report Decoded", highlight: true },
  { to: "/patient/going-home-right", icon: Home, label: "Going Home Right" },
  { to: "/patient/bol-ke-batao", icon: Languages, label: "Bol Ke Batao (Voice)" },
  { to: "/patient/two-minute-doctor", icon: Clock, label: "2-Min OPD Pre-Consult" },
  { to: "/patient/appointments", icon: Calendar, label: "Doctor Appointments" },
  { to: "/patient/prescriptions", icon: Pill, label: "My Prescriptions" },
  { to: "/patient/documents", icon: FileText, label: "Medical Documents" },
  {
    to: "/patient/medical-history",
    icon: ClipboardList,
    label: "Health Profile",
  },
  { to: "/patient/chat", icon: MessageSquare, label: "Doctor Messages" },
  { to: "/patient/profile", icon: User, label: "Account Settings" },
];

export default function PatientLayout() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
      {/* ── Friendly Rounded Sidebar (Desktop) ── */}
      <aside className="hidden md:flex w-64 border-r border-sky-100 bg-white flex-col z-20 shadow-sm">
        {/* Brand Header */}
        <div className="p-5 border-b border-sky-100/80">
          <Link to="/patient/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-sky-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                DocAI
              </span>
              <span className="text-[10px] block text-sky-600 font-bold uppercase tracking-wider">
                Health Companion
              </span>
            </div>
          </Link>
        </div>

        {/* AI Quick Start Widget in Sidebar */}
        <div className="p-3 mx-3 my-2 rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-100">
          <div className="flex items-center gap-2 text-sky-800 text-xs font-bold mb-1">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            <span>AI Symptom Checker</span>
          </div>
          <p className="text-[11px] text-slate-600 mb-2">
            Feeling unwell? Check symptoms 24/7
          </p>
          <Button
            asChild
            size="sm"
            className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            <Link to="/patient/consultations">Start Consultation</Link>
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
                      ? "text-sky-700 bg-sky-50/70 hover:bg-sky-100/80 font-bold"
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
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-400 to-teal-300 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
              {user ? getInitials(user.firstName, user.lastName) : "PT"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded-full inline-block">
                Active Member
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

      {/* ── Main Patient Companion Container ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Friendly Top Header */}
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
                Welcome back,
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                {user?.firstName} {user?.lastName} 👋
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Prominent Emergency Helpline Button */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs shadow-sm transition-all animate-pulse"
              title="Immediate Emergency Assistance"
            >
              <Ambulance className="h-4 w-4 text-red-600" />
              <span className="hidden sm:inline">Emergency SOS (911)</span>
              <span className="sm:hidden">SOS</span>
            </button>

            {/* Notifications Bell */}
            <NotificationBell />

            {/* Profile Avatar */}
            <Link
              to="/patient/profile"
              className="h-8 w-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold border border-sky-200 hover:ring-2 hover:ring-sky-300 transition-all"
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
              className="w-64 h-full bg-white p-4 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-lg text-slate-900">
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

      {/* ── Emergency SOS Hotline Modal ── */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl border-2 border-red-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600 font-extrabold text-lg">
                <ShieldAlert className="h-6 w-6" />
                <span>Immediate Emergency Help</span>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If you or someone around you is experiencing life-threatening
              symptoms (chest pain, shortness of breath, severe bleeding, or
              loss of consciousness), please dial emergency services
              immediately.
            </p>

            <div className="space-y-2.5 pt-1">
              <a
                href="tel:911"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-md shadow-red-200 transition-all"
              >
                <span className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" /> Dial 911 / 112 (Emergency
                  Services)
                </span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="tel:18002221222"
                className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-xs hover:bg-amber-100 transition-all"
              >
                <span>Poison Control Hotline (1-800-222-1222)</span>
                <PhoneCall className="h-3.5 w-3.5 text-amber-700" />
              </a>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong>Emergency Tip:</strong> Keep calm, sit or lie down
                comfortably, and do not attempt to drive yourself if feeling
                faint or breathless.
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs rounded-xl"
              onClick={() => setShowEmergencyModal(false)}
            >
              Close Alert
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
