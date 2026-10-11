import React, { useState } from 'react';
import {
  Home,
  FileText,
  Upload,
  AlertTriangle,
  Sun,
  Sunset,
  Moon,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Info,
  Pill,
  HelpCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToast } from '@/store/notificationStore';
import {
  clinicalToolsService,
  GoingHomeRightResponse,
  MedicineScheduleItem,
} from '@/services/clinicalTools.service';

export default function GoingHomeRightPage() {
  const { error: toastError, success: toastSuccess } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dischargeText, setDischargeText] = useState(
    `HOSPITAL DISCHARGE SUMMARY
Patient: Kamla Devi, 68 F | Diagnosis: Acute Coronary Syndrome (NSTEMI) / Post-Angioplasty
Discharge Advice:
1. Tab Ecosprin 75mg - 1 OD PC (After lunch)
2. Tab Clopidogrel 75mg - 1 OD PC
3. Tab Metoprolol succinate 25mg - 1 BD PC (Morning 8am, Night 8pm)
4. Tab Rosuvastatin 20mg - 1 HS (Night before sleep)
5. Tab Pantoprazole 40mg - 1 OD AC (Morning empty stomach)
6. Tab Sorbitrate 5mg - 1 SL SOS if sudden chest pain or angina occurs
7. Syrup Lactulose - 15ml BD if constipation
Follow-up: Review in Cardiology OPD after 7 days with ECG. SOS emergency if chest tightness > 15 mins or severe breathlessness.`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [carePlan, setCarePlan] = useState<GoingHomeRightResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedFile && !dischargeText.trim()) {
      toastError('Input Required', 'Please provide a discharge summary sheet or text.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    formData.append('dischargeText', dischargeText);

    try {
      const res = await clinicalToolsService.generateDischargePlan(formData);
      setCarePlan(res.data?.data);
      toastSuccess('Care Plan Ready', 'Daily family medication schedule generated.');
    } catch (err: any) {
      toastError('Generation Failed', err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Scene Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-900 via-orange-800 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-amber-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold mb-3">
              <Home className="w-3.5 h-3.5" /> T03 · Hospital Discharge Family Care Plan
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              Going Home Right
            </h1>
            <p className="mt-2 text-sm md:text-base text-amber-100 max-w-3xl leading-relaxed">
              Turns confusing hospital discharge sheets into a simple Morning, Afternoon, and Night routine families and caregivers can understand. Decodes doctor shorthand (OD, BD, SOS) and flags ambiguous instructions for nurse sign-off so nobody guesses.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-amber-500/30 text-xs font-medium text-amber-300">
              <CheckCircle2 className="w-4 h-4 text-amber-400" /> Nurse Sign-Off Safety
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Discharge Sheet Input ── */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-amber-600" />
                Upload Discharge Summary
              </CardTitle>
              <CardDescription>
                Upload the paper discharge sheet from the hospital or paste doctor advice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="border-2 border-dashed border-amber-200 rounded-xl p-5 text-center hover:bg-amber-50/30 transition-colors">
                <Upload className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Select Photo or Scan of Discharge Card
                </p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="mt-3 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 cursor-pointer"
                />
                {selectedFile && (
                  <p className="mt-2 text-xs text-amber-800 font-semibold truncate">
                    Attached: {selectedFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Or Paste Discharge Sheet Text
                </label>
                <textarea
                  value={dischargeText}
                  onChange={(e) => setDischargeText(e.target.value)}
                  rows={8}
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
                  placeholder="Paste medicines, timings, dosage, and follow-up advice..."
                />
              </div>

              <Button
                onClick={handleGeneratePlan}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-2.5 shadow-md shadow-amber-600/20"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Decoding Shorthands & Building Care Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Build Family Daily Care Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Shorthand Guide */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Common Hospital Shorthands Decoded
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div><strong>OD:</strong> Once a day (1x)</div>
              <div><strong>BD:</strong> Twice a day (2x)</div>
              <div><strong>TDS:</strong> Three times a day (3x)</div>
              <div><strong>SOS:</strong> Only in emergency/need</div>
              <div><strong>AC:</strong> Before food (खाली पेट)</div>
              <div><strong>PC:</strong> After food (खाने के बाद)</div>
              <div><strong>HS:</strong> At bedtime (रात को सोते वक्त)</div>
              <div><strong>SL:</strong> Under tongue (जीभ के नीचे)</div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Daily Care Plan & Warning Signs ── */}
        <div className="lg:col-span-7">
          {isLoading && (
            <Card className="border border-slate-200 shadow-sm bg-white p-12 text-center">
              <LoadingSpinner size="lg" className="mx-auto text-amber-600 mb-4" />
              <h3 className="text-base font-bold text-slate-800">
                Formatting Family Routine & Checking Nurse Flags...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Translating clinical abbreviations into simple morning, afternoon, and night tasks.
              </p>
            </Card>
          )}

          {!isLoading && !carePlan && (
            <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center bg-slate-50/50 flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-3 shadow-inner">
                <Home className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">Family Care Plan Ready to Generate</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Upload or paste your discharge sheet on the left, then click <strong>"Build Family Daily Care Plan"</strong> to create a schedule for the family refrigerator.
              </p>
            </div>
          )}

          {!isLoading && carePlan && (
            <div className="space-y-4">
              {/* Header with Print Option */}
              <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Daily Home Care Plan & Medication Schedule
                  </h3>
                  <p className="text-xs text-slate-400">
                    Patient: {carePlan.patientName || 'Kamla Devi'} | Follow-up: {carePlan.followUp?.when || 'In 7 days'}
                  </p>
                </div>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print for Fridge
                </Button>
              </div>

              {/* ── NURSE REVIEW FLAGS (If anything was unclear, never guess) ── */}
              {carePlan.nurseReviewFlags && carePlan.nurseReviewFlags.length > 0 && (
                <div className="rounded-xl border-2 border-rose-500 bg-rose-50 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-900">
                        ⚠️ Flagged for Hospital Nurse Sign-Off (Do Not Guess!)
                      </h4>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        These instructions appeared incomplete, conflicting, or illegible on the discharge sheet. Please call the hospital or nurse before giving:
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {carePlan.nurseReviewFlags.map((nf, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-rose-200 text-xs">
                            <span className="font-bold text-rose-900">{nf.item}: </span>
                            <span className="text-slate-700">{nf.reason}</span>
                            <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                              Action: {nf.actionRequired}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── MORNING SCHEDULE (सुबह) ── */}
              <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/70 to-yellow-50/50 p-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-200/80 mb-3">
                  <Sun className="w-5 h-5 text-amber-600" />
                  <h4 className="font-black text-sm text-amber-950 uppercase tracking-wide">
                    🌅 Morning Schedule (सुबह का समय — 7:00 AM to 9:00 AM)
                  </h4>
                </div>
                {carePlan.schedule?.morning && carePlan.schedule.morning.length > 0 ? (
                  <div className="space-y-2">
                    {carePlan.schedule.morning.map((med, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">{med.medicineName}</span>
                            <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                              {med.dosage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">
                            {med.withFoodInstructions}
                          </p>
                        </div>
                        <div className="text-right sm:max-w-xs">
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {med.shorthandDecoded}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{med.purposePlainLanguage}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No morning medicines prescribed.</p>
                )}
              </div>

              {/* ── AFTERNOON SCHEDULE (दोपहर) ── */}
              <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50/70 to-blue-50/50 p-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-sky-200/80 mb-3">
                  <Sunset className="w-5 h-5 text-sky-600" />
                  <h4 className="font-black text-sm text-sky-950 uppercase tracking-wide">
                    ☀️ Afternoon Schedule (दोपहर का समय — 1:00 PM to 2:00 PM)
                  </h4>
                </div>
                {carePlan.schedule?.afternoon && carePlan.schedule.afternoon.length > 0 ? (
                  <div className="space-y-2">
                    {carePlan.schedule.afternoon.map((med, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">{med.medicineName}</span>
                            <span className="text-xs font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded">
                              {med.dosage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">
                            {med.withFoodInstructions}
                          </p>
                        </div>
                        <div className="text-right sm:max-w-xs">
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {med.shorthandDecoded}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{med.purposePlainLanguage}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No afternoon medicines prescribed.</p>
                )}
              </div>

              {/* ── NIGHT SCHEDULE (रात) ── */}
              <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-purple-50/50 p-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-200/80 mb-3">
                  <Moon className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-black text-sm text-indigo-950 uppercase tracking-wide">
                    🌙 Night Schedule (रात का समय — 8:00 PM to 9:30 PM)
                  </h4>
                </div>
                {carePlan.schedule?.night && carePlan.schedule.night.length > 0 ? (
                  <div className="space-y-2">
                    {carePlan.schedule.night.map((med, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">{med.medicineName}</span>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                              {med.dosage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">
                            {med.withFoodInstructions}
                          </p>
                        </div>
                        <div className="text-right sm:max-w-xs">
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {med.shorthandDecoded}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{med.purposePlainLanguage}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No night medicines prescribed.</p>
                )}
              </div>

              {/* ── SOS / AS NEEDED ── */}
              {carePlan.schedule?.asNeededSOS && carePlan.schedule.asNeededSOS.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-red-200 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-black text-sm text-red-950 uppercase tracking-wide">
                      🚨 SOS Medicines (सिर्फ आवश्यकता या इमरजेंसी में)
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {carePlan.schedule.asNeededSOS.map((med, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-black text-sm text-red-900">{med.medicineName} ({med.dosage})</span>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">{med.withFoodInstructions}</p>
                        </div>
                        <span className="text-xs font-mono text-red-700 font-bold">{med.shorthandDecoded}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CALL THE DOCTOR IF... RED CARD ── */}
              {carePlan.warningSignsCard && carePlan.warningSignsCard.length > 0 && (
                <div className="rounded-xl border-2 border-red-600 bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-6 h-6 text-yellow-300" />
                    <h4 className="font-black text-base uppercase tracking-wider text-white">
                      🚨 "Call The Doctor Or Hospital If..." (चेतावनी संकेत)
                    </h4>
                  </div>
                  <p className="text-xs text-red-100 mb-3">
                    If Kamla Devi experiences any of these symptoms, call your hospital helpline immediately or go to the nearest emergency room:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {carePlan.warningSignsCard.map((ws, idx) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-sm p-2.5 rounded-lg border border-white/20">
                        <p className="font-extrabold text-white">{ws.symptom}</p>
                        <p className="text-[11px] text-red-100 mt-0.5">Action: {ws.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Card */}
              {carePlan.followUp && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Next Hospital Follow-up Appointment: </span>
                    <span className="text-amber-800 font-bold">{carePlan.followUp.when}</span>
                    <p className="text-slate-500 mt-0.5">{carePlan.followUp.instructions}</p>
                  </div>
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

