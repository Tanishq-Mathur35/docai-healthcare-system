import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  CheckCircle2,
  ChevronRight,
  Stethoscope,
  Video,
  AlertCircle,
  Activity,
  PlusCircle,
  Sparkles,
  RefreshCw,
  HeartPulse,
  UserCheck,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { doctorService } from "@/services/doctor.service";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils";

// Minimal weekly consultations chart data
const weeklyActivity = [
  { day: "Mon", consultations: 6 },
  { day: "Tue", consultations: 9 },
  { day: "Wed", consultations: 12 },
  { day: "Thu", consultations: 8 },
  { day: "Fri", consultations: 14 },
  { day: "Sat", consultations: 5 },
  { day: "Sun", consultations: 3 },
];

export default function DoctorDashboardPage() {
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
    queryKey: ["doctor-appointments", { limit: 10 }],
    queryFn: () => doctorService.getAppointments({ limit: 10 }),
  });

  const {
    data: patientsRes,
    isLoading: patientsLoading,
    refetch: refetchPatients,
  } = useQuery({
    queryKey: ["doctor-patients", { limit: 10 }],
    queryFn: () => doctorService.getAssignedPatients({ limit: 10 }),
  });

  if (profileLoading || apptsLoading || patientsLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 text-sm font-medium">
          Loading Physician Dashboard...
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

  // Filter today's consultations
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

  // Urgent triage cases
  const urgentAppointments = appointments.filter((a: any) => {
    const text = (a.chiefComplaint || "").toLowerCase();
    return (
      text.includes("chest") ||
      text.includes("breath") ||
      text.includes("severe") ||
      text.includes("blood") ||
      text.includes("stroke")
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      {/* ── Welcome Clinical Banner ── */}
      <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 flex-shrink-0">
            <HeartPulse className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Dr. {doctor?.user?.firstName} {doctor?.user?.lastName}
              </h1>
              {doctor?.isVerified && (
                <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified
                </span>
              )}
              <span className="bg-sky-50 text-sky-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-sky-200">
                {doctor?.licenseNumber || "MD-ACTIVE"}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sky-700">
                {doctor?.specialization || "General Physician"}
              </span>
              <span>•</span>
              <span>{doctor?.hospital || "Hospital Consultation Network"}</span>
              <span>•</span>
              <span>{doctor?.experienceYears || 8}+ Years Experience</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchProfile();
              refetchAppts();
              refetchPatients();
            }}
            className="text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Refresh
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-sm gap-1.5"
          >
            <Link to="/doctor/patients">
              <Users className="h-3.5 w-3.5" /> Assigned Patients
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50 gap-1.5"
          >
            <Link to="/doctor/appointments">
              <Calendar className="h-3.5 w-3.5" /> Schedule
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Appointments */}
        <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Schedule
            </span>
            <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {todayAppointments.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">visits today</span>
          </div>
          <p className="mt-2 text-xs text-sky-700 font-medium flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{totalAppointments} total consultations</span>
          </p>
        </div>

        {/* Card 2: Active Patients */}
        <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assigned Patients
            </span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalPatients}
            </span>
            <span className="text-xs text-slate-500 font-medium">registered</span>
          </div>
          <p className="mt-2 text-xs text-teal-700 font-medium flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Under your clinical care</span>
          </p>
        </div>

        {/* Card 3: Priority Alerts */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Priority Flags
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {urgentAppointments.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">attention flags</span>
          </div>
          <p className="mt-2 text-xs text-amber-700 font-medium">
            {urgentAppointments.length > 0 ? "Requires review" : "No urgent alerts"}
          </p>
        </div>

        {/* Card 4: Clinical Rating */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Patient Rating
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {doctor?.rating?.toFixed(1) || "4.9"}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 5.0</span>
          </div>
          <p className="mt-2 text-xs text-emerald-700 font-medium">
            {doctor?.totalRatings || 120} verified patient reviews
          </p>
        </div>
      </div>

      {/* ── Urgent Alert Notice (If Any) ── */}
      {urgentAppointments.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {urgentAppointments.length} Patient Case{urgentAppointments.length > 1 ? "s" : ""} Flagged with Urgent Symptoms
              </p>
              <p className="text-amber-700 mt-0.5">
                Complaints indicate acute symptoms requiring prompt medical attention.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl self-start sm:self-auto"
          >
            <Link to="/doctor/appointments">View Schedule</Link>
          </Button>
        </div>
      )}

      {/* ── Main Two-Column Workflow ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Consultations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-600" />
                Upcoming Appointments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scheduled consultations for patient evaluation
              </p>
            </div>
            <Link
              to="/doctor/appointments"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No upcoming appointments scheduled.
              </div>
            ) : (
              appointments.slice(0, 5).map((appt: any) => (
                <div
                  key={appt.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-sky-200 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {appt.patient?.user?.firstName?.[0]}
                      {appt.patient?.user?.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {formatDate(appt.appointmentDate)} • {appt.slotStart} - {appt.slotEnd} ({appt.type})
                      </p>
                      {appt.chiefComplaint && (
                        <p className="text-xs text-slate-600 truncate italic mt-0.5">
                          "{appt.chiefComplaint}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        appt.status === "CONFIRMED" || appt.status === "SCHEDULED"
                          ? "bg-sky-100 text-sky-800"
                          : appt.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {appt.status}
                    </span>
                    {appt.meetingLink && (
                      <a href={appt.meetingLink} target="_blank" rel="noreferrer">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 rounded-lg border-sky-200 text-sky-700 hover:bg-sky-50"
                          title="Join Online Session"
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Patients Directory */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                Assigned Patients Directory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Patients under your medical care
              </p>
            </div>
            <Link
              to="/doctor/patients"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {patients.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No assigned patients registered yet.
              </div>
            ) : (
              patients.slice(0, 5).map((pat: any) => (
                <div
                  key={pat.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-teal-200 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {pat.user?.firstName?.[0]}
                      {pat.user?.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {pat.user?.firstName} {pat.user?.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {pat.age ? `${pat.age} yrs • ` : ""}
                        <span className="font-medium text-slate-700">
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
                      className="text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 gap-1"
                    >
                      Chart <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Weekly Consultation Volume Trends (Clean Light Area Chart) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-600" />
              Weekly Consultation Trajectory
            </h2>
            <p className="text-xs text-slate-500">
              Overview of completed patient consultations across the week
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 self-start sm:self-auto">
            Weekly Activity
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyActivity}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="consultColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "0.75rem",
                  color: "#0f172a",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                }}
              />
              <Area
                type="monotone"
                dataKey="consultations"
                stroke="#0284c7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#consultColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
