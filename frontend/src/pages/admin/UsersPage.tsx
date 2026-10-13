import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Calendar,
  FileText,
  HeartPulse,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToast } from '@/store/notificationStore';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-users', { role: roleFilter, search, page }],
    queryFn: () => adminService.getUsers({ role: roleFilter || undefined, search, page, limit: 10 }),
  });

  const { data: inspectRes, isLoading: inspectLoading } = useQuery({
    queryKey: ['admin-user-profile', inspectUserId],
    queryFn: () => adminService.getUserProfile(inspectUserId!),
    enabled: !!inspectUserId,
  });

  const inspectedUser = inspectRes?.data?.data;

  const users: any[] = Array.isArray(res?.data?.data)
    ? res.data.data
    : res?.data?.data?.users || res?.data?.users || [];
  const meta = res?.data?.meta || res?.data?.data?.meta || { total: users.length, totalPages: 1 };

  // Toggle user active status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.toggleUserStatus(userId, isActive),
    onSuccess: () => {
      success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (inspectUserId) queryClient.invalidateQueries({ queryKey: ['admin-user-profile', inspectUserId] });
    },
    onError: (err: any) => {
      error('Failed to update status', err.response?.data?.message || 'Error occurred');
    },
  });

  // Verify doctor mutation
  const verifyDoctorMutation = useMutation({
    mutationFn: ({ doctorId, isVerified }: { doctorId: string; isVerified: boolean }) =>
      adminService.verifyDoctor(doctorId, isVerified),
    onSuccess: () => {
      success('Doctor verification status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (inspectUserId) queryClient.invalidateQueries({ queryKey: ['admin-user-profile', inspectUserId] });
    },
    onError: (err: any) => {
      error('Failed to verify doctor', err.response?.data?.message || 'Error occurred');
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            User & Doctor Account Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Inspect individual user profiles, verify medical credentials, and manage system access privileges.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { label: 'All Users', value: '' },
          { label: 'Patients', value: 'PATIENT' },
          { label: 'Doctors', value: 'DOCTOR' },
          { label: 'Admins', value: 'ADMIN' },
        ].map((tab) => (
          <Button
            key={tab.value}
            variant={roleFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setRoleFilter(tab.value);
              setPage(1);
            }}
            className={roleFilter === tab.value ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Users Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Registered Accounts ({meta.total})
          </CardTitle>
          <CardDescription>
            Live list of authenticated accounts registered across DocAI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="font-medium">No users found</p>
              <p className="text-xs">No accounts match the current search or role filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role & Details</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.firstName?.[0]}
                            {u.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Specific Meta */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : u.role === 'DOCTOR'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {u.role}
                          </span>
                          {u.doctor && (
                            <p className="text-xs text-muted-foreground">
                              {u.doctor.specialization}
                              {u.doctor.isVerified ? (
                                <span className="text-emerald-600 font-semibold ml-1.5">✓ Verified</span>
                              ) : (
                                <span className="text-amber-600 font-semibold ml-1.5">⚠ Unverified</span>
                              )}
                            </p>
                          )}
                          {u.patient && (
                            <p className="text-xs text-muted-foreground">
                              {u.patient.age ? `${u.patient.age} yrs • ` : ''}
                              {u.patient.bloodGroup ? u.patient.bloodGroup.replace('_', ' ') : 'Patient Profile'}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" /> Deactivated
                            </>
                          )}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Profile button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
                            onClick={() => setInspectUserId(u.id)}
                            title="Inspect Profile"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View Profile
                          </Button>

                          {/* Doctor verification button */}
                          {u.doctor && (
                            <Button
                              size="sm"
                              variant={u.doctor.isVerified ? 'outline' : 'default'}
                              className={`h-8 text-xs ${!u.doctor.isVerified ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                              onClick={() =>
                                verifyDoctorMutation.mutate({
                                  doctorId: u.doctor.id,
                                  isVerified: !u.doctor.isVerified,
                                })
                              }
                              disabled={verifyDoctorMutation.isPending}
                            >
                              {u.doctor.isVerified ? 'Revoke Verify' : 'Verify'}
                            </Button>
                          )}

                          {/* Toggle Active status */}
                          <Button
                            size="sm"
                            variant={u.isActive ? 'destructive' : 'outline'}
                            className="h-8 text-xs"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                userId: u.id,
                                isActive: !u.isActive,
                              })
                            }
                            disabled={toggleStatusMutation.isPending}
                          >
                            {u.isActive ? 'Suspend' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground border-t mt-4">
              <span>
                Page {page} of {meta.totalPages} ({meta.total} total)
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── User Profile Inspection Modal ── */}
      {inspectUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-sm">
                  {inspectedUser ? `${inspectedUser.firstName?.[0]}${inspectedUser.lastName?.[0]}` : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {inspectedUser ? `${inspectedUser.firstName} ${inspectedUser.lastName}` : 'User Profile'}
                  </h3>
                  <span className="text-xs text-purple-200 font-mono">
                    {inspectedUser?.email} · {inspectedUser?.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectUserId(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {inspectLoading || !inspectedUser ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <>
                  {/* Account Overview Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                      <span className={`font-bold ${inspectedUser.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {inspectedUser.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email Verified</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inspectedUser.isEmailVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inspectedUser.phone || 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Joined Date</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(inspectedUser.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Patient Specific Profile Details */}
                  {inspectedUser.patient && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <HeartPulse className="h-4 w-4 text-rose-500" /> Patient Clinical Profile
                      </h4>
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <p>
                            <strong>Age:</strong> {inspectedUser.patient.age || 'Not recorded'}
                          </p>
                          <p>
                            <strong>Blood Group:</strong> {inspectedUser.patient.bloodGroup || 'Not recorded'}
                          </p>
                          <p>
                            <strong>Allergies:</strong>{' '}
                            {inspectedUser.patient.allergies?.length
                              ? inspectedUser.patient.allergies.join(', ')
                              : 'None recorded'}
                          </p>
                          <p>
                            <strong>Chronic Conditions:</strong>{' '}
                            {inspectedUser.patient.chronicDiseases?.length
                              ? inspectedUser.patient.chronicDiseases.join(', ')
                              : 'None recorded'}
                          </p>
                        </div>

                        {/* Recent Medical History Conditions */}
                        {inspectedUser.patient.medicalHistory?.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="font-semibold block mb-1">Chronological Medical History:</span>
                            <div className="space-y-1">
                              {inspectedUser.patient.medicalHistory.map((m: any) => (
                                <p key={m.id} className="text-[11px] text-slate-600 dark:text-slate-400">
                                  • {m.conditionName} ({m.conditionType}) {m.isActive ? '[Active]' : '[Resolved]'}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Uploaded Documents */}
                        {inspectedUser.patient.documents?.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="font-semibold block mb-1">
                              Uploaded Documents ({inspectedUser.patient.documents.length}):
                            </span>
                            <div className="space-y-1">
                              {inspectedUser.patient.documents.map((d: any) => (
                                <p key={d.id} className="text-[11px] text-slate-600 dark:text-slate-400">
                                  • [{d.documentType}] {d.originalName} ({formatDate(d.uploadedAt)})
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Doctor Specific Details */}
                  {inspectedUser.doctor && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Stethoscope className="h-4 w-4 text-sky-500" /> Doctor Clinical Credentials
                      </h4>
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <p>
                            <strong>Specialization:</strong> {inspectedUser.doctor.specialization}
                          </p>
                          <p>
                            <strong>License Number:</strong> {inspectedUser.doctor.licenseNumber}
                          </p>
                          <p>
                            <strong>Hospital / Clinic:</strong> {inspectedUser.doctor.hospital || 'Private Clinic'}
                          </p>
                          <p>
                            <strong>Experience:</strong> {inspectedUser.doctor.experienceYears} years
                          </p>
                          <p>
                            <strong>Rating:</strong> {inspectedUser.doctor.rating || '4.8'} ⭐ (
                            {inspectedUser.doctor.totalRatings || 0} reviews)
                          </p>
                          <p>
                            <strong>Verification:</strong>{' '}
                            {inspectedUser.doctor.isVerified ? (
                              <span className="text-emerald-600 font-bold">Verified Physician</span>
                            ) : (
                              <span className="text-amber-600 font-bold">Pending Verification</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Action Footer */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    {inspectedUser.doctor && (
                      <Button
                        size="sm"
                        variant={inspectedUser.doctor.isVerified ? 'outline' : 'default'}
                        onClick={() =>
                          verifyDoctorMutation.mutate({
                            doctorId: inspectedUser.doctor.id,
                            isVerified: !inspectedUser.doctor.isVerified,
                          })
                        }
                        className={!inspectedUser.doctor.isVerified ? 'bg-emerald-600 text-white' : ''}
                      >
                        {inspectedUser.doctor.isVerified ? 'Revoke Verification' : 'Verify Doctor'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={inspectedUser.isActive ? 'destructive' : 'outline'}
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          userId: inspectedUser.id,
                          isActive: !inspectedUser.isActive,
                        })
                      }
                    >
                      {inspectedUser.isActive ? 'Suspend User Account' : 'Activate User Account'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
