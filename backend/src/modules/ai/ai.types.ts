import { RiskLevel } from '@prisma/client';
import { TavilySearchResult } from './rag/tavily.service';

export interface ConsultationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface PossibleCondition {
  name: string;
  probability: string; // 'High' | 'Medium' | 'Low'
  explanation: string;
}

export interface MedicationSuggestion {
  name: string;
  type: string; // 'OTC' | 'Prescription Required' | 'Supportive Care'
  purpose: string;
  dosageGuide: string;
  precautions: string;
  evidenceSource?: string;
}

export interface GeneratedReportData {
  patientSummary: {
    age?: number;
    gender?: string;
    bloodGroup?: string;
    knownAllergies: string[];
    chronicDiseases: string[];
  };
  symptoms: string[];
  possibleConditions: PossibleCondition[];
  riskLevel: RiskLevel;
  recommendedTests: string[];
  precautions: string[];
  lifestyleAdvice: string[];
  otcSuggestions: string[];
  medicationSuggestions?: MedicationSuggestion[];
  emergencySigns: string[];
  referralNotes: string;
  confidenceScore: number; // 0.0 to 1.0
  aiSummary: string;
  tavilyUsed?: boolean;
  tavilySearchResults?: TavilySearchResult[];
  disclaimer: string;
}

export interface LangGraphConsultationState {
  patientId: string;
  consultationId: string;
  chiefComplaint: string;
  patientProfile: {
    age?: number;
    gender?: string;
    bloodGroup?: string;
    allergies: string[];
    chronicDiseases: string[];
  };
  pastConditions: Array<{
    id: string;
    conditionName: string;
    conditionType: string;
    description?: string;
  }>;
  relatedConditionId?: string;
  conditionRelevance?: 'RELEVANT' | 'NOT_RELEVANT';
  relatedConditionContext?: string;
  messages: ConsultationMessage[];
  collectedSymptoms: string[];
  questionCount: number;
  maxQuestions: number;
  isSufficiencyReached: boolean;
  isEmergencyFlagged: boolean;
  emergencyReason?: string;
  currentQuestion?: string;
  generatedReport?: GeneratedReportData;
  tavilySearchResults?: TavilySearchResult[];
  error?: string;
}
