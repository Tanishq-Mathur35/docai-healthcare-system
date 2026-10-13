import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  User,
  Activity,
  Video,
  Clock,
  Sparkles,
  Shield,
  FileText,
  Lock,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  // If already authenticated, redirect straight to their authorized dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectMap: Record<string, string> = {
        PATIENT: '/patient/dashboard',
        DOCTOR: '/doctor/dashboard',
        ADMIN: '/admin/dashboard',
      };
      navigate(redirectMap[user.role] || '/login', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-[#F8FAFC] to-[#F1F8F6] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* ── Top Header ── */}
      <header className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-gradient-to-tr from-sky-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
              DocAI
            </span>
            <span className="text-[10px] block text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">
              Healthcare Ecosystem
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition shadow-2xs"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link
            to="/login?role=ADMIN"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-2 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition flex items-center gap-1.5"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </header>

      {/* ── Main Hero & Role Selection Section ── */}
      <main className="max-w-5xl w-full mx-auto px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center items-center text-center">
        {/* Subhead Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-bold mb-4 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-sky-500" />
          <span>Role-Based Healthcare Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight max-w-2xl leading-tight">
          Welcome to <span className="bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">DocAI</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
          Select your role below to access your dedicated clinical environment, medical tools, and real-time telehealth features.
        </p>

        {/* ── Two Primary Role Selection Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-10 text-left">
          {/* 1. Patient Portal Card */}
          <div className="relative group rounded-3xl bg-white dark:bg-slate-900 p-7 border-2 border-sky-100 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 shadow-xl shadow-sky-500/5 hover:shadow-sky-500/15 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
                  <User className="h-7 w-7" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-3 py-1 rounded-full">
                  Patients & Families
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                  I am a Patient
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Consult the AI symptom checker, review verified home remedies, maintain chronological medical history, and reach doctors through 24/7 emergency live video assistance.
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <span>AI Symptom Intake & Gharelu Nuskhe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <span>24/7 SOS Live Video Doctor Dispatch</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                  <span>Chronological Lab Reports & Prescriptions</span>
                </div>
              </div>
            </div>

            {/* Action Buttons for Patient */}
            <div className="pt-6 space-y-2.5">
              <Button
                asChild
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 rounded-xl shadow-md gap-2"
              >
                <Link to="/login?role=PATIENT">
                  Patient Sign In <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-sky-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-800 text-sky-800 dark:text-sky-300 font-semibold h-10 rounded-xl text-xs"
              >
                <Link to="/register?role=PATIENT">Create Patient Account</Link>
              </Button>
            </div>
          </div>

          {/* 2. Doctor Console Card */}
          <div className="relative group rounded-3xl bg-white dark:bg-slate-900 p-7 border-2 border-teal-100 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 shadow-xl shadow-teal-500/5 hover:shadow-teal-500/15 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-3 py-1 rounded-full">
                  Physicians & Specialists
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                  I am a Doctor
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Manage assigned patient rosters, review chronological medical charts, conduct live video consultations, issue official prescriptions, and respond to incoming emergency requests.
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                  <span>Clinical Workstation & Patient Roster</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <span>Emergency Video Desk with Auto-Failover</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <span>Direct Prescription Issuance & Notes</span>
                </div>
              </div>
            </div>

            {/* Action Buttons for Doctor */}
            <div className="pt-6 space-y-2.5">
              <Button
                asChild
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 rounded-xl shadow-md gap-2"
              >
                <Link to="/login?role=DOCTOR">
                  Doctor Sign In <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-teal-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-800 text-teal-800 dark:text-teal-300 font-semibold h-10 rounded-xl text-xs"
              >
                <Link to="/register?role=DOCTOR">Register as Doctor</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer / Security Information ── */}
      <footer className="max-w-7xl w-full mx-auto px-6 py-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Protected with Email OTP Two-Factor Authentication & HIPAA-aligned encryption</span>
        </div>
        <div>
          <span>© 2026 DocAI Healthcare System · All Rights Reserved</span>
        </div>
      </footer>
    </div>
  );
}

