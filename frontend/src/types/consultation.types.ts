export interface ConsultationMessage {
  id?: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt?: string;
}

export interface PossibleCondition {
  name: string;
  probability: 'High' | 'Medium' | 'Low';
  explanation: string;
}

export interface ReportData {
  id: string;
  consultationId: string;
  patientSummary: {
    age?: number;
    gender?: string;
    bloodGroup?: string;
    knownAllergies: string[];
    chronicDiseases: string[];
  };
  symptoms: string[];
  possibleConditions: PossibleCondition[];
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  recommendedTests: string[];
  precautions: string[];
  lifestyleAdvice: string[];
  otcSuggestions: string[];
  emergencySigns: string[];
  referralNotes?: string;
  confidenceScore: number;
  aiSummary: string;
  disclaimerText: string;
  pdfUrl?: string;
  generatedAt: string;
}

export interface PastCondition {
  id: string;
  conditionName: string;
  conditionType: string;
  description?: string;
}

export interface ConsultationSession {
  consultationId: string;
  question?: string;
  isEmergency?: boolean;
  emergencyReason?: string;
  pastConditions?: PastCondition[];
  questionCount: number;
  maxQuestions: number;
  isCompleted?: boolean;
  reportId?: string;
}
