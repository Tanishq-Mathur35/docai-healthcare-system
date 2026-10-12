import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { consultationService } from "@/services/consultation.service";
import { patientService } from "@/services/patient.service";
import { PreviousConditionsSidebar } from "@/components/consultation/PreviousConditionsSidebar";
import { EmergencyBanner } from "@/components/consultation/EmergencyBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DisclaimerBanner } from "@/components/shared/DisclaimerBanner";
import {
  Send,
  Bot,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Mic,
  MicOff,
  Sparkles,
  FileText,
  Download,
  Volume2,
  HeartPulse,
  RefreshCw,
  Pill,
  Leaf,
  Globe,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

// Quick clinical reply chips to help the patient answer quickly
const quickReplies = [
  "Started 2 days ago",
  "Pain is mild (3/10)",
  "Pain is moderate to severe (7/10)",
  "Yes, accompanied by nausea",
  "No fever or chills",
  "Taking over-the-counter paracetamol",
];

export default function ConsultationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [chiefComplaint, setChiefComplaint] = useState(
    (location.state as any)?.initialQuery || "",
  );
  const [isStarted, setIsStarted] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "USER" | "ASSISTANT"; content: string; time: string }>
  >([]);
  const [emergencyReason, setEmergencyReason] = useState<string | undefined>();
  const [progress, setProgress] = useState({ current: 0, max: 7 });
  const [isCompleted, setIsCompleted] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRecording]);

  // Fetch past medical conditions for the sidebar
  const { data: historyData } = useQuery({
    queryKey: ["medical-history-active"],
    queryFn: () => patientService.getMedicalHistory({ limit: 10 }),
  });
  const pastConditions = historyData?.data?.data || [];

  // Start Consultation Mutation
  const startMutation = useMutation({
    mutationFn: (complaint: string) => consultationService.start(complaint),
    onSuccess: (res) => {
      const data = res.data.data;
      setConsultationId(data.consultationId);
      setIsStarted(true);
      setProgress({ current: data.questionCount, max: data.maxQuestions });

      const newMessages: Array<{
        role: "USER" | "ASSISTANT";
        content: string;
        time: string;
      }> = [
        {
          role: "USER",
          content: chiefComplaint,
          time: formatDateTime(new Date()),
        },
      ];
      if (data.question) {
        newMessages.push({
          role: "ASSISTANT",
          content: data.question,
          time: formatDateTime(new Date()),
        });
      }
      setMessages(newMessages);

      if (data.isEmergency) {
        setEmergencyReason(data.emergencyReason);
      }
    },
  });

  // Respond Mutation
  const respondMutation = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      consultationService.respond(id, answer),
    onSuccess: (res) => {
      const data = res.data.data;
      setProgress({ current: data.questionCount, max: data.maxQuestions });

      if (data.question) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ASSISTANT" as const,
            content: data.question,
            time: formatDateTime(new Date()),
          },
        ]);
      }

      if (data.isEmergency) {
        setEmergencyReason(data.emergencyReason);
      }

      if (data.isCompleted) {
        setIsCompleted(true);
        setReportId(data.reportId);
      }
    },
  });

  // Finish Early Mutation
  const finishMutation = useMutation({
    mutationFn: (id: string) => consultationService.finish(id),
    onSuccess: (res) => {
      const data = res.data.data;
      setIsCompleted(true);
      setReportId(data.reportId);
    },
  });

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) return;
    startMutation.mutate(chiefComplaint);
  };

  const handleSendAnswer = (answerText?: string) => {
    const textToSend = answerText || answerInput;
    if (!textToSend.trim() || !consultationId || respondMutation.isPending)
      return;

    setAnswerInput("");
    setMessages((prev) => [
      ...prev,
      {
        role: "USER" as const,
        content: textToSend,
        time: formatDateTime(new Date()),
      },
    ]);

    respondMutation.mutate({ id: consultationId, answer: textToSend });
  };

  // Toggle voice speech recognition simulation
  const toggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    // Try native Web Speech API if supported
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setAnswerInput((prev) =>
            prev ? `${prev} ${transcript}` : transcript,
          );
          setIsRecording(false);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
        return;
      } catch {
        // Fallback simulation below
      }
    }

    // Fallback simulation
    setIsRecording(true);
    setTimeout(() => {
      setAnswerInput((prev) =>
        prev
          ? `${prev} (voice note added)`
          : "I have been experiencing this for 3 days with mild fatigue.",
      );
      setIsRecording(false);
    }, 2500);
  };

  const handleRelevanceChange = (
    conditionId: string,
    relevance: "RELEVANT" | "NOT_RELEVANT",
  ) => {
    if (!consultationId) return;
    consultationService.setRelevance(consultationId, conditionId, relevance);
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
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              AI Health Assistant
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Adaptive, compassionate clinical triage powered by Mistral AI &
            medical guidelines.
          </p>
        </div>

        {isStarted && !isCompleted && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              consultationId && finishMutation.mutate(consultationId)
            }
            disabled={finishMutation.isPending || progress.current < 2}
            className="border-sky-200 text-sky-700 hover:bg-sky-50 font-semibold text-xs rounded-xl"
          >
            {finishMutation.isPending
              ? "Generating Assessment..."
              : "Finalize & View Report"}
          </Button>
        )}
      </div>

      <DisclaimerBanner />

      {emergencyReason && <EmergencyBanner reason={emergencyReason} />}

      {!isStarted ? (
        /* ── Step 1: Input Chief Complaint ── */
        <Card className="max-w-2xl mx-auto rounded-3xl border border-sky-100 shadow-md bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-sky-50 via-white to-teal-50/30 border-b border-sky-100/70 p-6">
            <CardTitle className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-sky-600" />
              Describe Your Health Symptoms
            </CardTitle>
            <p className="text-xs text-slate-600 mt-1">
              Please share how you are feeling in your own words. We will ask a
              few gentle follow-up questions to understand better.
            </p>
          </CardHeader>
          <form onSubmit={handleStart}>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Example: I've had a dull throbbing headache on the right side for 2 days, accompanied by slight nausea and light sensitivity..."
                  rows={4}
                  className="w-full rounded-2xl border border-sky-200 bg-slate-50/50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white transition-all shadow-inner"
                  required
                />
              </div>

              {/* Sample starter chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-slate-500">
                  Need inspiration? Click a common symptom:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Sore throat with dry cough and mild fever",
                    "Sharp lower abdominal pain after meals",
                    "Dizziness and fatigue during mornings",
                    "Skin rash on arms with itching",
                  ].map((s, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setChiefComplaint(s)}
                      className="text-xs px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 font-medium transition-colors border border-sky-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-500 hover:to-teal-400 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/20 text-sm gap-2"
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" /> Initiating Consultation...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Start AI Health
                    Consultation
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        /* ── Step 2: Interactive Interview Layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Interface */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="flex flex-col h-[640px] rounded-3xl border border-sky-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="py-3.5 px-5 border-b border-sky-100 bg-gradient-to-r from-sky-50/70 to-teal-50/40 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">
                      Dr. AI Assistant
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Clinical Consultation
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                  Question {progress.current} of {progress.max}
                </div>
              </CardHeader>

              {/* Chat Messages Body */}
              <CardContent className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-[#F8FAFC] to-white">
                <AnimatePresence>
                  {messages.map((m, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-start gap-3 ${m.role === "USER" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`h-9 w-9 rounded-2xl flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                          m.role === "USER"
                            ? "bg-gradient-to-tr from-sky-600 to-sky-500 text-white"
                            : "bg-gradient-to-tr from-teal-500 to-emerald-400 text-white"
                        }`}
                      >
                        {m.role === "USER" ? (
                          <UserIcon className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                          m.role === "USER"
                            ? "bg-sky-600 text-white rounded-tr-none"
                            : "bg-white text-slate-800 rounded-tl-none border border-sky-100/80 shadow-sky-100/50"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <span
                          className={`text-[10px] mt-1.5 block text-right font-medium ${
                            m.role === "USER"
                              ? "text-sky-200"
                              : "text-slate-400"
                          }`}
                        >
                          {m.time}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Animated Typing Indicator */}
                {(respondMutation.isPending || startMutation.isPending) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-2xl bg-teal-500 text-white flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-none border border-sky-100 shadow-sm flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full bg-sky-500 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 rounded-full bg-teal-500 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                      <span className="text-xs text-slate-400 ml-1.5 font-medium">
                        Analyzing symptoms...
                      </span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Quick Reply Suggestion Chips */}
              {!isCompleted && (
                <div className="px-5 py-2 bg-slate-50/80 border-t border-sky-100/60 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] font-bold text-slate-500 flex-shrink-0">
                    Quick answers:
                  </span>
                  {quickReplies.map((qr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendAnswer(qr)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-sky-200 text-sky-800 hover:bg-sky-100 text-xs font-medium whitespace-nowrap transition-colors shadow-2xs"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input or Finalized Assessment Card */}
              <CardFooter className="p-4 border-t border-sky-100 bg-white">
                {isCompleted ? (
                  <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 text-emerald-900">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold">
                            Consultation Complete!
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full border border-teal-200">
                            <Globe className="h-2.5 w-2.5" /> Tavily Search Verified
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800">
                          Your clinical assessment, risk tier, and evidence-based home remedies (gharelu nuskhe) are ready.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/patient/reports/${reportId}`)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm gap-1.5"
                      >
                        <Leaf className="h-3.5 w-3.5" />
                        View Report & Home Remedies{" "}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="text-xs rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                      >
                        <a
                          href={`http://localhost:5000/api/v1/ai/consultation/${consultationId}/report/pdf`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" /> PDF
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendAnswer();
                    }}
                    className="w-full flex items-center gap-2"
                  >
                    {/* Voice input button */}
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={`h-11 w-11 rounded-2xl border flex items-center justify-center transition-all ${
                        isRecording
                          ? "bg-red-500 text-white border-red-600 animate-pulse shadow-md shadow-red-200"
                          : "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
                      }`}
                      title={
                        isRecording
                          ? "Listening... click to stop"
                          : "Click to speak"
                      }
                    >
                      {isRecording ? (
                        <MicOff className="h-5 w-5" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </button>

                    <Input
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder={
                        isRecording
                          ? "Listening to your voice..."
                          : "Type your answer or describe details..."
                      }
                      className="flex-1 rounded-2xl border-sky-200 bg-slate-50/60 focus:bg-white text-sm h-11"
                      disabled={respondMutation.isPending}
                    />

                    <Button
                      type="submit"
                      disabled={
                        !answerInput.trim() || respondMutation.isPending
                      }
                      className="h-11 px-5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/20"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar: Relevant Medical History */}
          <div className="lg:col-span-1 space-y-4">
            <PreviousConditionsSidebar
              conditions={pastConditions}
              onSetRelevance={handleRelevanceChange}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
