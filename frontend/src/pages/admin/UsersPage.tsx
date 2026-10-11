import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, CheckCircle2, XCircle, ShieldCheck, ShieldAlert,
  ChevronLeft, ChevronRight, Stethoscope, User
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToast } from '@/store/notificationStore';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-users', { role: roleFilter, search, page }],
    queryFn: () => adminService.getUsers({ role: roleFilter || undefined, search, page, limit: 10 }),
  });

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
    },
    onError: (err: any) => {
      error('Failed to verify doctor', err.response?.data?.message || 'Error occurred');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm">
            Inspect accounts, verify licensed doctors, and manage access privileges across the system.
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
      <div className="flex gap-2 border-b pb-2">
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
            className={roleFilter === tab.value ? 'bg-purple-600 text-white' : ''}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Registered Accounts ({meta.total})
          </CardTitle>
          <CardDescription>
            Live list of all authenticated accounts in PostgreSQL
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
                <tbody className="divide-y">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            {u.firstName?.[0]}
                            {u.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Specific Meta */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'DOCTOR'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                          >
                            {u.role}
                          </span>
                          {u.doctor && (
                            <p className="text-xs text-muted-foreground">
                              {u.doctor.specialization}
                              {u.doctor.isVerified ? (
                                <span className="text-green-600 font-semibold ml-1.5">✓ Verified Doctor</span>
                              ) : (
                                <span className="text-amber-600 font-semibold ml-1.5">⚠ Unverified</span>
                              )}
                            </p>
                          )}
                          {u.patient && (
                            <p className="text-xs text-muted-foreground">
                              {u.patient.age ? `${u.patient.age} yrs • ` : ''}
                              {u.patient.bloodGroup || 'Blood group not set'}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" /> Inactive
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
                        <div className="flex items-center justify-end gap-2">
                          {/* Doctor verification button */}
                          {u.doctor && (
                            <Button
                              size="sm"
                              variant={u.doctor.isVerified ? 'outline' : 'default'}
                              className={`h-7 text-xs ${!u.doctor.isVerified ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                              onClick={() =>
                                verifyDoctorMutation.mutate({
                                  doctorId: u.doctor.id,
                                  isVerified: !u.doctor.isVerified,
                                })
                              }
                              disabled={verifyDoctorMutation.isPending}
                            >
                              {u.doctor.isVerified ? 'Revoke Verify' : 'Verify Doctor'}
                            </Button>
                          )}

                          {/* Toggle Active status */}
                          <Button
                            size="sm"
                            variant={u.isActive ? 'destructive' : 'outline'}
                            className="h-7 text-xs"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                userId: u.id,
                                isActive: !u.isActive,
                              })
                            }
                            disabled={toggleStatusMutation.isPending}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
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
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-xs text-muted-foreground">
                Page {page} of {meta.totalPages} ({meta.total} users)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
