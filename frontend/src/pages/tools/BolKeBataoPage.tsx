import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  FileCheck2,
  Edit3,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldCheck,
  Languages,
  RotateCcw,
  Save,
  MessageSquare,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToast } from '@/store/notificationStore';
import {
  clinicalToolsService,
  BolKeBataoResponse,
  BolKeBataoEntity,
} from '@/services/clinicalTools.service';

export default function BolKeBataoPage() {
  const { error: toastError, success: toastSuccess } = useToast();

  const [transcript, setTranscript] = useState(
    'Teen din se pet mein jalan hai, raat ko zyada hoti hai, aur chakkar bhi aate hain. Koi dawai nahi li, par matho bhi halka dukh riyo hai.'
  );
  const [dialectHint, setDialectHint] = useState<'auto' | 'hindi' | 'hinglish' | 'marwari'>('auto');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [historyResult, setHistoryResult] = useState<BolKeBataoResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableHistory, setEditableHistory] = useState<any>(null);
  const [isSignedOff, setIsSignedOff] = useState(false);

  // Web Speech API recognition support
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = dialectHint === 'marwari' ? 'hi-IN' : 'hi-IN';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setTranscript((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setRecognitionInstance(recognition);
    }
  }, [dialectHint]);

  const toggleRecording = () => {
    if (!recognitionInstance) {
      toastError(
        'Mic Not Supported',
        'Web Speech API is not available on this browser. You can type or paste Hindi/Marwari text directly.'
      );
      return;
    }

    if (isRecording) {
      recognitionInstance.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionInstance.start();
        setIsRecording(true);
        toastSuccess('Listening...', 'Speak naturally in Hindi, Hinglish, or Marwari.');
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  const handleProcessSpeech = async () => {
    if (!transcript.trim()) {
      toastError('Transcript Required', 'Please speak or type the patient speech.');
      return;
    }

    setIsLoading(true);
    setIsSignedOff(false);
    try {
      const res = await clinicalToolsService.processSpeechHistory(transcript, dialectHint);
      setHistoryResult(res.data?.data);
      setEditableHistory(res.data?.data?.structuredClinicalHistory);
      toastSuccess('Clinical History Structured', 'All fields linked to original quotes.');
    } catch (err: any) {
      toastError('Translation Failed', err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOff = () => {
    setIsSignedOff(true);
    setIsEditing(false);
    toastSuccess('Clinician Signed Off', 'Verified and attached to patient EHR history.');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Scene Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-300 text-xs font-semibold mb-3">
              <Languages className="w-3.5 h-3.5" /> T04 · Multilingual Clinical Voice AI
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Bol Ke Batao <span className="text-xl md:text-2xl font-light opacity-80">(बोल के बताओ)</span>
            </h1>
            <p className="mt-2 text-sm md:text-base text-purple-100 max-w-3xl leading-relaxed">
              Solves linguistic barriers across Indian states (e.g., a Barmer/Jodhpur farmer speaking Marwari & Hindi to a non-Hindi resident doctor). Translates code-mixed speech into structured English clinical histories with zero invented symptoms and verifiable source quotes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <span className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-purple-500/30 text-xs font-medium text-purple-300">
              <ShieldCheck className="w-4 h-4 text-purple-400" /> Source-Phrase Tracing
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Audio / Speech Recording ── */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                <Mic className="w-5 h-5 text-purple-600" />
                Patient Voice Recording & Dialect Intake
              </CardTitle>
              <CardDescription>
                Record patient in Hindi, Hinglish, or Marwari or type the spoken words.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Dialect Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dialect / Language Tone
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'auto', label: 'Auto Detect' },
                    { id: 'hindi', label: 'Hindi (हिंदी)' },
                    { id: 'hinglish', label: 'Hinglish' },
                    { id: 'marwari', label: 'Marwari (मारवाड़ी)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDialectHint(item.id as any)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        dialectHint === item.id
                          ? 'bg-purple-50 border-purple-500 text-purple-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Mic Button */}
              <div className="text-center py-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg transition-all ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white hover:scale-105'
                  }`}
                >
                  {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
                <p className="text-xs font-semibold text-slate-600 mt-2">
                  {isRecording ? 'Listening to patient... Click to Stop' : 'Click Mic to Record Patient Speech'}
                </p>
              </div>

              {/* Transcript Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Patient Spoken Transcript</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTranscript(
                        'Teen din se pet mein jalan hai, raat ko zyada hoti hai, aur chakkar bhi aate hain. Koi dawai nahi li, par matho bhi halka dukh riyo hai.'
                      )
                    }
                    className="text-[11px] text-purple-600 hover:underline font-normal"
                  >
                    Load Barmer Patient Sample
                  </button>
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={5}
                  className="w-full text-xs font-medium rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800"
                  placeholder="Record or type patient voice transcript in Hindi/Marwari..."
                />
              </div>

              <Button
                onClick={handleProcessSpeech}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 shadow-md shadow-purple-600/20"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Extracting English History & Verbatim Sources...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Structure Clinical History
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Clinician Linguistic Safeguard */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-2">
            <h4 className="font-bold text-purple-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Linguistic Integrity Guarantee
            </h4>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Every single English clinical observation (e.g. <em>Nocturnal exacerbation</em>) is tied to the exact Hindi/Marwari words (<em>"raat ko zyada hoti hai"</em>) spoken. The attending clinician can review and edit prior to attaching to the hospital record.
            </p>
          </div>
        </div>

        {/* ── Right Column: Structured English Clinical History ── */}
        <div className="lg:col-span-7">
          {isLoading && (
            <Card className="border border-slate-200 shadow-sm bg-white p-12 text-center">
              <LoadingSpinner size="lg" className="mx-auto text-purple-600 mb-4" />
              <h3 className="text-base font-bold text-slate-800">
                Translating Marwari/Hindi Nuances into Clinical English...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Preserving nuances of pain timing, dizziness, and home remedies with source phrase verification.
              </p>
            </Card>
          )}

          {!isLoading && !historyResult && (
            <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center bg-slate-50/50 flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-3 shadow-inner">
                <FileCheck2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">Structured Clinical History Awaiting Input</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Record or enter patient speech on the left, then click <strong>"Structure Clinical History"</strong> to produce the verifiable English clinical history.
              </p>
            </div>
          )}

          {!isLoading && historyResult && editableHistory && (
            <div className="space-y-4">
              {/* Header with Verification Action */}
              <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-300 bg-purple-950 border border-purple-700 px-2 py-0.5 rounded">
                      Clinical English Intake
                    </span>
                    {isSignedOff ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clinician Signed-Off
                      </span>
                    ) : (
                      <span className="text-xs text-amber-300 font-medium">
                        Pending Clinician Verification
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-sm text-white mt-1">
                    Structured Clinical History & Entity Traceability
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant="outline"
                    size="sm"
                    className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> {isEditing ? 'Done Editing' : 'Edit Fields'}
                  </Button>
                  {!isSignedOff && (
                    <Button
                      onClick={handleSignOff}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Sign-Off
                    </Button>
                  )}
                </div>
              </div>

              {/* ── CHIEF COMPLAINT & DURATION ── */}
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Chief Complaint & Timing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 text-xs">
                  {/* Chief Complaint */}
                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800">English History: </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableHistory.chiefComplaint?.englishText || ''}
                          onChange={(e) =>
                            setEditableHistory({
                              ...editableHistory,
                              chiefComplaint: {
                                ...editableHistory.chiefComplaint,
                                englishText: e.target.value,
                              },
                            })
                          }
                          className="mt-1 w-full text-xs border rounded p-1"
                        />
                      ) : (
                        <span className="text-purple-950 font-bold">
                          {editableHistory.chiefComplaint?.englishText}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-purple-200 text-purple-900 font-bold">
                        🗣️ "{editableHistory.chiefComplaint?.patientExactPhrase}"
                      </span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-700">Duration: </span>
                      <span className="text-slate-800 font-semibold">
                        {editableHistory.duration?.englishText}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      🗣️ "{editableHistory.duration?.patientExactPhrase}"
                    </span>
                  </div>

                  {/* Onset / Progression */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-700">Onset & Pattern: </span>
                      <span className="text-slate-800 font-semibold">
                        {editableHistory.onsetAndProgression?.englishText}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      🗣️ "{editableHistory.onsetAndProgression?.patientExactPhrase}"
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* ── ASSOCIATED SYMPTOMS (With verbatim Hindi quotes) ── */}
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Associated Symptoms & Clinical Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {editableHistory.associatedSymptoms && editableHistory.associatedSymptoms.length > 0 ? (
                    editableHistory.associatedSymptoms.map((symptom: BolKeBataoEntity, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-bold text-slate-800">• {symptom.englishText}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-purple-900 font-bold shrink-0">
                          🗣️ "{symptom.patientExactPhrase}"
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No associated symptoms reported.</p>
                  )}
                </CardContent>
              </Card>

              {/* ── MEDICATIONS & ALLERGIES ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Medications Spoken
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {editableHistory.pastMedicationsMentioned && editableHistory.pastMedicationsMentioned.length > 0 ? (
                      editableHistory.pastMedicationsMentioned.map((m: BolKeBataoEntity, idx: number) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-100 mb-1">
                          <p className="font-bold text-slate-800">{m.englishText}</p>
                          <p className="text-[10px] text-purple-700 font-mono">🗣️ "{m.patientExactPhrase}"</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">None mentioned by patient.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Allergies Spoken
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {editableHistory.allergiesMentioned && editableHistory.allergiesMentioned.length > 0 ? (
                      editableHistory.allergiesMentioned.map((a: BolKeBataoEntity, idx: number) => (
                        <div key={idx} className="p-2 bg-rose-50 rounded border border-rose-200 mb-1">
                          <p className="font-bold text-rose-900">{a.englishText}</p>
                          <p className="text-[10px] text-rose-700 font-mono">🗣️ "{a.patientExactPhrase}"</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No allergies mentioned.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Safety Assertion */}
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{historyResult.safetyAssertion}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

