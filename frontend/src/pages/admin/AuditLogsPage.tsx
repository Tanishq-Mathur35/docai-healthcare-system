import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert, Filter, ChevronLeft, ChevronRight,
  Clock, User, Database, Globe
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function AdminAuditLogsPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', { action: actionFilter, entity: entityFilter, page }],
    queryFn: () =>
      adminService.getAuditLogs({
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        page,
        limit: 15,
      }),
  });

  const logs: any[] = Array.isArray(res?.data?.data)
    ? res.data.data
    : res?.data?.data?.items || res?.data?.items || [];
  const meta = res?.data?.meta || res?.data?.data?.meta || { total: logs.length, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security & Audit Logs</h1>
        <p className="text-muted-foreground text-sm">
          Tamper-evident clinical and administrative activity stream recorded across the system.
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filter by:
            </span>

            <select
              className="h-9 border rounded-md px-3 text-xs bg-background"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Actions</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="USER_LOGOUT">USER_LOGOUT</option>
              <option value="USER_REGISTERED">USER_REGISTERED</option>
              <option value="USER_UPDATED">USER_UPDATED</option>
              <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
              <option value="DOCUMENT_DELETED">DOCUMENT_DELETED</option>
              <option value="CONSULTATION_STARTED">CONSULTATION_STARTED</option>
              <option value="REPORT_GENERATED">REPORT_GENERATED</option>
              <option value="NOTE_CREATED">NOTE_CREATED</option>
              <option value="PRESCRIPTION_CREATED">PRESCRIPTION_CREATED</option>
              <option value="ADMIN_ACTION">ADMIN_ACTION</option>
            </select>

            <select
              className="h-9 border rounded-md px-3 text-xs bg-background"
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Entities</option>
              <option value="User">User</option>
              <option value="Patient">Patient</option>
              <option value="Doctor">Doctor</option>
              <option value="Document">Document</option>
              <option value="Consultation">Consultation</option>
              <option value="Appointment">Appointment</option>
              <option value="DoctorNote">DoctorNote</option>
              <option value="Prescription">Prescription</option>
            </select>

            {(actionFilter || entityFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => {
                  setActionFilter('');
                  setEntityFilter('');
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-purple-600" />
            Audit Trail ({meta.total})
          </CardTitle>
          <CardDescription>
            Chronological log of events including IP addresses and timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="font-medium">No audit logs found</p>
              <p className="text-xs">No records match the selected action and entity criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Network IP</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            log.action === 'ADMIN_ACTION'
                              ? 'bg-purple-100 text-purple-800'
                              : log.action.includes('DELETED')
                              ? 'bg-red-100 text-red-800'
                              : log.action.includes('CREATED') || log.action.includes('REGISTERED')
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {log.entity}
                        {log.entityId && (
                          <span className="block text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                            {log.entityId}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div>
                            <p className="font-medium text-foreground">
                              {log.user.firstName} {log.user.lastName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {log.user.email} ({log.user.role})
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="px-4 py-3">
                        {log.newValue ? (
                          <details className="cursor-pointer text-[11px]">
                            <summary className="text-purple-600 hover:underline">View Payload</summary>
                            <pre className="mt-1 p-2 bg-muted rounded text-[10px] max-w-xs overflow-x-auto">
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">No payload</span>
                        )}
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
                Page {page} of {meta.totalPages} ({meta.total} audit logs)
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
