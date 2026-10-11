import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { patientService } from "@/services/patient.service";
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
import { formatDate } from "@/lib/utils";
import {
  Pill,
  Stethoscope,
  Calendar,
  Clock,
  AlertCircle,
  Search,
  Printer,
  CheckCircle2,
  ChevronRight,
  Download,
} from "lucide-react";

export default function PrescriptionsPage() {
  const [search, setSearch] = useState("");

  const { data: res, isLoading } = useQuery({
    queryKey: ["patient-prescriptions"],
    queryFn: () => patientService.getPrescriptions(),
  });

  const prescriptions: any[] = Array.isArray(res?.data?.data)
    ? res.data.data
    : res?.data?.data?.items || res?.data?.items || [];

  const filteredPrescriptions = prescriptions.filter((rx: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const docName =
      `${rx.doctor?.user?.firstName || ""} ${rx.doctor?.user?.lastName || ""}`.toLowerCase();
    const specialty = (rx.doctor?.specialization || "").toLowerCase();
    const medsMatch =
      Array.isArray(rx.medications) &&
      rx.medications.some((m: any) => (m.name || "").toLowerCase().includes(q));
    return docName.includes(q) || specialty.includes(q) || medsMatch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-5xl mx-auto pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <Pill className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              My Prescriptions (Rx)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Access certified digital prescriptions, medications, dosage guides,
            and doctor instructions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search medicine or doctor..."
              className="pl-9 text-xs rounded-xl border-sky-200 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl border-sky-200 text-sky-800 hover:bg-sky-50 text-xs gap-1.5 hidden sm:inline-flex"
          >
            <Printer className="h-4 w-4" /> Print Prescriptions
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-500">
            Retrieving your prescriptions...
          </p>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-sky-200 bg-white p-12 text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <Pill className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No Prescriptions Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? "No prescriptions match your search query."
              : "You have not been issued any digital prescriptions yet. When your doctor writes a prescription, it will appear here."}
          </p>
          <Button
            asChild
            size="sm"
            className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs"
          >
            <Link to="/patient/appointments">Book a Consultation</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPrescriptions.map((rx: any) => {
            const isExpired =
              rx.validUntil && new Date(rx.validUntil) < new Date();
            const doctorUser = rx.doctor?.user;

            return (
              <div
                key={rx.id}
                className="rounded-3xl border border-sky-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-50/80 via-white to-emerald-50/40 border-b border-sky-100 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">
                            Dr. {doctorUser?.firstName} {doctorUser?.lastName}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isExpired
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {isExpired ? "Expired" : "Active Prescription"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {rx.doctor?.specialization} •{" "}
                          {rx.doctor?.hospital || "DocAI Clinical Network"}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-xs space-y-0.5 text-slate-500">
                      <div className="flex items-center sm:justify-end gap-1.5 font-medium text-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-sky-600" />
                        <span>Issued: {formatDate(rx.createdAt)}</span>
                      </div>
                      {rx.validUntil && (
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Valid Until: {formatDate(rx.validUntil)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Medications Grid */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <Pill className="h-4 w-4 text-emerald-600" /> Prescribed
                      Medications
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.isArray(rx.medications) &&
                        rx.medications.map((med: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl border border-sky-100 bg-sky-50/30 space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                {med.name}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                {med.dosage}
                              </span>
                            </div>

                            <div className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                              <span>
                                <strong>Frequency:</strong> {med.frequency}
                              </span>
                              <span>•</span>
                              <span>
                                <strong>Duration:</strong> {med.duration}
                              </span>
                            </div>

                            {med.instructions && (
                              <p className="text-xs text-sky-800 italic bg-white p-2 rounded-xl border border-sky-100">
                                Note: "{med.instructions}"
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Doctor Care Instructions */}
                  {rx.careInstructions && (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                      <strong className="text-amber-900 block font-bold">
                        Doctor's Care Advice:
                      </strong>
                      <p className="text-amber-800 leading-relaxed">
                        {rx.careInstructions}
                      </p>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                    <span>Digital License Verified Rx</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.print()}
                      className="text-xs text-sky-700 hover:text-sky-800 hover:bg-sky-50 rounded-xl gap-1"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print this
                      prescription
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
