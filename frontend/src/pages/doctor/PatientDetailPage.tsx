import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FileText, ClipboardList, Stethoscope, Plus,
  FileCheck, ShieldAlert, Calendar, User, Phone, Pill, Download,
  ExternalLink, CheckCircle2, AlertTriangle, Activity, Eye,
  Sparkles, HeartPulse, Clock, Printer, Globe, MessageSquare, Leaf,
} from 'lucide-react';
import { doctorService } from '@/services/doctor.service';
import { chatService } from '@/services/chat.service';
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
      medications: [
        { name: '', dosage: '', frequency: 'Once daily', duration: '5 days' },
      ],
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
        followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-patient-detail', id] });
      success('Clinical Note Saved', 'SOAP Note documented in patient chart.');
      setShowNoteModal(false);
      resetNote();
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
        validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-patient-detail', id] });
      success('Prescription Issued', 'Digital prescription signed and sent to patient.');
      setShowPrescriptionModal(false);
      resetRx();
    },
    onError: (err: any) => {
      error('Failed to issue prescription', err.response?.data?.message || 'Something went wrong');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 text-sm">Accessing Patient EHR Record...</p>
      </div>
    );
  }

  const patient = res?.data?.data;
  if (!patient) {
    return (
      <div className="text-center py-16 rounded-2xl border border-slate-200 bg-white p-8">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Patient Record Not Found</h3>
        <p className="text-slate-500 text-xs mt-1">Unable to locate medical record or unauthorized access.</p>
        <Link to="/doctor/patients" className="mt-4 inline-block text-sky-600 hover:underline text-xs font-semibold">
          Return to Assigned Patients Directory
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      {/* Back button */}
      <div>
        <Link
          to="/doctor/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Assigned Patients
        </Link>
      </div>

      {/* ── Patient Identity Card ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-extrabold text-2xl shadow-sm flex-shrink-0">
              {patient.user?.firstName?.[0]}
              {patient.user?.lastName?.[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {patient.user?.firstName} {patient.user?.lastName}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  MRN: {patient.id.slice(0, 10).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                <span>{patient.user?.email}</span>
                {patient.user?.phone && <span>• {patient.user?.phone}</span>}
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <span className="bg-sky-50 text-sky-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-sky-200">
                  Blood Group: {patient.bloodGroup || 'Unknown'}
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-slate-200">
                  Age: {patient.age ? `${patient.age} yrs` : 'N/A'}
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-slate-200">
                  Gender: {patient.gender || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              onClick={handleOpenChat}
              disabled={isOpeningChat}
              className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs gap-1.5 font-semibold rounded-xl"
              size="sm"
            >
              {isOpeningChat ? <LoadingSpinner size="sm" /> : <MessageSquare className="h-4 w-4 text-sky-600" />}
              Chat with Patient
            </Button>
            <Button
              onClick={() => setShowNoteModal(true)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs gap-1.5 font-semibold rounded-xl"
              size="sm"
            >
              <Plus className="h-4 w-4 text-slate-600" /> Add SOAP Note
            </Button>
            <Button
              onClick={() => setShowPrescriptionModal(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white shadow-sm text-xs gap-1.5 font-semibold rounded-xl"
              size="sm"
            >
              <Pill className="h-4 w-4" /> Issue Digital Rx
            </Button>
          </div>
        </div>

        {/* Clinical Vitals Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-red-50/50 border border-red-100">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" /> Known Allergies
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {patient.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map((a: string, i: number) => (
                  <span key={i} className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-md font-semibold">
                    {a}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-xs">No known drug allergies</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-amber-600" /> Chronic Conditions
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {patient.chronicDiseases && patient.chronicDiseases.length > 0 ? (
                patient.chronicDiseases.map((d: string, i: number) => (
                  <span key={i} className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-md font-medium">
                    {d}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-xs">None documented</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-sky-600" /> Emergency Contact
            </span>
            <p className="text-xs text-slate-600 mt-1.5">
              {patient.emergencyContactName ? (
                <span>
                  <strong>{patient.emergencyContactName}</strong> ({patient.emergencyContactRelation || 'Contact'})<br />
                  <span className="text-sky-700 font-mono font-medium">{patient.emergencyContactPhone}</span>
                </span>
              ) : (
                <span className="text-slate-400">Not provided</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="border-b border-slate-200 flex gap-4 overflow-x-auto pb-1 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('consultations')}
          className={`pb-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'consultations'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="h-4 w-4" /> AI Diagnostics & Reports ({patient.consultations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="h-4 w-4" /> Medical History ({patient.medicalHistory?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'documents'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" /> Scans & Documents ({patient.documents?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'notes'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="h-4 w-4" /> SOAP Notes ({patient.doctorNotes?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'prescriptions'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="h-4 w-4" /> Issued Prescriptions ({patient.prescriptions?.length || 0})
        </button>
      </div>

      {/* ── Tab 1: AI Consultations & Differential Reports ── */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          {(!patient.consultations || patient.consultations.length === 0) ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs bg-white">
              <Stethoscope className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p>No AI consultations or automated symptom assessments recorded for this patient.</p>
            </div>
          ) : (
            patient.consultations.map((c: any) => (
              <div key={c.id} className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-sky-600" />
                      Chief Complaint: {c.chiefComplaint || 'General Symptoms Review'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Consultation Date: {formatDate(c.startedAt)} • Status: {c.status}
                    </p>
                  </div>
                  {c.report?.id && (
                    <Button asChild size="sm" variant="outline" className="border-sky-200 text-sky-700 hover:bg-sky-50 text-xs rounded-xl gap-1.5">
                      <a href={`http://localhost:5000/api/v1/ai/consultation/${c.id}/report/pdf`} target="_blank" rel="noreferrer">
                        <Download className="h-3.5 w-3.5" /> Download PDF Report
                      </a>
                    </Button>
                  )}
                </div>

                {c.report && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sky-900">AI Clinical Summary:</span>
                        {(c.report.tavilyUsed || (c.report.tavilySearchResults && c.report.tavilySearchResults.length > 0)) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                            <Globe className="h-2.5 w-2.5 text-teal-600" /> Verified via Tavily Search
                          </span>
                        )}
                      </div>
                      <p>{c.report.aiSummary || c.report.summary || 'Summary generated through multi-agent triage.'}</p>
                    </div>

                    {/* AI Suggested Home Remedies & Supportive Care (No drug prescriptions) */}
                    {((c.report.homeRemedies && Array.isArray(c.report.homeRemedies) && c.report.homeRemedies.length > 0) ||
                      (c.report.otcSuggestions && Array.isArray(c.report.otcSuggestions) && c.report.otcSuggestions.length > 0)) && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                            <Leaf className="h-3.5 w-3.5 text-emerald-600" /> AI Suggested Home Remedies (घरेलू नुस्खे) & Supportive Care:
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">Non-pharmacological supportive care</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(c.report.homeRemedies || c.report.otcSuggestions).map((rem: any, mIdx: number) => {
                            const isObj = typeof rem === 'object' && rem !== null;
                            const title = isObj ? rem.remedy || rem.name : String(rem).split(':')[0];
                            const benefit = isObj ? rem.benefit || rem.purpose : '';
                            const prep = isObj ? rem.preparation || rem.dosageGuide : String(rem);

                            return (
                              <div key={mIdx} className="p-2.5 rounded-lg bg-white border border-emerald-100 text-xs space-y-1 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900">{title}</span>
                                  {isObj && rem.frequency && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                      {rem.frequency}
                                    </span>
                                  )}
                                </div>
                                {benefit && (
                                  <p className="text-[11px] text-slate-600">Benefit: {benefit}</p>
                                )}
                                <p className="text-[11px] text-emerald-800">Care: {prep}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border ${
                        c.report.riskLevel === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                        c.report.riskLevel === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        c.report.riskLevel === 'MODERATE' || c.report.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        Risk Level: {c.report.riskLevel || 'LOW'}
                      </span>
                      {c.report.confidenceScore && (
                        <span className="text-slate-500">
                          Confidence: <strong className="text-slate-800">{(c.report.confidenceScore * 100).toFixed(0)}%</strong>
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

      {/* ── Tab 2: Medical History ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {(!patient.medicalHistory || patient.medicalHistory.length === 0) ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs bg-white">
              <ClipboardList className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p>No past medical history recorded in the patient chart.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
              {patient.medicalHistory.map((item: any) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[31px] top-2 h-3.5 w-3.5 rounded-full bg-sky-600 ring-4 ring-white" />
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-slate-900">{item.conditionName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                        {item.conditionType}
                      </span>
                    </div>
                    {item.description && <p className="text-xs text-slate-600 mt-1">{item.description}</p>}
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

      {/* ── Tab 3: Uploaded Documents ── */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {(!patient.documents || patient.documents.length === 0) ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs bg-white">
              <FileText className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p>No lab reports, scans, or disease photos uploaded by the patient.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {patient.documents.map((doc: any) => {
                const isImage = doc.mimeType?.startsWith('image/');

                return (
                  <div key={doc.id} className="p-4 rounded-2xl border border-slate-200/80 bg-white flex flex-col justify-between shadow-xs hover:border-sky-300 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 uppercase">
                          {doc.documentType}
                        </span>
                        <span className="text-[11px] text-slate-400">{formatDate(doc.uploadedAt)}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate">{doc.originalName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">MIME: {doc.mimeType}</p>

                      {isImage && (
                        <div className="mt-3 h-32 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                          <img
                            src={doc.storageUrl || '#'}
                            alt={doc.originalName}
                            className="h-full w-full object-cover hover:scale-105 transition-transform"
                            onError={(e: any) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                      <Button asChild size="sm" variant="outline" className="border-slate-200 text-sky-700 hover:bg-sky-50 text-xs rounded-xl gap-1.5">
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
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs bg-white">
              <FileCheck className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p>No physician SOAP notes recorded for this patient.</p>
            </div>
          ) : (
            patient.doctorNotes.map((note: any) => (
              <div key={note.id} className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-sky-900">Clinical SOAP Entry ({note.noteType})</h4>
                  <span className="text-xs text-slate-400">{formatDate(note.createdAt)}</span>
                </div>
                {note.diagnosis && (
                  <p className="text-xs text-slate-800 font-semibold">Diagnosis: {note.diagnosis}</p>
                )}
                <p className="text-xs text-slate-600 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab 5: Issued Prescriptions ── */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {(!patient.prescriptions || patient.prescriptions.length === 0) ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs bg-white">
              <Pill className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p>No prescriptions issued to this patient yet.</p>
            </div>
          ) : (
            patient.prescriptions.map((rx: any) => {
              const meds = Array.isArray(rx.medications) ? rx.medications : [];

              return (
                <div key={rx.id} className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Pill className="h-4 w-4 text-sky-600" />
                        Prescription #{rx.id.slice(0, 8).toUpperCase()}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Issued: {formatDate(rx.createdAt)} {rx.validUntil ? `• Valid until: ${formatDate(rx.validUntil)}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => window.print()} className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl gap-1.5">
                      <Printer className="h-3.5 w-3.5" /> Print Rx
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Prescribed Medications:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {meds.map((m: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <p className="font-bold text-slate-900">{m.name}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Dosage: {m.dosage} • {m.frequency} • {m.duration}
                          </p>
                          {m.instructions && (
                            <p className="text-sky-800 text-[11px] mt-0.5 italic">"{m.instructions}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {rx.careInstructions && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <strong className="text-slate-900">Physician Care Instructions:</strong> {rx.careInstructions}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="h-4 w-4 text-sky-600" /> Add SOAP Clinical Note
            </h3>
            <p className="text-xs text-slate-500 mb-4">Record physician observation, assessment, and care plan.</p>

            <form onSubmit={handleSubmitNote((data) => addNoteMutation.mutate(data))} className="space-y-3.5">
              <div>
                <Label className="text-xs text-slate-700">Diagnosis</Label>
                <Input
                  className="bg-white border-slate-200 text-slate-900 text-xs mt-1 rounded-xl"
                  placeholder="e.g. Acute Pharyngitis"
                  {...registerNote('diagnosis')}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-700">Clinical Findings / Notes</Label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-xs text-slate-900 mt-1 focus:outline-none focus:border-sky-500"
                  placeholder="Subjective complaints, objective physical examination, assessment..."
                  required
                  {...registerNote('content')}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNoteModal(false)} className="border-slate-200 text-slate-700 rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs rounded-xl" disabled={isSubmittingNote}>
                  {isSubmittingNote ? 'Saving...' : 'Save to EHR'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Issue Digital Prescription ── */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-2xl w-full rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Pill className="h-4 w-4 text-sky-600" /> Digital Prescription Pad (Rx)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Prescribe verified medications directly to patient's dashboard.</p>

            <form onSubmit={handleSubmitRx((data) => addRxMutation.mutate(data))} className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Medications List</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => append({ name: '', dosage: '', frequency: 'Once daily', duration: '7 days' })}
                    className="border-slate-200 text-sky-700 text-xs rounded-xl"
                  >
                    + Add Medication
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <Label className="text-[11px] text-slate-600">Medicine Name</Label>
                        <Input
                          className="bg-white border-slate-200 text-slate-900 text-xs mt-1 rounded-xl"
                          placeholder="e.g. Amoxicillin 500mg"
                          required
                          {...registerRx(`medications.${index}.name` as const)}
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600">Dosage</Label>
                        <Input
                          className="bg-white border-slate-200 text-slate-900 text-xs mt-1 rounded-xl"
                          placeholder="e.g. 1 Tablet"
                          required
                          {...registerRx(`medications.${index}.dosage` as const)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <Label className="text-[11px] text-slate-600">Frequency</Label>
                        <Input
                          className="bg-white border-slate-200 text-slate-900 text-xs mt-1 rounded-xl"
                          placeholder="e.g. Twice daily after meals"
                          required
                          {...registerRx(`medications.${index}.frequency` as const)}
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-600">Duration</Label>
                        <Input
                          className="bg-white border-slate-200 text-slate-900 text-xs mt-1 rounded-xl"
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
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          Remove Medication
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-xs text-slate-700">Care Instructions & Advice</Label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-xs text-slate-900 mt-1 focus:outline-none focus:border-sky-500"
                  placeholder="Drink plenty of water, avoid citrus foods, complete the full antibiotic course."
                  {...registerRx('instructions')}
                />
              </div>

              <div>
                <Label className="text-xs text-slate-700">Prescription Validity Until</Label>
                <Input
                  type="date"
                  className="bg-white border-slate-200 text-slate-900 text-xs mt-1 rounded-xl"
                  {...registerRx('validUntil')}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPrescriptionModal(false)} className="border-slate-200 text-slate-700 rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl" disabled={isSubmittingRx}>
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
