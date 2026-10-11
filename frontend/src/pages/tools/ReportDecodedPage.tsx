import React, { useState } from 'react';
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  Info,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  MessageCircleQuestion,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToast } from '@/store/notificationStore';
import {
  clinicalToolsService,
  ReportDecodedResponse,
  DecodedLabParameter,
} from '@/services/clinicalTools.service';

export default function ReportDecodedPage() {
  const { error: toastError, success: toastSuccess } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportText, setReportText] = useState(
    `PATIENT LAB REPORT - PALI DIAGNOSTIC CENTER
Date: 15-Mar-2024
TEST NAME               OBSERVED VALUE    UNIT     REFERENCE INTERVAL
SGPT (ALT)              68                U/L      7 - 56
SGOT (AST)              42                U/L      10 - 40
HbA1c (Glycated Hb)     7.4               %        4.0 - 5.6 (Normal), 5.7 - 6.4 (Prediabetes)
Hemoglobin              10.8              g/dL     12.0 - 15.5
Serum Creatinine        0.9               mg/dL    0.6 - 1.2
TSH (Thyroid Stim.)     5.8               uIU/mL   0.4 - 4.2
Total Cholesterol       215               mg/dL    < 200`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [decodedData, setDecodedData] = useState<ReportDecodedResponse | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'OUT_OF_RANGE' | 'NORMAL'>('ALL');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDecode = async () => {
    if (!selectedFile && !reportText.trim()) {
      toastError('Input Required', 'Please upload a photo/PDF or paste your lab report text.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    formData.append('reportText', reportText);

    try {
      const res = await clinicalToolsService.decodeReport(formData);
      setDecodedData(res.data?.data);
      toastSuccess('Report Decoded', 'Parameters translated into plain language.');
    } catch (err: any) {
      toastError('Decoding Failed', err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredParameters = (decodedData?.parameters || []).filter((param) => {
    if (selectedFilter === 'OUT_OF_RANGE') return param.status === 'HIGH' || param.status === 'LOW';
    if (selectedFilter === 'NORMAL') return param.status === 'NORMAL';
    return true;
  });

  const outOfRangeCount = (decodedData?.parameters || []).filter(
    (p) => p.status === 'HIGH' || p.status === 'LOW'
  ).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Scene Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-800 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-teal-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold mb-3">
              <Activity className="w-3.5 h-3.5" /> T02 · Patient Lab Report Explainer
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              Report, Decoded
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-200 max-w-3xl leading-relaxed">
              No more sleepless nights deciphering SGPT, HbA1c, or bold "H" marks. Translates confusing medical lab sheets into everyday language with rule-based ranges and smart questions for your doctor — without alarming or diagnosing.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Rule-Based Thresholds
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Upload Lab Report ── */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                <Upload className="w-5 h-5 text-teal-600" />
                Upload Lab Report Document
              </CardTitle>
              <CardDescription>
                Upload a mobile camera photo or PDF from any clinic or diagnostic center.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="border-2 border-dashed border-teal-200 rounded-xl p-5 text-center hover:bg-teal-50/30 transition-colors">
                <Upload className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Select Lab Report Image or PDF
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports JPG, PNG, WEBP, PDF up to 50MB
                </p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="mt-3 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                />
                {selectedFile && (
                  <p className="mt-2 text-xs text-teal-700 font-semibold truncate">
                    Attached: {selectedFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Or Paste Lab Report Values Below
                </label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  rows={8}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700"
                  placeholder="Paste rows of test names, observed values, and ranges..."
                />
              </div>

              <Button
                onClick={handleDecode}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-2.5 shadow-md shadow-teal-600/20"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Analyzing Lab Parameters & Rules...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Decode Lab Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Calming Patient Guidance Note */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Info className="w-4 h-4 text-amber-600" />
              Patient Reassurance Note
            </div>
            <p className="leading-relaxed text-[11px] text-amber-800">
              A value marked slightly High or Low is very common and often temporary due to diet, mild dehydration, physical exertion, or minor stress. <strong>Never change your prescriptions or worry before speaking with your doctor.</strong>
            </p>
          </div>
        </div>

        {/* ── Right Column: Plain-Language Parameter Cards ── */}
        <div className="lg:col-span-7">
          {isLoading && (
            <Card className="border border-slate-200 shadow-sm bg-white p-12 text-center">
              <LoadingSpinner size="lg" className="mx-auto text-teal-600 mb-4" />
              <h3 className="text-base font-bold text-slate-800">
                Applying Deterministic Laboratory Thresholds...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Validating numeric ranges, removing scary medical jargon, and preparing plain language explanations.
              </p>
            </Card>
          )}

          {!isLoading && !decodedData && (
            <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center bg-slate-50/50 flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 mb-3 shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">Lab Report Ready for Translation</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Upload your report sheet or click <strong>"Decode Lab Report"</strong> to view each test parameter broken down into understandable everyday language.
              </p>
            </div>
          )}

          {!isLoading && decodedData && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {decodedData.labName || 'Diagnostic Lab Report'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total Tests Decoded: <strong>{decodedData.parameters.length}</strong> | Out of Range: <span className="font-bold text-rose-600">{outOfRangeCount}</span>
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setSelectedFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      selectedFilter === 'ALL'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({decodedData.parameters.length})
                  </button>
                  <button
                    onClick={() => setSelectedFilter('OUT_OF_RANGE')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      selectedFilter === 'OUT_OF_RANGE'
                        ? 'bg-rose-50 text-rose-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    Flagged ({outOfRangeCount})
                  </button>
                  <button
                    onClick={() => setSelectedFilter('NORMAL')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      selectedFilter === 'NORMAL'
                        ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:text-emerald-600'
                    }`}
                  >
                    In Range
                  </button>
                </div>
              </div>

              {/* Parameter Cards List */}
              <div className="space-y-3">
                {filteredParameters.map((param, idx) => {
                  const isHigh = param.status === 'HIGH';
                  const isLow = param.status === 'LOW';
                  const isNormal = param.status === 'NORMAL';

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                        isHigh
                          ? 'border-rose-200 bg-rose-50/20'
                          : isLow
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Top Row: Name, Value, Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {param.parameterName}
                            </h4>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {param.category}
                            </span>
                          </div>
                          {param.canonicalName !== param.parameterName && (
                            <p className="text-[11px] text-slate-400">{param.canonicalName}</p>
                          )}
                        </div>

                        {/* Value & Status Pill */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900 font-mono">
                              {param.observedValue} <span className="text-xs font-normal text-slate-500">{param.unit}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Lab Range: {param.referenceRangeText}
                            </div>
                          </div>

                          {/* Rule-Based Status Badge */}
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
                              isHigh
                                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                : isLow
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isNormal
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isHigh && <TrendingUp className="w-3.5 h-3.5" />}
                            {isLow && <TrendingDown className="w-3.5 h-3.5" />}
                            {isNormal && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {param.status}
                          </div>
                        </div>
                      </div>

                      {/* Plain-Language Explanation */}
                      <div className="pt-2.5 space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-700">What it is in plain words: </span>
                          <span className="text-slate-600">{param.plainLanguageExplanation}</span>
                        </div>

                        {/* Non-Diagnostic Reasons */}
                        {param.possibleNonDiagnosticReasons && param.possibleNonDiagnosticReasons.length > 0 && (
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-700 text-[11px]">
                              Common everyday factors influencing this:
                            </span>
                            <ul className="list-disc list-inside text-[11px] text-slate-600 mt-0.5">
                              {param.possibleNonDiagnosticReasons.map((r, rIdx) => (
                                <li key={rIdx}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Doctor Questions */}
                        {param.suggestedQuestionsForDoctor && param.suggestedQuestionsForDoctor.length > 0 && (
                          <div className="text-[11px] text-teal-800 font-medium flex items-start gap-1.5 pt-0.5">
                            <MessageCircleQuestion className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Ask Dr. at appointment: </strong>
                              {param.suggestedQuestionsForDoctor.join(' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overall Questions For Doctor Card */}
              {decodedData.overallQuestionsForDoctor && decodedData.overallQuestionsForDoctor.length > 0 && (
                <Card className="border border-teal-200 bg-teal-50/50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-teal-700" />
                      Key Questions to Bring to Your Doctor's Desk
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1.5 text-xs text-teal-950 font-medium list-disc list-inside">
                      {decodedData.overallQuestionsForDoctor.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Safety Notice */}
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{decodedData.safetyNotice}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

