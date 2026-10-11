import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, Stethoscope, Calendar, FileText, CheckCircle2, TrendingUp,
  ArrowRight, ShieldCheck, Activity
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function AdminDashboardPage() {
  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-usage-analytics'],
    queryFn: () => adminService.getUsageAnalytics(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
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
    completionRate: '0',
  };

  const monthlyTrends = res?.data?.data?.monthlyTrends || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Platform Control Center</h1>
            <p className="text-purple-200 text-sm mt-1">
              System health, active user counts, consultation throughput, and AI performance metrics.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/analytics">
              <Button variant="secondary" className="bg-white text-purple-900 hover:bg-purple-50 font-medium">
                Deep Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="border-t-4 border-t-purple-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-medium">Patients</CardDescription>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{kpi.totalPatients}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Registered accounts
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-medium">Doctors</CardDescription>
              <Stethoscope className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{kpi.totalDoctors}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Healthcare providers
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-indigo-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-medium">AI Consults</CardDescription>
              <Activity className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{kpi.totalConsultations}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            LangGraph sessions
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-medium">Appointments</CardDescription>
              <Calendar className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{kpi.totalAppointments}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Booked consultations
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-medium">Clinical Reports</CardDescription>
              <FileText className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{kpi.totalReports}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Generated summaries
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-teal-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-medium">Completion Rate</CardDescription>
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{kpi.completionRate}%</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Successful interviews
          </CardContent>
        </Card>
      </div>

      {/* Monthly Consultation Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Monthly Consultation Volume
          </CardTitle>
          <CardDescription>
            Historical trajectory of total and successfully completed AI medical interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyTrends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Insufficient historical data to graph monthly trends.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total Consultations" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/users">
          <Card className="hover:border-purple-500 transition-colors cursor-pointer group">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold group-hover:text-purple-600 transition-colors">
                  User Management
                </CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardDescription className="text-xs mt-1">
                Manage patient profiles, doctor credential verification, and account deactivation.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/admin/analytics">
          <Card className="hover:border-purple-500 transition-colors cursor-pointer group">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold group-hover:text-purple-600 transition-colors">
                  Platform Analytics
                </CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardDescription className="text-xs mt-1">
                Track disease prevalence trends, patient risk distribution, and AI confidence calibration.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/admin/audit-logs">
          <Card className="hover:border-purple-500 transition-colors cursor-pointer group">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold group-hover:text-purple-600 transition-colors">
                  Security & Audit Logs
                </CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardDescription className="text-xs mt-1">
                Review immutable audit trails for logins, document uploads, and clinical actions.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
