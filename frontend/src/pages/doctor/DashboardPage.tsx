import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  Stethoscope,
  Video,
  AlertTriangle,
  ShieldAlert,
  Activity,
  FileText,
  Pill,
  TrendingUp,
  Sparkles,
  UserCheck,
  ArrowUpRight,
  Search,
  PlusCircle,
  PhoneCall,
  Eye,
  HeartPulse,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { doctorService } from "@/services/doctor.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils";

// Clinical weekly activity dataset for physician analytics
const weeklyAnalytics = [
  { day: "Mon", consultations: 8, aiSummaries: 6, emergencies: 1 },
  { day: "Tue", consultations: 12, aiSummaries: 9, emergencies: 0 },
  { day: "Wed", consultations: 15, aiSummaries: 11, emergencies: 2 },
  { day: "Thu", consultations: 10, aiSummaries: 8, emergencies: 1 },
  { day: "Fri", consultations: 18, aiSummaries: 14, emergencies: 3 },
  { day: "Sat", consultations: 7, aiSummaries: 5, emergencies: 0 },
  { day: "Sun", consultations: 4, aiSummaries: 3, emergencies: 0 },
];

export default function DoctorDashboardPage() {
  const [filterQuery, setFilterQuery] = useState("");

  const {
    data: profileRes,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: () => doctorService.getProfile(),
  });

  const {
    data: apptsRes,
    isLoading: apptsLoading,
    refetch: refetchAppts,
  } = useQuery({
    queryKey: ["doctor-appointments", { limit: 15 }],
    queryFn: () => doctorService.getAppointments({ limit: 15 }),
  });

  const {
    data: patientsRes,
    isLoading: patientsLoading,
    refetch: refetchPatients,
  } = useQuery({
    queryKey: ["doctor-patients", { limit: 15 }],
    queryFn: () => doctorService.getAssignedPatients({ limit: 15 }),
  });

  if (profileLoading || apptsLoading || patientsLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-slate-400 text-sm font-medium tracking-wide">
          Loading Clinical Workstation...
        </p>
      </div>
    );
  }

  const doctor = profileRes?.data?.data;
  const appointments: any[] = Array.isArray(apptsRes?.data?.data)
    ? apptsRes.data.data
    : apptsRes?.data?.data?.items || apptsRes?.data?.items || [];
  const totalAppointments =
    apptsRes?.data?.meta?.total ??
    apptsRes?.data?.data?.meta?.total ??
    appointments.length;

  const patients: any[] = Array.isArray(patientsRes?.data?.data)
    ? patientsRes.data.data
    : patientsRes?.data?.data?.patients || patientsRes?.data?.patients || [];
  const totalPatients =
    patientsRes?.data?.meta?.total ??
    patientsRes?.data?.data?.meta?.total ??
    patients.length;

  const localToday = new Date().toLocaleDateString("en-CA");
  const utcToday = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((a: any) => {
    if (!a.appointmentDate) return false;
    const dateStr =
      typeof a.appointmentDate === "string"
        ? a.appointmentDate.slice(0, 10)
        : new Date(a.appointmentDate).toISOString().slice(0, 10);
    return dateStr === localToday || dateStr === utcToday;
  });

  // Emergency / Urgent Priority Cases Detection
  const urgentAppointments = appointments.filter((a: any) => {
    const text = (a.chiefComplaint || "").toLowerCase();
    return (
      text.includes("chest") ||
      text.includes("breath") ||
      text.includes("severe") ||
      text.includes("blood") ||
      text.includes("stroke") ||
      text.includes("acute") ||
      text.includes("emergency")
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-7 max-w-7xl mx-auto"
    >
      {/* ── Top Clinical Command Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-800/40 bg-gradient-to-r from-[#0B1A3A] via-[#0E2A47] to-[#08182E] p-6 lg:p-7 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-xl shadow-cyan-950/60 flex-shrink-0">
              <div className="h-full w-full bg-[#0A192F] rounded-[14px] flex items-center justify-center">
                <HeartPulse className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                  Dr. {doctor?.user?.firstName} {doctor?.user?.lastName}
                </h1>
                {doctor?.isVerified && (
                  <span className="bg-emerald-950/80 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-700/60 flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" /> License Verified
                  </span>
                )}
                <span className="bg-cyan-950/80 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-cyan-700/60">
                  {doctor?.licenseNumber || "MD-ACTIVE"}
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-cyan-400 font-semibold">
                  {doctor?.specialization || "Attending Physician"}
                </span>
                <span className="text-slate-600">•</span>
                <span>{doctor?.hospital || "DocAI Clinical Network"}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">
                  {doctor?.experienceYears || 10}+ Years Clinical Practice
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchProfile();
                refetchAppts();
                refetchPatients();
              }}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-semibold shadow-lg shadow-cyan-950/50 text-xs gap-1.5"
            >
              <Link to="/doctor/patients">
                <PlusCircle className="h-4 w-4" /> Issue Prescription
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-cyan-700/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 text-xs gap-1.5"
            >
              <Link to="/doctor/appointments">
                <Calendar className="h-4 w-4" /> Schedule
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Clinical KPI Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Today's Consultations */}
        <div className="rounded-2xl border border-cyan-900/50 bg-[#0B152F]/70 backdrop-blur-md p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Today's Visits
            </span>
            <div className="h-9 w-9 rounded-xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {todayAppointments.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              scheduled
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-cyan-300 font-medium">
            <Activity className="h-3.5 w-3.5" />
            <span>{totalAppointments} lifetime consultations</span>
          </div>
        </div>

        {/* KPI 2: Total Active Patients */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B152F]/70 backdrop-blur-md p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Active Patients
            </span>
            <div className="h-9 w-9 rounded-xl bg-teal-950/80 border border-teal-800/40 flex items-center justify-center text-teal-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {totalPatients}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              registered
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <UserCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>Assigned to your care</span>
          </div>
        </div>

        {/* KPI 3: Priority Emergency Triage */}
        <div
          className={`rounded-2xl border ${urgentAppointments.length > 0 ? "border-red-800/80 bg-red-950/20" : "border-slate-800 bg-[#0B152F]/70"} backdrop-blur-md p-5 shadow-lg relative overflow-hidden group hover:border-red-600/60 transition-all`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">
              Emergency Triage
            </span>
            <div className="h-9 w-9 rounded-xl bg-red-950/80 border border-red-800/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {urgentAppointments.length}
            </span>
            <span className="text-xs text-red-300 font-semibold">
              urgent flags
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {urgentAppointments.length > 0
                ? "Requires clinical review"
                : "No acute alerts"}
            </span>
          </div>
        </div>

        {/* KPI 4: Clinical Quality & Rating */}
        <div className="rounded-2xl border border-amber-900/40 bg-[#0B152F]/70 backdrop-blur-md p-5 shadow-lg relative overflow-hidden group hover:border-amber-600/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Clinical Rating
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-950/80 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {doctor?.rating?.toFixed(1) || "4.9"}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-300 font-medium">
            <span>{doctor?.totalRatings || 120} verified patient reviews</span>
          </div>
        </div>
      </div>

      {/* ── Emergency Alerts Banner (If any) ── */}
      {urgentAppointments.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/40 to-[#0B152F] border border-red-700/60 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 flex-shrink-0">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-200">
                {urgentAppointments.length} Patient
                {urgentAppointments.length > 1 ? "s" : ""} Flagged with Acute /
                Severe Symptoms
              </h4>
              <p className="text-xs text-red-300/80">
                Patient notes contain acute indicators (e.g. chest pain,
                breathing difficulty, severe symptoms).
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-lg shadow-red-950"
          >
            <Link to="/doctor/appointments">Review Priority Queue</Link>
          </Button>
        </div>
      )}

      {/* ── Clinical AI Suite Workstations (T01 - T04) ── */}
      <div className="rounded-2xl border border-slate-800 bg-[#0B152F]/90 backdrop-blur-md p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Clinical AI Assistive Workstations
            </h3>
            <p className="text-xs text-slate-400">
              High-throughput OPD tools for accelerated patient intake, document OCR, dialect translation, and discharge planning
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold self-start sm:self-auto">
            OPD Modules T01–T04
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* T01: Two-Minute Doctor */}
          <Link
            to="/doctor/two-minute-doctor"
            className="group p-4 rounded-xl border border-indigo-900/60 bg-gradient-to-b from-indigo-950/40 to-slate-900/60 hover:border-indigo-500/60 hover:bg-indigo-950/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-indigo-400 font-mono">T01</span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Two-Minute Doctor
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                60-sec OPD summary from crumpled paperwork, dated timeline & allergy detection.
              </p>
            </div>
            <div className="mt-3 text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Workstation <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* T04: Bol Ke Batao */}
          <Link
            to="/doctor/bol-ke-batao"
            className="group p-4 rounded-xl border border-purple-900/60 bg-gradient-to-b from-purple-950/40 to-slate-900/60 hover:border-purple-500/60 hover:bg-purple-950/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-purple-400 font-mono">T04</span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Bol Ke Batao
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Translate Hindi, Hinglish & Marwari speech into English history with exact source quotes.
              </p>
            </div>
            <div className="mt-3 text-xs font-semibold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Launch Voice AI <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* T02: Report Decoded */}
          <Link
            to="/doctor/report-decoded"
            className="group p-4 rounded-xl border border-teal-900/60 bg-gradient-to-b from-teal-950/40 to-slate-900/60 hover:border-teal-500/60 hover:bg-teal-950/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-teal-400 font-mono">T02</span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                Report, Decoded
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Rule-based lab parameter evaluator with plain-language explanations.
              </p>
            </div>
            <div className="mt-3 text-xs font-semibold text-teal-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Inspect Labs <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* T03: Going Home Right */}
          <Link
            to="/doctor/going-home-right"
            className="group p-4 rounded-xl border border-amber-900/60 bg-gradient-to-b from-amber-950/40 to-slate-900/60 hover:border-amber-500/60 hover:bg-amber-950/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Pill className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-amber-400 font-mono">T03</span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Going Home Right
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Discharge summary converter to morning/noon/night care plan with nurse safety flags.
              </p>
            </div>
            <div className="mt-3 text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Discharge Plan <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── Section: Analytics & Clinical Trends ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Consultation & AI Volume Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0B152F]/70 backdrop-blur-md p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Clinical Consultation & RAG Diagnostics Volume
              </h3>
              <p className="text-xs text-slate-400">
                Weekly patient consultation trajectory and AI summary generation
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>Consultations</span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-400">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span>AI Summaries</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyAnalytics}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="consultationsGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E293B"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    color: "#F8FAFC",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="consultations"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#consultationsGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="aiSummaries"
                  stroke="#14B8A6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#aiGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clinical Distribution by Day */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B152F]/70 backdrop-blur-md p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-teal-400" />
              Patient Load Metrics
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Daily consultation distribution
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Average Daily Visits</span>
                <span className="font-bold text-cyan-400">9.8 Patients</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-teal-400 h-2 rounded-full"
                  style={{ width: "65%" }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-300">
                  Prescription Issuance Rate
                </span>
                <span className="font-bold text-emerald-400">92%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: "92%" }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-300">Patient Satisfaction</span>
                <span className="font-bold text-amber-400">98.4%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-2 rounded-full"
                  style={{ width: "98%" }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">
                Consultation Fee
              </span>
              <span className="font-bold text-white">
                ${doctor?.consultationFee || 100} / session
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Workstations Grid: Upcoming Appointments & Assigned Patients ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's & Upcoming Schedule */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B152F]/70 backdrop-blur-md p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-400" />
                Clinical Consultations Schedule
              </h3>
              <p className="text-xs text-slate-400">
                Upcoming booked visits with patient details
              </p>
            </div>
            <Link to="/doctor/appointments">
              <Button
                variant="ghost"
                size="sm"
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 text-xs gap-1"
              >
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                No upcoming consultations scheduled.
              </div>
            ) : (
              appointments.slice(0, 5).map((appt: any) => {
                const isUrgent =
                  (appt.chiefComplaint || "").toLowerCase().includes("chest") ||
                  (appt.chiefComplaint || "").toLowerCase().includes("severe");

                return (
                  <div
                    key={appt.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isUrgent
                        ? "bg-red-950/20 border-red-800/60 hover:border-red-700"
                        : "bg-slate-900/70 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-900 to-slate-800 border border-cyan-800/50 flex items-center justify-center text-cyan-300 font-bold text-xs flex-shrink-0">
                          {appt.patient?.user?.firstName?.[0]}
                          {appt.patient?.user?.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white truncate">
                              {appt.patient?.user?.firstName}{" "}
                              {appt.patient?.user?.lastName}
                            </p>
                            {isUrgent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-900/80 text-red-300 border border-red-700/60">
                                URGENT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            {formatDate(appt.appointmentDate)} •{" "}
                            {appt.slotStart} - {appt.slotEnd} ({appt.type})
                          </p>
                          {appt.chiefComplaint && (
                            <p className="text-xs text-slate-300/80 truncate italic pt-0.5">
                              "{appt.chiefComplaint}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            appt.status === "CONFIRMED" ||
                            appt.status === "SCHEDULED"
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60"
                              : appt.status === "COMPLETED"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                                : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {appt.status}
                        </span>
                        {appt.meetingLink && (
                          <a
                            href={appt.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-cyan-800 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900"
                              title="Join Video Session"
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Assigned Patients EHR Workstation */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B152F]/70 backdrop-blur-md p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-400" />
                Assigned Patients Directory
              </h3>
              <p className="text-xs text-slate-400">
                Patients under your clinical care
              </p>
            </div>
            <Link to="/doctor/patients">
              <Button
                variant="ghost"
                size="sm"
                className="text-teal-400 hover:text-teal-300 hover:bg-teal-950/50 text-xs gap-1"
              >
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {patients.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                No assigned patients registered yet.
              </div>
            ) : (
              patients.slice(0, 5).map((pat: any) => (
                <div
                  key={pat.id}
                  className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/70 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-900 to-slate-800 border border-teal-800/50 flex items-center justify-center text-teal-300 font-bold text-xs flex-shrink-0">
                      {pat.user?.firstName?.[0]}
                      {pat.user?.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {pat.user?.firstName} {pat.user?.lastName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {pat.age ? `${pat.age} yrs • ` : ""}
                        <span className="text-cyan-400 font-medium">
                          {pat.bloodGroup || "Blood Group N/A"}
                        </span>
                        {pat.chronicDiseases?.length
                          ? ` • ${pat.chronicDiseases.join(", ")}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <Link to={`/doctor/patients/${pat.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 bg-slate-800/80 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-700 text-xs gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> EHR Chart
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
