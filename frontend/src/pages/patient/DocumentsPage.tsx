import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { patientService } from "@/services/patient.service";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  Eye,
  CheckCircle2,
  Plus,
  Sparkles,
  FolderUp,
  ShieldCheck,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";

const DOC_TYPES = [
  { value: "PRESCRIPTION", label: "Prescriptions" },
  { value: "LAB_REPORT", label: "Lab Reports" },
  { value: "X_RAY", label: "X-Rays & Imaging" },
  { value: "SKIN_IMAGE", label: "Disease Photos" },
  { value: "BLOOD_REPORT", label: "Blood Tests" },
  { value: "OTHER", label: "Other Records" },
];

export default function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState("PRESCRIPTION");
  const [filterType, setFilterType] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const { success, error } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["patient-documents", filterType],
    queryFn: () =>
      patientService.getDocuments(
        filterType ? { documentType: filterType } : {},
      ),
  });

  const documents = data?.data?.data || [];

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => patientService.uploadDocument(formData),
    onSuccess: () => {
      success(
        "Document Uploaded",
        "Your medical record was securely saved and linked to your chart.",
      );
      queryClient.invalidateQueries({ queryKey: ["patient-documents"] });
    },
    onError: () =>
      error("Upload failed", "Please verify file size (max 50 MB) and format."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientService.deleteDocument(id),
    onSuccess: () => {
      success("Deleted", "Document safely removed from your records.");
      queryClient.invalidateQueries({ queryKey: ["patient-documents"] });
    },
    onError: () => error("Error", "Unable to delete document."),
  });

  const handleUploadFile = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", selectedType);
    uploadMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Medical Documents & Scans
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store and manage prescriptions, blood test results, X-rays, and
            disease photos securely.
          </p>
        </div>
      </div>

      {/* ── Modern Drag-and-Drop Upload Card ── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-3xl border-2 border-dashed p-7 text-center transition-all bg-white ${
          isDragging
            ? "border-sky-500 bg-sky-50/50 scale-[1.01]"
            : "border-sky-200 hover:border-sky-300"
        }`}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-sm">
            <FolderUp className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Upload Health Record or Photo
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag and drop your file here, or select category and browse files.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 rounded-xl border border-sky-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  Category: {t.label}
                </option>
              ))}
            </select>

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 gap-2 h-10 px-5"
            >
              {uploadMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploadMutation.isPending ? "Uploading..." : "Browse File"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.dicom"
              onChange={handleFileChange}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Supported formats: PDF, JPG, PNG, WEBP (Up to 50 MB)
          </p>
        </div>
      </div>

      {/* ── Category Filter Bar ── */}
      <div className="flex gap-2 flex-wrap items-center">
        <Button
          variant={filterType === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("")}
          className={`text-xs rounded-xl ${filterType === "" ? "bg-sky-600 text-white font-bold" : "border-sky-200 text-slate-700"}`}
        >
          All Documents ({documents.length})
        </Button>
        {DOC_TYPES.map((t) => (
          <Button
            key={t.value}
            variant={filterType === t.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(t.value)}
            className={`text-xs rounded-xl ${filterType === t.value ? "bg-sky-600 text-white font-bold" : "border-sky-200 text-slate-700"}`}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* ── Documents Gallery ── */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-16 gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-500">
            Loading your medical files...
          </p>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-sky-200 bg-white p-12 text-center space-y-2">
          <FileText className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            No documents found in this category
          </p>
          <p className="text-xs text-slate-500">
            Upload your prescriptions or lab tests to store them safely.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc: any) => {
            const isImage = doc.mimeType?.startsWith("image/");

            return (
              <div
                key={doc.id}
                className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                      {DOC_TYPES.find((t) => t.value === doc.documentType)
                        ?.label || doc.documentType}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(doc.uploadedAt)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sky-600 flex-shrink-0">
                      {isImage ? (
                        <ImageIcon className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {doc.originalName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatFileSize(Number(doc.fileSizeBytes || 0))}
                      </p>
                    </div>
                  </div>

                  {isImage && (
                    <div className="mt-3.5 h-36 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                      <img
                        src={doc.storageUrl || "#"}
                        alt={doc.originalName}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e: any) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs rounded-xl border-sky-200 text-sky-800 hover:bg-sky-50 gap-1.5"
                  >
                    <a
                      href={doc.storageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Document
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0"
                    onClick={() => deleteMutation.mutate(doc.id)}
                    disabled={deleteMutation.isPending}
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
