import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { doctorService } from "@/services/doctor.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

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
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Assigned Patients Directory
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold">
              {meta.total} Patients
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Access patient EHR charts, diagnostic reports, and clinical history.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 bg-white border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:border-sky-500 rounded-xl"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Patient Directory List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Patient Records Registry
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Page {page} of {meta.totalPages || 1}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-16 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-400">Loading Patient Registry...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
            No patients match your search criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map((pat: any) => (
              <div
                key={pat.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-sky-100 text-sky-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {pat.user?.firstName?.[0]}
                    {pat.user?.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {pat.user?.firstName} {pat.user?.lastName}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {pat.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {pat.user?.email}{" "}
                      {pat.user?.phone ? `• ${pat.user?.phone}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                      <span className="font-semibold text-sky-700">
                        Blood: {pat.bloodGroup || "N/A"}
                      </span>
                      <span>•</span>
                      <span>Age: {pat.age ? `${pat.age} yrs` : "N/A"}</span>
                      {pat.allergies?.length > 0 && (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          • Allergies: {pat.allergies.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <Link to={`/doctor/patients/${pat.id}`}>
                    <Button
                      size="sm"
                      className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-sm gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Patient Chart
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
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
