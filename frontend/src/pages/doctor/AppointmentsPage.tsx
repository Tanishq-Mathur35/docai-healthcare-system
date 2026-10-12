import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Video,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
} from "lucide-react";
import { doctorService } from "@/services/doctor.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/store/notificationStore";
import { formatDate } from "@/lib/utils";

export default function DoctorAppointmentsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState("");

  const { data: res, isLoading } = useQuery({
    queryKey: ["doctor-appointments", { status: statusFilter, page }],
    queryFn: () =>
      doctorService.getAppointments({
        status: statusFilter || undefined,
        page,
        limit: 10,
      }),
  });

  const appointments: any[] = Array.isArray(res?.data?.data)
    ? res.data.data
    : res?.data?.data?.items || res?.data?.items || [];
  const meta = res?.data?.meta ||
    res?.data?.data?.meta || { total: appointments.length, totalPages: 1 };

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      meetingLink,
    }: {
      id: string;
      status: string;
      meetingLink?: string;
    }) => doctorService.updateAppointmentStatus(id, status, meetingLink),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard"] });
      success("Appointment Updated", "Patient status updated successfully.");
      setEditingMeetingId(null);
      setMeetingLinkInput("");
    },
    onError: () => {
      error("Update Failed", "Could not update appointment status.");
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Consultation Schedule
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold">
              {meta.total} Sessions
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Manage your patient appointments, video consultation links, and consult completion.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { label: "All Sessions", value: "" },
          { label: "Scheduled", value: "SCHEDULED" },
          { label: "Confirmed", value: "CONFIRMED" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Cancelled", value: "CANCELLED" },
        ].map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`text-xs rounded-xl font-semibold transition-all ${
              statusFilter === tab.value
                ? "bg-sky-600 text-white shadow-sm hover:bg-sky-500"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Appointments List Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Clinical Timetable
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Page {page} of {meta.totalPages || 1}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-16 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-400">Loading Schedule...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
            No consultations found under this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt: any) => (
              <div
                key={appt.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-sky-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-sky-100 text-sky-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    {appt.patient?.user?.firstName?.[0]}
                    {appt.patient?.user?.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          appt.status === "SCHEDULED"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : appt.status === "CONFIRMED"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : appt.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {appt.status}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-semibold uppercase">
                        {appt.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-sky-600" />
                        {formatDate(appt.appointmentDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {appt.slotStart} - {appt.slotEnd}
                      </span>
                      <span>Fee: ${appt.fee}</span>
                      {appt.patient?.user?.phone && (
                        <span>Phone: {appt.patient?.user?.phone}</span>
                      )}
                    </div>

                    {appt.chiefComplaint && (
                      <p className="text-xs text-slate-600 italic mt-1">
                        Complaint: "{appt.chiefComplaint}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end lg:self-center flex-shrink-0">
                  {appt.patient?.id && (
                    <>
                      <Link to={`/doctor/patients/${appt.patient.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> EHR Chart
                        </Button>
                      </Link>
                      <Link to="/doctor/chat">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-sky-200 text-sky-700 hover:bg-sky-50 text-xs rounded-xl gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </Button>
                      </Link>
                    </>
                  )}

                  {appt.status !== "COMPLETED" && appt.status !== "CANCELLED" && (
                    <>
                      {appt.status === "SCHEDULED" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: appt.id,
                              status: "CONFIRMED",
                            })
                          }
                          className="bg-sky-600 hover:bg-sky-500 text-white text-xs rounded-xl shadow-sm"
                          disabled={updateStatusMutation.isPending}
                        >
                          Confirm
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: appt.id,
                            status: "COMPLETED",
                          })
                        }
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl shadow-sm gap-1"
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: appt.id,
                            status: "CANCELLED",
                          })
                        }
                        className="text-red-600 hover:bg-red-50 text-xs rounded-xl"
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </>
                  )}

                  {appt.meetingLink ? (
                    <a href={appt.meetingLink} target="_blank" rel="noreferrer">
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-500 text-white text-xs rounded-xl shadow-sm gap-1"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Video
                      </Button>
                    </a>
                  ) : (
                    editingMeetingId !== appt.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMeetingId(appt.id);
                          setMeetingLinkInput("");
                        }}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs rounded-xl gap-1"
                      >
                        <Video className="h-3.5 w-3.5" /> Add Link
                      </Button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meeting Link Edit Modal inline */}
        {editingMeetingId && (
          <div className="mt-4 p-4 rounded-xl border border-sky-200 bg-sky-50/50 flex flex-col sm:flex-row items-center gap-2">
            <Input
              placeholder="Paste Google Meet or Zoom link..."
              value={meetingLinkInput}
              onChange={(e) => setMeetingLinkInput(e.target.value)}
              className="bg-white border-slate-200 text-xs rounded-xl"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: editingMeetingId,
                    status: "CONFIRMED",
                    meetingLink: meetingLinkInput,
                  })
                }
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs rounded-xl"
                disabled={!meetingLinkInput.trim() || updateStatusMutation.isPending}
              >
                Save Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingMeetingId(null)}
                className="text-xs rounded-xl border-slate-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-5 border-t border-slate-100 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-slate-200 text-slate-700 text-xs rounded-xl"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
              className="border-slate-200 text-slate-700 text-xs rounded-xl"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
