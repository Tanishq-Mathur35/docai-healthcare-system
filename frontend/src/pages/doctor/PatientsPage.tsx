import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  Eye,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Activity,
  Pill,
} from "lucide-react";
import { doctorService } from "@/services/doctor.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/utils";

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: res, isLoading } = useQuery({
    queryKey: ["doctor-patients", { search, page }],
    queryFn: () =>
      doctorService.getAssignedPatients({ search, page, limit: 10 }),
  });

  const patients: any[] = Array.isArray(res?.data?.data)
    ? res.data.data
    : res?.data?.data?.patients || res?.data?.patients || [];
  const meta = res?.data?.meta ||
    res?.data?.data?.meta || { total: patients.length, totalPages: 1 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-7xl mx-auto text-slate-100"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Assigned Patients Directory
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
              {meta.total} Records
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Access patient EHR profiles, clinical histories, AI diagnostic
            summaries, and prescription logs.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 bg-[#0B152F] border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-cyan-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Patient Directory List */}
      <div className="rounded-2xl border border-slate-800 bg-[#0B152F]/70 backdrop-blur-md p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Patient Records Registry
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Page {page} of {meta.totalPages || 1}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-16 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-400">
              Loading Patient Registry...
            </p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
            No patients match your search criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map((pat: any) => (
              <div
                key={pat.id}
                className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:border-cyan-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-cyan-900 to-slate-800 border border-cyan-800/40 flex items-center justify-center text-cyan-300 font-extrabold text-sm flex-shrink-0">
                    {pat.user?.firstName?.[0]}
                    {pat.user?.lastName?.[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {pat.user?.firstName} {pat.user?.lastName}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {pat.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {pat.user?.email}{" "}
                      {pat.user?.phone ? `• ${pat.user?.phone}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-[11px] font-semibold text-cyan-400">
                        Blood: {pat.bloodGroup || "N/A"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • Age: {pat.age ? `${pat.age} yrs` : "N/A"}
                      </span>
                      {pat.allergies?.length > 0 && (
                        <span className="text-[11px] text-red-400 font-semibold">
                          • Allergies: {pat.allergies.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link to={`/doctor/patients/${pat.id}`}>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-semibold text-xs shadow-md shadow-cyan-950/60 gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" /> Open EHR Chart
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
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
