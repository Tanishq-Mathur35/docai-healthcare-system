import api from './api';

export interface TwoMinuteDoctorTimelineItem {
  date: string;
  facilityOrDoctor: string;
  event: string;
  medicationsMentioned: string[];
  sourceDocument: string;
}

export interface TwoMinuteDoctorRedFlag {
  flag: string;
  severity: 'CRITICAL' | 'WARNING' | 'NOTE';
  source: string;
}

export interface TwoMinuteDoctorContradiction {
  issue: string;
  details: string;
  sourceComparison: string;
}

export interface TwoMinuteDoctorSummary {
  patientComplaint: string;
  estimatedReadTimeSeconds: number;
  timeline: TwoMinuteDoctorTimelineItem[];
  redFlags: TwoMinuteDoctorRedFlag[];
  contradictionsAndGaps: TwoMinuteDoctorContradiction[];
  activeMedications: Array<{ drug: string; dosage?: string; source: string }>;
  quickOpdSummary: string[];
  suggestedExamFocus: string[];
  disclaimer: string;
}

export interface DecodedLabParameter {
  parameterName: string;
  canonicalName: string;
  category: string;
  observedValue: number | string;
  unit: string;
  referenceRangeMin: number | null;
  referenceRangeMax: number | null;
  referenceRangeText: string;
  status: 'NORMAL' | 'HIGH' | 'LOW' | 'INDETERMINATE';
  plainLanguageExplanation: string;
  possibleNonDiagnosticReasons: string[];
  suggestedQuestionsForDoctor: string[];
}

export interface ReportDecodedResponse {
  labName?: string;
  testDate?: string;
  patientNameHint?: string;
  parameters: DecodedLabParameter[];
  overallQuestionsForDoctor: string[];
  safetyNotice: string;
}

export interface MedicineScheduleItem {
  medicineName: string;
  dosage: string;
  timing: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'SOS';
  timingLabelHindi: string;
  timingLabelEnglish: string;
  withFoodInstructions: string;
  shorthandDecoded: string;
  duration?: string;
  purposePlainLanguage: string;
  isFlaggedForNurse?: boolean;
  nurseFlagReason?: string;
}

export interface GoingHomeRightResponse {
  patientName?: string;
  dischargeDate?: string;
  schedule: {
    morning: MedicineScheduleItem[];
    afternoon: MedicineScheduleItem[];
    night: MedicineScheduleItem[];
    asNeededSOS: MedicineScheduleItem[];
  };
  nurseReviewFlags: Array<{
    item: string;
    reason: string;
    actionRequired: string;
  }>;
  warningSignsCard: Array<{
    symptom: string;
    urgency: 'IMMEDIATE_EMERGENCY' | 'CALL_DOCTOR_TODAY' | 'MONITOR';
    action: string;
  }>;
  followUp: {
    when: string;
    withWhom: string;
    instructions: string;
  };
  shorthandGlossary: Array<{ shorthand: string; fullTerm: string; plainMeaning: string }>;
}

export interface BolKeBataoEntity {
  englishText: string;
  patientExactPhrase: string;
  severityOrFrequency?: string;
  notes?: string;
}

export interface BolKeBataoResponse {
  originalSpokenTranscript: string;
  detectedDialects: string[];
  structuredClinicalHistory: {
    chiefComplaint: BolKeBataoEntity;
    duration: BolKeBataoEntity;
    onsetAndProgression: BolKeBataoEntity;
    associatedSymptoms: BolKeBataoEntity[];
    aggravatingRelievingFactors: BolKeBataoEntity[];
    pastMedicationsMentioned: BolKeBataoEntity[];
    allergiesMentioned: BolKeBataoEntity[];
    reportedSeverity: string;
  };
  safetyAssertion: string;
  clinicianVerified: boolean;
}

export const clinicalToolsService = {
  // T01 · /two-minute-doctor
  getTwoMinuteDoctorQuestions: (complaint: string, history?: Array<{ question: string; answer: string }>) =>
    api.post('/tools/two-minute-doctor/questions', { complaint, history }),

  summarizeTwoMinuteDoctor: (formData: FormData) =>
    api.post('/tools/two-minute-doctor/summarize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // T02 · /report-decoded
  decodeReport: (formData: FormData) =>
    api.post('/tools/report-decoded', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // T03 · /going-home-right
  generateDischargePlan: (formData: FormData) =>
    api.post('/tools/going-home-right', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // T04 · /bol-ke-batao
  processSpeechHistory: (transcript: string, dialectHint?: string) =>
    api.post('/tools/bol-ke-batao', { transcript, dialectHint }),
};

