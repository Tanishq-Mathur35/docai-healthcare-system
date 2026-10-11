import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Activity, PieChart as PieIcon, Cpu, Globe,
  ShieldAlert, TrendingUp, HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const RISK_COLORS: Record<string, string> = {
  LOW: '#10b981',      // Emerald
  MODERATE: '#f59e0b', // Amber
  HIGH: '#f97316',     // Orange
  CRITICAL: '#ef4444', // Red
};

export default function AdminAnalyticsPage() {
  const { data: diseaseRes, isLoading: diseaseLoading } = useQuery({
    queryKey: ['admin-disease-trends'],
    queryFn: () => adminService.getDiseaseTrends(),
  });

  const { data: aiRes, isLoading: aiLoading } = useQuery({
    queryKey: ['admin-ai-performance'],
    queryFn: () => adminService.getAiPerformance(),
  });

  if (diseaseLoading || aiLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const topConditions = diseaseRes?.data?.data?.topConditions || [];
  const riskDistribution = diseaseRes?.data?.data?.riskDistribution || [];
  const aiData = aiRes?.data?.data || {
    avgConfidence: 0,
    tavilyFallbackRate: '0%',
    confidenceHistogram: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Intelligence & Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Real-time disease prevalence, patient triage risk distribution, and LangGraph AI performance metrics.
        </p>
      </div>

      {/* AI Performance Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-t-4 border-t-purple-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-medium">Mean AI Confidence</CardDescription>
              <Cpu className="h-4 w-4 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {Math.round(aiData.avgConfidence * 100)}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Llama-3.3 clinical reasoning index
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-medium">Tavily Fallback Rate</CardDescription>
              <Globe className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{aiData.tavilyFallbackRate}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Triggered when AI confidence &lt; 75%
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-600">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-medium">Evaluated Reports</CardDescription>
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {aiData.confidenceHistogram.reduce((acc: number, cur: any) => acc + cur.count, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Sampled diagnostic reports
          </CardContent>
        </Card>
      </div>

      {/* Disease Trends & Risk Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Diagnosed Conditions Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Prevalent Conditions Identified
            </CardTitle>
            <CardDescription>
              Most common possible conditions detected during LangGraph interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topConditions.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No diagnostic conditions recorded yet.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topConditions}
                    margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Identified Cases" fill="#8884d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Level Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-purple-600" />
              Patient Triage Risk Distribution
            </CardTitle>
            <CardDescription>
              Clinical risk stratification (Low, Moderate, High, Critical)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {riskDistribution.every((r: any) => r.count === 0) ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No report risk data recorded yet.
              </div>
            ) : (
              <div className="h-72 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      dataKey="count"
                      nameKey="risk"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      paddingAngle={4}
                      label={({ risk, percent }) => `${risk} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {riskDistribution.map((entry: any) => (
                        <Cell key={`cell-${entry.risk}`} fill={RISK_COLORS[entry.risk] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Confidence Score Histogram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-600" />
            AI Diagnostic Confidence Calibration
          </CardTitle>
          <CardDescription>
            Frequency distribution of LangGraph confidence scores across reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiData.confidenceHistogram.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No confidence metrics available.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiData.confidenceHistogram} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Reports" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
