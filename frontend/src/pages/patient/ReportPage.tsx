import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '@/services/patient.service';
import { consultationService } from '@/services/consultation.service';
import { RiskBadge } from '@/components/reports/RiskBadge';
import { ConfidenceGauge } from '@/components/reports/ConfidenceGauge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import {
  Download, Calendar, AlertOctagon, CheckCircle2,
  Stethoscope, Activity, HeartPulse, FileText, ArrowLeft,
  Pill, Globe, ExternalLink, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['patient-report', id],
    queryFn: () => patientService.getReport(id!),
    enabled: !!id,
  });

  const report = data?.data?.data;

  const handleDownloadPdf = async () => {
    if (!report?.id) return;
    try {
      const res = await consultationService.getPdfUrl(report.id);
      window.open(res.data.data.downloadUrl, '_blank');
    } catch {
      alert('PDF generation in progress. Please try again in a moment.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-lg font-semibold">Report Not Found</p>
        <Button asChild variant="outline">
          <Link to="/patient/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/patient/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadPdf} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Download Official PDF
          </Button>
          <Button asChild size="sm">
            <Link to="/patient/appointments">
              <Calendar className="h-4 w-4 mr-2" /> Book Doctor
            </Link>
          </Button>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Main Report Card */}
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-primary tracking-wider uppercase">Clinical AI Triage Summary</span>
              <CardTitle className="text-2xl mt-1">Medical Assessment Report</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Generated: {formatDateTime(report.generatedAt)}</p>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <RiskBadge level={report.riskLevel} />
              <div className="w-36">
                <ConfidenceGauge score={report.confidenceScore} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* AI Clinical Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Stethoscope className="h-4 w-4" /> Clinical Synthesis
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed">{report.aiSummary}</p>
          </div>

          {/* Differential Diagnoses / Possible Conditions */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
              <Activity className="h-4 w-4 text-primary" /> Potential Conditions (Differential Considerations)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(report.possibleConditions as any[])?.map((cond, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{cond.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      cond.probability === 'High' ? 'bg-red-100 text-red-700'
                        : cond.probability === 'Medium' ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {cond.probability} Match
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{cond.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Symptoms Recorded */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-foreground">Reported & Extracted Symptoms</h3>
            <div className="flex flex-wrap gap-1.5">
              {(report.symptoms as string[])?.map((symp, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium">
                  • {symp}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended Tests & Diagnostics */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
              <FileText className="h-4 w-4 text-primary" /> Suggested Diagnostic Investigations
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {(report.recommendedTests as string[])?.map((test, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {test}
                </li>
              ))}
            </ul>
          </div>

          {/* Evidence-Based Medication & Relief Guidance (Tavily Verified) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b">
              <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                <Pill className="h-4 w-4 text-emerald-600" /> Evidence-Based Medication & Relief Guidance
              </h3>
              {(report.tavilyUsed || (report.tavilySearchResults && (report.tavilySearchResults as any[]).length > 0)) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  <Globe className="h-3 w-3 text-teal-600" /> Verified via Tavily Medical Search
                </span>
              )}
            </div>

            {/* Advisory box */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Safety Notice:</span> Over-the-counter suggestions are for informational supportive care and must not replace professional prescription or physician diagnosis. Consult a licensed pharmacist or doctor if taking other medications or experiencing worsening symptoms.
              </div>
            </div>

            {/* Medication cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(report.otcSuggestions as any[]) && (report.otcSuggestions as any[]).length > 0 ? (
                (report.otcSuggestions as any[]).map((med: any, idx: number) => {
                  const isObject = typeof med === 'object' && med !== null;
                  const name = isObject ? med.name : String(med).split(':')[0];
                  const details = isObject ? med : null;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/50 shadow-xs hover:border-emerald-300 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                            <Pill className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{name}</h4>
                            {details?.type && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                details.type.toLowerCase().includes('prescription')
                                  ? 'bg-amber-100 text-amber-800'
                                  : details.type.toLowerCase().includes('supportive')
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {details.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {details ? (
                        <div className="space-y-2 text-xs">
                          {details.purpose && (
                            <div>
                              <span className="font-semibold text-slate-700">Indication / Purpose: </span>
                              <span className="text-slate-600">{details.purpose}</span>
                            </div>
                          )}
                          {details.dosageGuide && (
                            <div className="p-2 bg-emerald-50/40 rounded-lg border border-emerald-100/60">
                              <span className="font-semibold text-emerald-900">Dosage Guidance: </span>
                              <span className="text-emerald-800">{details.dosageGuide}</span>
                            </div>
                          )}
                          {details.precautions && (
                            <div className="p-2 bg-slate-100/70 rounded-lg text-slate-600">
                              <span className="font-semibold text-slate-700">Precautions: </span>
                              <span>{details.precautions}</span>
                            </div>
                          )}
                          {details.evidenceSource && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-100">
                              <ShieldCheck className="h-3 w-3 text-teal-600" />
                              <span>Evidence: {details.evidenceSource}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 leading-relaxed">{String(med)}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 border rounded-xl text-xs text-slate-500 italic md:col-span-2">
                  No specific over-the-counter medications suggested. Focus on hydration and clinical evaluation.
                </div>
              )}
            </div>

            {/* Tavily Peer-Reviewed Live Citations */}
            {(report.tavilySearchResults as any[]) && (report.tavilySearchResults as any[]).length > 0 && (
              <div className="mt-4 p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-wider">
                  <Globe className="h-4 w-4 text-teal-600" />
                  Peer-Reviewed Medical Literature & Guidelines (Tavily Live Search)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(report.tavilySearchResults as any[]).map((src: any, sIdx: number) => {
                    let hostname = 'Medical Literature';
                    try {
                      hostname = new URL(src.url).hostname.replace('www.', '');
                    } catch {}

                    return (
                      <a
                        key={sIdx}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white rounded-lg border border-teal-100/80 hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                              {hostname}
                            </span>
                            <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-teal-600 transition-colors" />
                          </div>
                          <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-700 line-clamp-1">
                            {src.title || 'Medical Guideline Reference'}
                          </p>
                          {src.content && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">
                              {src.content}
                            </p>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>


          {/* Precautions & Lifestyle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 p-4 border rounded-xl bg-muted/20">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Precautions</h4>
              <ul className="space-y-1 text-xs text-foreground">
                {(report.precautions as string[])?.map((p, idx) => (
                  <li key={idx}>• {p}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 p-4 border rounded-xl bg-muted/20">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Lifestyle & Comfort Care</h4>
              <ul className="space-y-1 text-xs text-foreground">
                {(report.lifestyleAdvice as string[])?.map((l, idx) => (
                  <li key={idx}>• {l}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Emergency Red Flags */}
          {report.emergencySigns && (report.emergencySigns as string[]).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-red-800 flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-red-600" /> Emergency Escalation Indicators
              </h4>
              <p className="text-xs text-red-700">Seek immediate medical evaluation if you experience:</p>
              <ul className="space-y-1 text-xs text-red-800">
                {(report.emergencySigns as string[]).map((e, idx) => (
                  <li key={idx} className="font-medium">• {e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Referral Notes */}
          {report.referralNotes && (
            <div className="p-4 bg-muted/30 border rounded-xl flex items-start gap-3">
              <HeartPulse className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Specialist Referral Guidance</h4>
                <p className="text-xs text-foreground mt-1">{report.referralNotes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
