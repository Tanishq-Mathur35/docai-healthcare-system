import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  Calendar,
  FileText,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  Eye,
  ShieldAlert,
  Server,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDateTime } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [selectedUserModal, setSelectedUserModal] = useState<any | null>(null);

  const { data: res, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-usage-analytics'],
    queryFn: () => adminService.getUsageAnalytics(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const kpi = res?.data?.data?.kpi || {
    totalPatients: 0,
    totalDoctors: 0,
    totalConsultations: 0,
    totalAppointments: 0,
    totalReports: 0,
    totalEmergencyRequests: 0,
    completionRate: '0',
  };

  const monthlyTrends = res?.data?.data?.monthlyTrends || [];
  const recentActivities: any[] = res?.data?.data?.recentActivities || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Top Admin Banner ── */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-7 text-white shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>DocAI Central System Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Administrative Control Dashboard
            </h1>
            <p className="text-purple-200/90 text-sm max-w-2xl">
              Real-time governance over all patient accounts, credentialed doctors, emergency video calls, appointments, and clinical AI operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Link to="/admin/users">
              <Button
                size="sm"
                className="bg-white hover:bg-purple-50 text-purple-900 font-bold text-xs rounded-xl shadow-md"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" /> Manage Users
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Core KPI Statistics Grid (Patients, Doctors, Appointments, Emergency, Reports) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Patients */}
        <Card className="border-t-4 border-t-purple-600 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-semibold text-xs text-slate-500">
                Total Patients
              </CardDescription>
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white pt-1">
              {kpi.totalPatients}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Registered patient accounts
          </CardContent>
        </Card>

        {/* Registered Doctors */}
        <Card className="border-t-4 border-t-sky-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-semibold text-xs text-slate-500">
                Doctors
              </CardDescription>
              <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600">
                <Stethoscope className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white pt-1">
              {kpi.totalDoctors}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Licensed healthcare providers
          </CardContent>
        </Card>

        {/* Total Appointments */}
        <Card className="border-t-4 border-t-emerald-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-semibold text-xs text-slate-500">
                Appointments
              </CardDescription>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white pt-1">
              {kpi.totalAppointments}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Booked clinical consultations
          </CardContent>
        </Card>

        {/* Emergency Requests */}
        <Card className="border-t-4 border-t-red-600 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-semibold text-xs text-slate-500">
                Emergency SOS
              </CardDescription>
              <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center text-red-600 animate-pulse">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-red-600 dark:text-red-400 pt-1">
              {kpi.totalEmergencyRequests}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Live video SOS calls logged
          </CardContent>
        </Card>

        {/* Medical Reports */}
        <Card className="border-t-4 border-t-amber-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-semibold text-xs text-slate-500">
                Medical Reports
              </CardDescription>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white pt-1">
              {kpi.totalReports}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            AI summaries & home remedies
          </CardContent>
        </Card>

        {/* AI Consultations & Completion */}
        <Card className="border-t-4 border-t-teal-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-semibold text-xs text-slate-500">
                AI Interviews
              </CardDescription>
              <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white pt-1">
              {kpi.totalConsultations}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            {kpi.completionRate}% completion rate
          </CardContent>
        </Card>
      </div>

      {/* ── Main Content Grid: Monthly Trends + System Activity Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Consultation Volume Chart */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Monthly Consultation & Medical Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Trajectory of total and completed consultations over the last 6 months
              </CardDescription>
            </div>
            <Link to="/admin/analytics" className="text-xs font-semibold text-purple-600 hover:underline">
              View Analytics →
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {monthlyTrends.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No monthly data available yet. Start consultations to populate graphs.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="total" name="Total Consultations" fill="#9333ea" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Col: Live System Activity Stream */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                System Activity Log
              </CardTitle>
              <CardDescription className="text-xs">
                Recent user registrations, logins & clinical events
              </CardDescription>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-semibold text-purple-600 hover:underline">
              All Logs →
            </Link>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-80 space-y-3 pt-1 divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No recent activities recorded yet.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="pt-2.5 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(act.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    {act.user ? (
                      <>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {act.user.firstName} {act.user.lastName}
                        </span>{' '}
                        ({act.user.role}) · {act.entity}
                      </>
                    ) : (
                      `System action on ${act.entity}`
                    )}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Admin Navigation Modules ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/users">
          <Card className="hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group rounded-2xl">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-purple-600 transition-all" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                User & Doctor Management
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect user profiles, verify doctor medical licenses, activate or suspend accounts.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/admin/analytics">
          <Card className="hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group rounded-2xl">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                  <Activity className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                System Analytics & Diseases
              </CardTitle>
              <CardDescription className="text-xs">
                Examine disease prevalence distributions, patient risk levels, and AI confidence calibration.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/admin/audit-logs">
          <Card className="hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group rounded-2xl">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="h-9 w-9 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-teal-600 transition-all" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Audit Trail & Security
              </CardTitle>
              <CardDescription className="text-xs">
                Monitor tamper-evident audit logs with IP addresses, user agents, and chronological events.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
