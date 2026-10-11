import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FileText, ClipboardList, Stethoscope, Plus,
  FileCheck, ShieldAlert, Calendar, User, Phone, Pill, Download,
  ExternalLink, CheckCircle2, AlertTriangle, Activity, Eye,
  Sparkles, HeartPulse, Clock, Printer, Globe, MessageSquare
} from 'lucide-react';
import { doctorService } from '@/services/doctor.service';
import { chatService } from '@/services/chat.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToast } from '@/store/notificationStore';
import { formatDate } from '@/lib/utils';

export default function DoctorPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'consultations' | 'history' | 'documents' | 'notes' | 'prescriptions'>('consultations');

  // Modals state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  const handleOpenChat = async () => {
    setIsOpeningChat(true);
    try {
      const chatRes = await chatService.getOrCreateRoom(id!);
      const room = chatRes.data?.data;
      if (room?.id) {
        navigate(`/doctor/chat?roomId=${room.id}`);
      } else {
        navigate('/doctor/chat');
      }
    } catch {
      navigate('/doctor/chat');
    } finally {
      setIsOpeningChat(false);
    }
  };

  // Load Patient Detail
  const { data: res, isLoading } = useQuery({
    queryKey: ['doctor-patient-detail', id],
    queryFn: () => doctorService.getPatientDetail(id!),
    enabled: !!id,
  });

  // Note Form
  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    reset: resetNote,
    formState: { isSubmitting: isSubmittingNote },
  } = useForm({
    defaultValues: {
      noteType: 'SOAP',
      content: '',
      diagnosis: '',
      icdCodes: '',
      followUpDate: '',
    },
  });

  // Prescription Form
  const {
    register: registerRx,
    control: controlRx,
    handleSubmit: handleSubmitRx,
    reset: resetRx,
    formState: { isSubmitting: isSubmittingRx },
  } = useForm({
    defaultValues: {
      instructions: '',
      validUntil: '',
      medications: [{ name: '', dosage: '', frequency: 'Once daily', duration: '7 days' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: controlRx,
    name: 'medications',
  });

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: (data: any) =>
      doctorService.addNote(id!, {
        noteType: data.noteType,
        content: data.content,
        diagnosis: data.diagnosis || undefined,
        icdCodes: data.icdCodes ? data.icdCodes.split(',').map((s: string) => s.trim()) : undefined,
        followUpDate: data.followUpDate && data.followUpDate.trim() ? new Date(data.followUpDate).toISOString() : undefined,
      }),
    onSuccess: () => {
      success('Clinical note added to EHR successfully');
      setShowNoteModal(false);
      resetNote();
      queryClient.invalidateQueries({ queryKey: ['doctor-patient-detail', id] });
    },
    onError: (err: any) => {
      error('Failed to save note', err.response?.data?.message || 'Something went wrong');
    },
  });

  // Add Prescription Mutation
  const addRxMutation = useMutation({
    mutationFn: (data: any) =>
      doctorService.addPrescription(id!, {
        medications: data.medications,
        instructions: data.instructions || undefined,
        validUntil: data.validUntil && data.validUntil.trim() ? new Date(data.validUntil).toISOString() : undefined,
      }),
    onSuccess: () => {
      success('Official prescription signed and saved');
      setShowPrescriptionModal(false);
      resetRx();
      queryClient.invalidateQueries({ queryKey: ['doctor-patient-detail', id] });
    },
    onError: (err: any) => {
      error('Failed to issue prescription', err.response?.data?.message || 'Something went wrong');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-slate-400 text-sm">Accessing Patient EHR Record...</p>
      </div>
    );
  }

  const patient = res?.data?.data;
  if (!patient) {
    return (
      <div className="text-center py-16 rounded-2xl border border-slate-800 bg-[#0B152F]/70 p-8">
        <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Patient Record Not Found</h3>
        <p className="text-slate-400 text-xs mt-1">Unable to locate medical record or unauthorized access.</p>
        <Link to="/doctor/patients" className="mt-4 inline-block text-cyan-400 hover:underline text-xs font-semibold">
          Return to Assigned Patients Directory
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-7xl mx-auto text-slate-100"
    >
      {/* Back button */}
      <div>
        <Link
          to="/doctor/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Assigned Patients Directory
        </Link>
      </div>

      {/* ── Patient Header: Clinical EHR Identity ── */}
      <div className="rounded-2xl border border-slate-800 bg-[#0B152F]/80 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center font-extrabold text-2xl text-white shadow-lg shadow-cyan-950/60 flex-shrink-0">
              {patient.user?.firstName?.[0]}
              {patient.user?.lastName?.[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  {patient.user?.firstName} {patient.user?.lastName}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono">
                  MRN: {patient.id.slice(0, 10).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                <span>{patient.user?.email}</span>
                {patient.user?.phone && <span>• {patient.user?.phone}</span>}
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <span className="bg-cyan-950/80 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-cyan-800/60">
                  Blood Group: {patient.bloodGroup || 'Unknown'}
                </span>
                <span className="bg-slate-800/80 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-slate-700">
                  Age: {patient.age ? `${patient.age} yrs` : 'N/A'}
                </span>
                <span className="bg-slate-800/80 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-slate-700">
                  Gender: {patient.gender || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              onClick={handleOpenChat}
              disabled={isOpeningChat}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs gap-1.5 font-semibold"
              size="sm"
            >
              {isOpeningChat ? <LoadingSpinner size="sm" /> : <MessageSquare className="h-4 w-4 text-cyan-400" />}
              Chat with Patient
            </Button>
            <Button
              onClick={() => setShowNoteModal(true)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs gap-1.5 font-semibold"
              size="sm"
            >
              <Plus className="h-4 w-4 text-cyan-400" /> Add SOAP Note
            </Button>
            <Button
              onClick={() => setShowPrescriptionModal(true)}
              className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white shadow-lg shadow-cyan-950/60 text-xs gap-1.5 font-semibold"
              size="sm"
            >
              <Pill className="h-4 w-4" /> Issue Digital Rx
            </Button>
          </div>
        </div>

        {/* Clinical Vitals & Flags Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> Known Allergies
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {patient.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map((a: string, i: number) => (
                  <span key={i} className="bg-red-950/80 text-red-300 text-xs px-2 py-0.5 rounded-md font-semibold border border-red-800/60">
                    {a}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs">No known drug allergies</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5" /> Chronic Conditions
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {patient.chronicDiseases && patient.chronicDiseases.length > 0 ? (
                patient.chronicDiseases.map((d: string, i: number) => (
                  <span key={i} className="bg-amber-950/80 text-amber-300 text-xs px-2 py-0.5 rounded-md font-medium border border-amber-800/60">
                    {d}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs">None documented</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-cyan-400" /> Emergency Contact
            </span>
            <p className="text-xs text-slate-300 mt-1.5">
              {patient.emergencyContactName ? (
                <span>
                  <strong>{patient.emergencyContactName}</strong> ({patient.emergencyContactRelation || 'Contact'})<br />
                  <span className="text-cyan-400 font-mono">{patient.emergencyContactPhone}</span>
                </span>
              ) : (
                <span className="text-slate-400">Not provided</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="border-b border-slate-800 flex gap-4 overflow-x-auto pb-1 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('consultations')}
          className={`pb-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'consultations'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Stethoscope className="h-4 w-4" /> AI Diagnostics & Reports ({patient.consultations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="h-4 w-4" /> Medical History ({patient.medicalHistory?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" /> Scans & Disease Images ({patient.documents?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notes'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="h-4 w-4" /> SOAP Notes ({patient.doctorNotes?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'prescriptions'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Pill className="h-4 w-4" /> Issued Prescriptions ({patient.prescriptions?.length || 0})
        </button>
      </div>

      {/* ── Tab 1: AI Consultations & Differential Reports ── */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          {(!patient.consultations || patient.consultations.length === 0) ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
              <Stethoscope className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p>No AI consultations or automated symptom assessments recorded for this patient.</p>
            </div>
          ) : (
            patient.consultations.map((c: any) => (
              <div key={c.id} className="p-5 rounded-2xl border border-slate-800 bg-[#0B152F]/70 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      Chief Complaint: {c.chiefComplaint || 'General Symptoms Review'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Consultation Date: {formatDate(c.startedAt)} • Status: {c.status}
                    </p>
                  </div>
                  {c.report?.id && (
                    <Button asChild size="sm" variant="outline" className="border-cyan-800 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900 text-xs gap-1.5">
                      <a href={`http://localhost:5000/api/v1/ai/consultation/${c.id}/report/pdf`} target="_blank" rel="noreferrer">
                        <Download className="h-3.5 w-3.5" /> Download PDF Report
                      </a>
                    </Button>
                  )}
                </div>

                {c.report && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-cyan-400">AI Clinical Summary:</span>
                        {(c.report.tavilyUsed || (c.report.tavilySearchResults && c.report.tavilySearchResults.length > 0)) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-teal-950 text-teal-300 rounded border border-teal-800">
                            <Globe className="h-2.5 w-2.5 text-teal-400" /> Tavily Search Verified
                          </span>
                        )}
                      </div>
                      <p>{c.report.aiSummary || c.report.summary || 'Summary generated through multi-agent LangGraph triage.'}</p>
                    </div>

                    {/* AI Suggested Medications & OTC Relief */}
                    {c.report.otcSuggestions && Array.isArray(c.report.otcSuggestions) && c.report.otcSuggestions.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-[#081024] border border-cyan-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                            <Pill className="h-3.5 w-3.5 text-teal-400" /> AI Suggested Medications (Evidence-Based):
                          </span>
                          <span className="text-[10px] text-slate-400">Review before prescribing</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {c.report.otcSuggestions.map((med: any, mIdx: number) => {
                            const isObj = typeof med === 'object' && med !== null;
                            const mName = isObj ? med.name : String(med).split(':')[0];
                            const mDosage = isObj ? med.dosageGuide : String(med);
                            return (
                              <div key={mIdx} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-white">{mName}</span>
                                  {isObj && med.type && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                                      {med.type}
                                    </span>
                                  )}
                                </div>
                                {isObj && med.purpose && (
                                  <p className="text-[11px] text-slate-400">Indication: {med.purpose}</p>
                                )}
                                <p className="text-[11px] text-cyan-200/90">Guide: {mDosage}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border ${
                        c.report.riskLevel === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-700' :
                        c.report.riskLevel === 'HIGH' ? 'bg-orange-950 text-orange-300 border-orange-700' :
                        c.report.riskLevel === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                        'bg-emerald-950 text-emerald-300 border-emerald-700'
                      }`}>
                        Risk Level: {c.report.riskLevel || 'LOW'}
                      </span>
                      {c.report.confidenceScore && (
                        <span className="text-slate-400">
                          Confidence: <strong>{(c.report.confidenceScore * 100).toFixed(0)}%</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab 2: Medical History Timeline ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {(!patient.medicalHistory || patient.medicalHistory.length === 0) ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
              <ClipboardList className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p>No past medical history recorded in the patient chart.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
              {patient.medicalHistory.map((item: any) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-cyan-400 ring-4 ring-[#0B152F]" />
                  <div className="p-4 rounded-xl border border-slate-800 bg-[#0B152F]/70">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-white">{item.conditionName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                        {item.conditionType}
                      </span>
                    </div>
                    {item.description && <p className="text-xs text-slate-300 mt-1">{item.description}</p>}
                    <p className="text-[11px] text-slate-400 mt-2">
                      Diagnosed: {formatDate(item.diagnosedAt || item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Uploaded Scans & Disease Images Gallery ── */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {(!patient.documents || patient.documents.length === 0) ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
              <FileText className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p>No lab reports, scans, or disease photos uploaded by the patient.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {patient.documents.map((doc: any) => {
                const isImage = doc.mimeType?.startsWith('image/');

                return (
                  <div key={doc.id} className="p-4 rounded-2xl border border-slate-800 bg-[#0B152F]/70 flex flex-col justify-between group hover:border-cyan-700/60 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 uppercase">
                          {doc.documentType}
                        </span>
                        <span className="text-[11px] text-slate-400">{formatDate(doc.uploadedAt)}</span>
                      </div>
                      <p className="text-sm font-bold text-white truncate">{doc.originalName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">MIME: {doc.mimeType}</p>

                      {isImage && (
                        <div className="mt-3 h-32 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                          <img
                            src={doc.storageUrl || '#'}
                            alt={doc.originalName}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e: any) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                      <Button asChild size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-cyan-300 hover:bg-slate-700 text-xs gap-1.5">
                        <a href={doc.storageUrl || '#'} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> View File
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: SOAP Notes ── */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {(!patient.doctorNotes || patient.doctorNotes.length === 0) ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
              <FileCheck className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p>No physician SOAP notes recorded for this patient.</p>
            </div>
          ) : (
            patient.doctorNotes.map((note: any) => (
              <div key={note.id} className="p-5 rounded-2xl border border-slate-800 bg-[#0B152F]/70 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-cyan-300">Clinical SOAP Entry ({note.noteType})</h4>
                  <span className="text-xs text-slate-400">{formatDate(note.createdAt)}</span>
                </div>
                {note.diagnosis && (
                  <p className="text-xs text-white font-semibold">Diagnosis: {note.diagnosis}</p>
                )}
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab 5: Issued Prescriptions ── */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {(!patient.prescriptions || patient.prescriptions.length === 0) ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
              <Pill className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p>No prescriptions issued to this patient yet.</p>
            </div>
          ) : (
            patient.prescriptions.map((rx: any) => {
              const meds = Array.isArray(rx.medications) ? rx.medications : [];

              return (
                <div key={rx.id} className="p-5 rounded-2xl border border-slate-800 bg-[#0B152F]/70 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Pill className="h-4 w-4 text-cyan-400" />
                        Prescription #{rx.id.slice(0, 8).toUpperCase()}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Issued: {formatDate(rx.createdAt)} {rx.validUntil ? `• Valid until: ${formatDate(rx.validUntil)}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => window.print()} className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs gap-1.5">
                      <Printer className="h-3.5 w-3.5" /> Print Rx
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Prescribed Medications:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {meds.map((m: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                          <p className="font-bold text-white">{m.name}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            Dosage: {m.dosage} • {m.frequency} • {m.duration}
                          </p>
                          {m.instructions && (
                            <p className="text-cyan-300 text-[11px] mt-0.5 italic">"{m.instructions}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {rx.careInstructions && (
                    <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300">
                      <strong className="text-slate-200">Physician Care Instructions:</strong> {rx.careInstructions}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Modal: Add SOAP Clinical Note ── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full rounded-2xl border border-slate-700 bg-[#0B152F] text-slate-100 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="h-4 w-4 text-cyan-400" /> Add SOAP Clinical Note
            </h3>
            <p className="text-xs text-slate-400 mb-4">Record physician observation, assessment, and care plan.</p>

            <form onSubmit={handleSubmitNote((data) => addNoteMutation.mutate(data))} className="space-y-3.5">
              <div>
                <Label className="text-xs text-slate-300">Diagnosis</Label>
                <Input
                  className="bg-slate-900 border-slate-700 text-white text-xs mt-1"
                  placeholder="e.g. Acute Pharyngitis"
                  {...registerNote('diagnosis')}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300">Clinical Findings / Notes</Label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                  placeholder="Subjective complaints, objective physical examination, assessment..."
                  required
                  {...registerNote('content')}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNoteModal(false)} className="border-slate-700 bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs" disabled={isSubmittingNote}>
                  {isSubmittingNote ? 'Saving...' : 'Save to EHR'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Issue Digital Prescription ── */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-2xl w-full rounded-2xl border border-slate-700 bg-[#0B152F] text-slate-100 shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Pill className="h-4 w-4 text-cyan-400" /> Digital Prescription Pad (Rx)
            </h3>
            <p className="text-xs text-slate-400 mb-4">Prescribe verified medications directly to patient's dashboard.</p>

            <form onSubmit={handleSubmitRx((data) => addRxMutation.mutate(data))} className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Medications List</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => append({ name: '', dosage: '', frequency: 'Once daily', duration: '7 days' })}
                    className="border-slate-700 bg-slate-800 text-cyan-300 text-xs"
                  >
                    + Add Medication
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <Label className="text-[11px] text-slate-400">Medicine Name</Label>
                        <Input
                          className="bg-slate-900 border-slate-700 text-white text-xs mt-1"
                          placeholder="e.g. Amoxicillin 500mg"
                          required
                          {...registerRx(`medications.${index}.name` as const)}
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">Dosage</Label>
                        <Input
                          className="bg-slate-900 border-slate-700 text-white text-xs mt-1"
                          placeholder="e.g. 1 Tablet"
                          required
                          {...registerRx(`medications.${index}.dosage` as const)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <Label className="text-[11px] text-slate-400">Frequency</Label>
                        <Input
                          className="bg-slate-900 border-slate-700 text-white text-xs mt-1"
                          placeholder="e.g. Twice daily after meals"
                          required
                          {...registerRx(`medications.${index}.frequency` as const)}
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">Duration</Label>
                        <Input
                          className="bg-slate-900 border-slate-700 text-white text-xs mt-1"
                          placeholder="e.g. 5 days"
                          required
                          {...registerRx(`medications.${index}.duration` as const)}
                        />
                      </div>
                    </div>

                    {fields.length > 1 && (
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remove Medication
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-xs text-slate-300">Care Instructions & Advice</Label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                  placeholder="Drink plenty of water, avoid citrus foods, complete the full antibiotic course."
                  {...registerRx('instructions')}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300">Prescription Validity Until</Label>
                <Input
                  type="date"
                  className="bg-slate-900 border-slate-700 text-white text-xs mt-1"
                  {...registerRx('validUntil')}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPrescriptionModal(false)} className="border-slate-700 bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-gradient-to-r from-cyan-600 to-teal-500 text-white text-xs font-semibold" disabled={isSubmittingRx}>
                  {isSubmittingRx ? 'Signing Rx...' : 'Sign & Issue Prescription'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

