import { Annotation } from '@langchain/langgraph';
import { ConsultationMessage, GeneratedReportData } from '../ai.types';

export const ConsultationStateAnnotation = Annotation.Root({
  patientId: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  consultationId: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  chiefComplaint: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  patientProfile: Annotation<{
    age?: number;
    gender?: string;
    bloodGroup?: string;
    allergies: string[];
    chronicDiseases: string[];
  }>({
    reducer: (_prev, next) => next,
    default: () => ({ allergies: [], chronicDiseases: [] }),
  }),
  pastConditions: Annotation<Array<{
    id: string;
    conditionName: string;
    conditionType: string;
    description?: string;
  }>>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  relatedConditionId: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  conditionRelevance: Annotation<'RELEVANT' | 'NOT_RELEVANT' | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  relatedConditionContext: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  messages: Annotation<ConsultationMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  collectedSymptoms: Annotation<string[]>({
    reducer: (prev, next) => Array.from(new Set([...prev, ...next])),
    default: () => [],
  }),
  questionCount: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
  maxQuestions: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 7,
  }),
  isSufficiencyReached: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  isEmergencyFlagged: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  emergencyReason: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  currentQuestion: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  generatedReport: Annotation<GeneratedReportData | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  tavilySearchResults: Annotation<any[] | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  error: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
});

export type ConsultationStateType = typeof ConsultationStateAnnotation.State;
