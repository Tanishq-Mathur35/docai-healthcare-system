import React, { useState } from 'react';
import {
  Clock,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Pill,
  CheckCircle2,
  Upload,
  Sparkles,
  Stethoscope,
  ChevronRight,
  Info,
  HelpCircle,
  Eye,
  RefreshCw,
  Printer
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToast } from '@/store/notificationStore';
import {
  clinicalToolsService,
  TwoMinuteDoctorSummary,
} from '@/services/clinicalTools.service';

export default function TwoMinuteDoctorPage() {
  const { toast, error: toastError, success: toastSuccess } = useToast();

  const [complaint, setComplaint] = useState(
    'Chest discomfort and burning for past 3 days, feeling breathless when climbing stairs. Taking some white tablet from previous clinic.'
  );
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<{ [index: number]: string }>({});
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [documentsText, setDocumentsText] = useState(
    'Clinic 1 Rx (12-Jan-2024): Dr. Mehta - Tab Pantoprazole 40 OD, Tab Ecosprin 75 OD. Patient reported Penicillin allergy (developed urticaria in 2021). Clinic 2 Rx (15-Mar-2024): Tab Metoprolol 25 BD for hypertension. Lab: Hb 11.2, Blood Sugar Random 168 mg/dL.'
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<TwoMinuteDoctorSummary | null>(null);

  // Handle generating adaptive follow-up questions
  const handleFetchQuestions = async () => {
    if (!complaint.trim()) {
      toastError('Complaint Required', 'Please enter the patient’s chief complaint first.');
      return;
    }
    setIsGeneratingQuestions(true);
    try {
      const res = await clinicalToolsService.getTwoMinuteDoctorQuestions(complaint);
      const qList = res.data?.data?.questions || [];
      setQuestions(qList);
      toastSuccess('Questions Generated', 'Answer these while the patient waits in the queue.');
    } catch (err: any) {
      toastError('Failed to generate questions', err.response?.data?.message || err.message);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  // Submit for 60-second summary
  const handleSummarize = async () => {
    if (!complaint.trim() && selectedFiles.length === 0 && !documentsText.trim()) {
      toastError('Input required', 'Provide a complaint or documents to summarize.');
      return;
    }

    setIsSummarizing(true);
    const formData = new FormData();
    formData.append('complaint', complaint);
    formData.append('documentsText', documentsText);

    const followUpList = questions.map((q, idx) => ({
      question: q,
      answer: answers[idx] || 'Not answered',
    }));
    formData.append('followUpAnswers', JSON.stringify(followUpList));

    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await clinicalToolsService.summarizeTwoMinuteDoctor(formData);
      setSummaryResult(res.data?.data);
      toastSuccess('OPD Summary Ready', '60-second high-density clinical briefing prepared.');
    } catch (err: any) {
      toastError('Error generating summary', err.response?.data?.message || err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Scene Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold mb-3">
              <Clock className="w-3.5 h-3.5" /> T01 · Clinical Pre-Consultation Assistant
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              The Two-Minute Doctor
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed">
              Designed for high-volume Indian OPDs (140+ patients). Synthesizes crumpled prescriptions, clinic notes, and blurry photos into a source-linked 60-second summary so the physician can examine the patient, not read paperwork.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> No Diagnostic Bias
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Patient Waiting Queue Intake ── */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                1. Patient Waiting Room Intake
              </CardTitle>
              <CardDescription>
                Record patient complaint by voice or text while in the OPD queue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chief Complaint & Duration
                </label>
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  rows={3}
                  className="w-full text-sm rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. Ramesh, 52, reports chest pain and burning for 3 days, can't remember white tablet name..."
                />
              </div>

              {/* Adaptive Questions Button */}
              <div>
                <Button
                  onClick={handleFetchQuestions}
                  disabled={isGeneratingQuestions || !complaint.trim()}
                  variant="outline"
                  className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold py-2"
                >
                  {isGeneratingQuestions ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {questions.length > 0 ? 'Regenerate Adaptive Follow-up Questions' : 'Generate Adaptive Follow-up Questions'}
                </Button>
              </div>

              {/* Questions List */}
              {questions.length > 0 && (
                <div className="space-y-3 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    Adaptive Follow-Up Questions (Waiting Room)
                  </p>
                  {questions.map((q, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs font-medium text-slate-700">{idx + 1}. {q}</p>
                      <input
                        type="text"
                        value={answers[idx] || ''}
                        onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                        placeholder="Patient answer..."
                        className="w-full text-xs bg-white rounded-md border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paperwork Upload Card */}
          <Card className="border border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-indigo-600" />
                2. Crumpled Paperwork & Photos
              </CardTitle>
              <CardDescription>
                Upload previous clinic prescriptions, lab sheets, discharge notes, or blurry photos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Upload Prescriptions / Lab Reports
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50/50 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-medium">
                    Upload images (JPG/PNG) or PDFs
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="mt-2 text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {selectedFiles.length > 0 && (
                    <p className="mt-2 text-xs text-emerald-600 font-semibold">
                      {selectedFiles.length} file(s) attached
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Or Paste Document Text / Clinical Notes
                </label>
                <textarea
                  value={documentsText}
                  onChange={(e) => setDocumentsText(e.target.value)}
                  rows={4}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
                  placeholder="Paste OCR text from prescriptions or discharge slips..."
                />
              </div>

              <Button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-2.5 shadow-md shadow-indigo-600/20"
              >
                {isSummarizing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Reading Paperwork & Timeline...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Generate 60-Second OPD Summary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: 60-Second Doctor Briefing Screen ── */}
        <div className="lg:col-span-7">
          {isSummarizing && (
            <Card className="border border-slate-200/80 shadow-sm bg-white p-12 text-center">
              <LoadingSpinner size="lg" className="mx-auto text-indigo-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">
                Scanning Documents & Synthesizing Timeline...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Extracting previous clinic dates, matching medication names, detecting contradictions and penicillin/NSAID allergies.
              </p>
            </Card>
          )}

          {!isSummarizing && !summaryResult && (
            <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center bg-slate-50/50 flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">60-Second OPD Workstation Ready</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Enter the patient's complaint and paperwork on the left, then click <strong>"Generate 60-Second OPD Summary"</strong> to produce the physician's one-screen briefing.
              </p>
            </div>
          )}

          {!isSummarizing && summaryResult && (
            <div className="space-y-4">
              {/* Doctor Briefing Header Card */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                      OPD Fast-Track Briefing
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Read Time: ~{summaryResult.estimatedReadTimeSeconds}s
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white mt-1">
                    Patient Clinical Profile & Document Synthesis
                  </h2>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Sheet
                </button>
              </div>

              {/* ── CRITICAL RED FLAGS (E.g. Penicillin Allergy) ── */}
              {summaryResult.redFlags && summaryResult.redFlags.length > 0 && (
                <div className="rounded-xl border-2 border-rose-500/80 bg-rose-50 p-4 shadow-sm animate-pulse-slow">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-extrabold text-rose-900 uppercase tracking-wide">
                        ⚠️ Critical Clinical Red Flags & Documented Allergies
                      </h3>
                      <div className="mt-2 space-y-1.5">
                        {summaryResult.redFlags.map((rf, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-white/90 p-2 rounded-lg border border-rose-200 gap-1"
                          >
                            <span className="font-bold text-rose-800">{rf.flag}</span>
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Source: {rf.source}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CONTRADICTIONS & GAPS (Patient Recall vs Paperwork) ── */}
              {summaryResult.contradictionsAndGaps && summaryResult.contradictionsAndGaps.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-amber-900">
                        Discrepancies, Timeline Gaps & Contradictions
                      </h3>
                      <div className="mt-2 space-y-2">
                        {summaryResult.contradictionsAndGaps.map((cg, idx) => (
                          <div key={idx} className="text-xs bg-white p-2.5 rounded-lg border border-amber-200">
                            <p className="font-bold text-amber-800">{cg.issue}</p>
                            <p className="text-slate-600 mt-0.5">{cg.details}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              Verification: {cg.sourceComparison}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 30-Second Bulleted OPD Briefing ── */}
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    30-Second OPD Summary Bullets
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside font-medium leading-relaxed">
                    {summaryResult.quickOpdSummary.map((item, idx) => (
                      <li key={idx} className="marker:text-indigo-600">
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* ── Chronological Medical Timeline (Dated) ── */}
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Dated Medical History & Prescription Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="relative border-l-2 border-indigo-200 ml-3 pl-4 space-y-4">
                    {summaryResult.timeline.map((event, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-indigo-900">{event.date}</span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {event.facilityOrDoctor}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1">{event.event}</p>
                          {event.medicationsMentioned && event.medicationsMentioned.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {event.medicationsMentioned.map((med, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100/70 text-indigo-800"
                                >
                                  {med}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                            📄 {event.sourceDocument}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ── Active Medications Extracted ── */}
              {summaryResult.activeMedications && summaryResult.activeMedications.length > 0 && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-teal-600" />
                      Active / Extracted Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {summaryResult.activeMedications.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-2"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{med.drug}</p>
                            {med.dosage && (
                              <p className="text-[11px] text-teal-700 font-medium">{med.dosage}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 shrink-0">
                            {med.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Exam Focus & Disclaimer ── */}
              {summaryResult.suggestedExamFocus && summaryResult.suggestedExamFocus.length > 0 && (
                <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-200 text-xs">
                  <p className="font-bold text-cyan-950 uppercase tracking-wider mb-1">
                    🔍 Suggested Clinical Examination Focus:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-cyan-900 font-medium">
                    {summaryResult.suggestedExamFocus.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{summaryResult.disclaimer}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

