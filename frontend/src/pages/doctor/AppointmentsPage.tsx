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
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileCheck,
  Pill,
  Eye,
  Phone,
} from "lucide-react";
import { doctorService } from "@/services/doctor.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
      success("Consultation status updated");
      setEditingMeetingId(null);
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    },
    onError: (err: any) => {
      error(
        "Failed to update consultation",
        err.response?.data?.message || "Error occurred",
      );
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-7xl mx-auto text-slate-100"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Consultation Schedule
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
              {meta.total} Sessions
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Manage your patient appointments, video consultation links, and
            consult completion.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
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
            className={`text-xs ${
              statusFilter === tab.value
                ? "bg-gradient-to-r from-cyan-600 to-teal-500 text-white font-bold border-cyan-500 shadow-md shadow-cyan-950/50"
                : "border-slate-800 bg-[#0B152F] text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="rounded-2xl border border-slate-800 bg-[#0B152F]/70 backdrop-blur-md p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Clinical Schedule Timetable
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Page {page} of {meta.totalPages || 1}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-16 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-400">Loading Schedule...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
            No consultations found under this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt: any) => (
              <div
                key={appt.id}
                className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-cyan-900 to-slate-800 border border-cyan-800/40 flex items-center justify-center text-cyan-300 font-extrabold text-sm flex-shrink-0 mt-0.5">
                    {appt.patient?.user?.firstName?.[0]}
                    {appt.patient?.user?.lastName?.[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {appt.patient?.user?.firstName}{" "}
                        {appt.patient?.user?.lastName}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          appt.status === "SCHEDULED"
                            ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                            : appt.status === "CONFIRMED"
                              ? "bg-cyan-950/80 text-cyan-300 border-cyan-700/60"
                              : appt.status === "COMPLETED"
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                                : "bg-red-950/80 text-red-300 border-red-700/60"
                        }`}
                      >
                        {appt.status}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-semibold uppercase">
                        {appt.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                      <span className="flex items-center gap-1 font-semibold text-cyan-300">
                        <Calendar className="h-3.5 w-3.5 text-cyan-400" />
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
                      <p className="text-xs text-slate-300/80 italic mt-1">
                        Complaint: "{appt.chiefComplaint}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                  {appt.patient?.id && (
                    <>
                      <Link to={`/doctor/patients/${appt.patient.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700 bg-slate-800 text-cyan-300 hover:bg-slate-700 text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> EHR Chart
                        </Button>
                      </Link>
                      <Link to="/doctor/chat">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-cyan-800/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 text-xs gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </Button>
                      </Link>
                    </>
                  )}

                  {appt.status !== "COMPLETED" &&
                    appt.status !== "CANCELLED" && (
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
                            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
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
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                          disabled={updateStatusMutation.isPending}
                        >
                          Complete Session
                        </Button>
                      </>
                    )}

                  {appt.meetingLink && (
                    <a href={appt.meetingLink} target="_blank" rel="noreferrer">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-cyan-800 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900 text-xs gap-1"
                      >
                        <Video className="h-3.5 w-3.5" /> Video Call
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-5 border-t border-slate-800/80 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-slate-700 bg-slate-800 text-slate-300 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
              className="border-slate-700 bg-slate-800 text-slate-300 text-xs"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
