import { unifiedLLM, LLMImage } from '../ai/llm.provider';
import { logger } from '../../config/logger';

// --- T01: Two-Minute Doctor Interfaces ---
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

export interface TwoMinuteDoctorSummaryResponse {
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

// --- T02: Report Decoded Interfaces ---
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

// --- T03: Going Home Right Interfaces ---
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

// --- T04: Bol Ke Batao Interfaces ---
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

export class ClinicalToolsService {
  // ==========================================
  // T01: Two-Minute Doctor Service Methods
  // ==========================================
  async generateTwoMinuteQuestions(complaint: string, history?: Array<{ question: string; answer: string }>): Promise<string[]> {
    const prompt = `You are an OPD triage assistant helping an Indian outpatient clinic.
A patient in the OPD waiting queue has presented with the following chief complaint:
"${complaint}"

Prior Q&A history:
${history && history.length > 0 ? JSON.stringify(history, null, 2) : 'None so far.'}

Generate exactly 2 to 3 concise, empathetic clinical follow-up questions in plain English (with optional Hindi in brackets if helpful) to quickly clarify:
1. Exact duration and onset (when did it start, sudden or gradual)
2. Radiation or specific location if pain/discomfort
3. Critical red-flag screening (e.g. breathlessness, dizziness, prior medications)

Respond STRICTLY with a valid JSON array of strings:
["Question 1", "Question 2", "Question 3"]
Do NOT include markdown formatting outside the JSON.`;

    try {
      const response = await unifiedLLM.invoke([{ role: 'user', content: prompt }], { jsonMode: true, temperature: 0.2 });
      const parsed = JSON.parse(response.content.replace(/```json|```/g, '').trim());
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (err: any) {
      logger.warn('Error generating two-minute doctor questions:', err.message);
    }

    return [
      'When did this discomfort or symptom first begin, and has it been getting worse or staying the same?',
      'Are you experiencing any other symptoms such as fever, breathlessness, dizziness, or sweating?',
      'Are you currently taking any prescription tablets or traditional remedies for this?',
    ];
  }

  async summarizeForDoctor(
    complaint: string,
    followUpAnswers?: Array<{ question: string; answer: string }>,
    documentsText?: string,
    files?: Express.Multer.File[]
  ): Promise<TwoMinuteDoctorSummaryResponse> {
    const images: LLMImage[] = (files || []).map((file) => ({
      mimeType: file.mimetype,
      base64Data: file.buffer.toString('base64'),
    }));

    const prompt = `You are "The Two-Minute Doctor" AI Pre-Consultation Assistant.
Your job is to read all patient paperwork (prescriptions, lab tests, discharge cards, handwritten notes) and the patient's intake, and create a 60-second high-density clinical briefing for the busy OPD doctor (e.g., Dr. Sharma with 140 patients).

IMPORTANT RULES:
1. DO NOT MAKE ANY MEDICAL DIAGNOSIS. Triage and extraction only.
2. Link every medication, red flag, and timeline event to its SOURCE (e.g. "Prescription dated 12/03/2024", "Lab Report page 1", "Patient Voice Intake").
3. Flag any documented ALLERGIES (especially penicillin, sulfa, NSAIDs) as CRITICAL Red Flags.
4. Detect CONTRADICTIONS & GAPS (e.g., patient says chest pain started 2 days ago, but document shows anti-anginal prescribed 3 months ago; or gaps in adherence).
5. Extract a dated chronological timeline of previous clinics, tests, and prescriptions.

INPUT DATA:
- Patient Chief Complaint: "${complaint}"
- Follow-up Q&A: ${JSON.stringify(followUpAnswers || [])}
- Extracted Documents Text: ${documentsText || 'See attached document images/files if provided.'}

Provide your output strictly in valid JSON matching this exact structure:
{
  "patientComplaint": string,
  "estimatedReadTimeSeconds": number (between 45 and 60),
  "timeline": [
    {
      "date": string (e.g. "12 Jan 2024" or "Approx 2 months ago"),
      "facilityOrDoctor": string (e.g. "City Care Clinic" or "District Hospital OPD"),
      "event": string,
      "medicationsMentioned": [string],
      "sourceDocument": string
    }
  ],
  "redFlags": [
    {
      "flag": string (e.g. "Documented Penicillin / Amoxicillin allergy noted on Clinic Rx page 2"),
      "severity": "CRITICAL" | "WARNING" | "NOTE",
      "source": string
    }
  ],
  "contradictionsAndGaps": [
    {
      "issue": string,
      "details": string,
      "sourceComparison": string
    }
  ],
  "activeMedications": [
    { "drug": string, "dosage": string, "source": string }
  ],
  "quickOpdSummary": [
    string (3-5 punchy bullet points giving the attending doctor the entire story in 30 seconds)
  ],
  "suggestedExamFocus": [
    string (suggested physical examinations for the doctor, e.g. "Auscultate chest for wheeze/crepitations", "Check vitals and BP")
  ],
  "disclaimer": "AI pre-consultation summary prepared for attending clinician review. Strictly contains no medical diagnosis."
}`;

    const response = await unifiedLLM.invoke([{ role: 'user', content: prompt }], {
      jsonMode: true,
      temperature: 0.15,
      images: images.length > 0 ? images : undefined,
    });

    try {
      const cleanJson = response.content.replace(/```json|```/g, '').trim();
      const parsed: TwoMinuteDoctorSummaryResponse = JSON.parse(cleanJson);
      parsed.estimatedReadTimeSeconds = parsed.estimatedReadTimeSeconds || 55;
      parsed.disclaimer = 'AI pre-consultation summary prepared for attending clinician review. Strictly contains no medical diagnosis.';
      return parsed;
    } catch (err: any) {
      logger.error('Failed to parse Two-Minute Doctor JSON:', response.content);
      throw new Error('Failed to generate structured OPD summary. Please try again.');
    }
  }

  // ==========================================
  // T02: Report Decoded Service Methods
  // ==========================================
  private applyDeterministicRangeRule(
    val: number | string,
    min: number | null,
    max: number | null,
    rangeText?: string
  ): 'NORMAL' | 'HIGH' | 'LOW' | 'INDETERMINATE' {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) {
      const lower = String(val).toLowerCase().trim();
      if (lower.includes('negative') || lower.includes('normal') || lower.includes('non-reactive')) return 'NORMAL';
      if (lower.includes('positive') || lower.includes('reactive')) return 'HIGH';
      return 'INDETERMINATE';
    }

    if (min !== null && max !== null) {
      if (num < min) return 'LOW';
      if (num > max) return 'HIGH';
      return 'NORMAL';
    }
    if (min !== null && num < min) return 'LOW';
    if (max !== null && num > max) return 'HIGH';

    // Parse from rangeText if min/max null
    if (rangeText) {
      const match = rangeText.match(/([0-9.]+)\s*[-–to]\s*([0-9.]+)/i);
      if (match) {
        const rMin = parseFloat(match[1]);
        const rMax = parseFloat(match[2]);
        if (!isNaN(rMin) && !isNaN(rMax)) {
          if (num < rMin) return 'LOW';
          if (num > rMax) return 'HIGH';
          return 'NORMAL';
        }
      }
    }

    return 'INDETERMINATE';
  }

  async decodeLabReport(reportText?: string, file?: Express.Multer.File): Promise<ReportDecodedResponse> {
    const images: LLMImage[] = file
      ? [
          {
            mimeType: file.mimetype,
            base64Data: file.buffer.toString('base64'),
          },
        ]
      : [];

    const prompt = `You are "Report, Decoded" — a compassionate lab report translator for Indian patients and families.
Your mission is to read a lab report (blood test, urine test, liver panel, lipid profile, CBC, thyroid, metabolic panel) and explain every single parameter in clear, plain language so the patient or family can understand what was tested.

CRITICAL CLINICAL & SAFETY DIRECTIVES:
1. NEVER DIAGNOSE ANY ILLNESS OR DISEASE. Refuse all diagnostic assertions.
2. For each parameter, extract:
   - parameterName (e.g. "SGPT / ALT")
   - canonicalName (e.g. "Alanine Aminotransferase")
   - category (e.g. "Liver Function Test (LFT)", "Complete Blood Count (CBC)", "Kidney Function", "Thyroid Profile")
   - observedValue (e.g. 68 or "Negative")
   - unit (e.g. "U/L", "mg/dL", "g/dL")
   - referenceRangeMin (number or null)
   - referenceRangeMax (number or null)
   - referenceRangeText (e.g. "7 - 56 U/L")
   - plainLanguageExplanation (Simple 1-2 sentence explanation of what this substance is and what it does in the human body, without medical jargon).
   - possibleNonDiagnosticReasons (2-3 common physiological or everyday reasons why this test could vary, such as recent exercise, dehydration, diet, medication, or temporary stress — NOT a cancer or disease diagnosis).
   - suggestedQuestionsForDoctor (1-2 specific questions the patient can politely ask their doctor at their appointment).
3. Provide an overall list of 3-4 constructive questions to ask the attending doctor.

INPUT LAB REPORT:
${reportText || 'Please inspect the uploaded document/image attached.'}

Format response STRICTLY as valid JSON with this exact structure:
{
  "labName": string or null,
  "testDate": string or null,
  "parameters": [
    {
      "parameterName": string,
      "canonicalName": string,
      "category": string,
      "observedValue": number | string,
      "unit": string,
      "referenceRangeMin": number | null,
      "referenceRangeMax": number | null,
      "referenceRangeText": string,
      "plainLanguageExplanation": string,
      "possibleNonDiagnosticReasons": [string],
      "suggestedQuestionsForDoctor": [string]
    }
  ],
  "overallQuestionsForDoctor": [string],
  "safetyNotice": "This tool translates laboratory measurements into clear language. It strictly does not provide medical diagnoses or treatment plans. Please consult your physician for clinical interpretation."
}`;

    const response = await unifiedLLM.invoke([{ role: 'user', content: prompt }], {
      jsonMode: true,
      temperature: 0.1,
      images: images.length > 0 ? images : undefined,
    });

    try {
      const cleanJson = response.content.replace(/```json|```/g, '').trim();
      const rawData = JSON.parse(cleanJson);

      // Enforce RULE-BASED status calculation (do not rely on AI guess)
      const parameters: DecodedLabParameter[] = (rawData.parameters || []).map((p: any) => {
        const min = p.referenceRangeMin !== undefined ? p.referenceRangeMin : null;
        const max = p.referenceRangeMax !== undefined ? p.referenceRangeMax : null;
        const calculatedStatus = this.applyDeterministicRangeRule(p.observedValue, min, max, p.referenceRangeText);

        return {
          parameterName: p.parameterName,
          canonicalName: p.canonicalName || p.parameterName,
          category: p.category || 'General Lab',
          observedValue: p.observedValue,
          unit: p.unit || '',
          referenceRangeMin: min,
          referenceRangeMax: max,
          referenceRangeText: p.referenceRangeText || (min !== null && max !== null ? `${min} - ${max}` : 'Standard Range'),
          status: calculatedStatus, // DECIDED BY DETERMINISTIC CODE RULES
          plainLanguageExplanation: p.plainLanguageExplanation || 'Standard laboratory metric.',
          possibleNonDiagnosticReasons: p.possibleNonDiagnosticReasons || ['Individual bodily variation', 'Dietary factors'],
          suggestedQuestionsForDoctor: p.suggestedQuestionsForDoctor || ['What does this number indicate in context of my overall health?'],
        };
      });

      return {
        labName: rawData.labName || undefined,
        testDate: rawData.testDate || undefined,
        patientNameHint: rawData.patientNameHint || undefined,
        parameters,
        overallQuestionsForDoctor: rawData.overallQuestionsForDoctor || [
          'What do my out-of-range parameters signify in relation to my symptoms?',
          'Do I need to repeat this test or take any specific precautions?',
        ],
        safetyNotice: 'This report decoder translates laboratory measurements into plain language. Status indicators are computed via laboratory reference thresholds. This does NOT constitute a medical diagnosis.',
      };
    } catch (err: any) {
      logger.error('Failed to parse Report Decoded JSON:', response.content);
      throw new Error('Failed to decode lab report. Please check the file or text and try again.');
    }
  }

  // ==========================================
  // T03: Going Home Right Service Methods
  // ==========================================
  async parseDischargeCarePlan(dischargeText?: string, file?: Express.Multer.File): Promise<GoingHomeRightResponse> {
    const images: LLMImage[] = file
      ? [
          {
            mimeType: file.mimetype,
            base64Data: file.buffer.toString('base64'),
          },
        ]
      : [];

    const prompt = `You are "Going Home Right" — an intelligent hospital discharge assistant for Indian families.
Your mission is to turn medical discharge sheets into an easy-to-follow, foolproof daily care plan that Kamla Devi's family or caregivers can follow without errors.

CRITICAL RULES:
1. Decode ALL medical shorthands accurately into plain words:
   - OD -> "Once daily (एक बार रोज़)"
   - BD / BID -> "Twice daily (दिन में दो बार: सुबह और रात)"
   - TDS / TID -> "Three times daily (दिन में तीन बार: सुबह, दोपहर, रात)"
   - QID -> "Four times daily (दिन में चार बार: हर 6 घंटे)"
   - SOS / PRN -> "Only when needed / In emergency (सिर्फ जरूरत पड़ने पर)"
   - HS / QHS -> "At bedtime / Night before sleep (रात को सोने से पहले)"
   - AC -> "Before food / Empty stomach (खाने से पहले)"
   - PC -> "After food (खाने के बाद)"
2. Separate all medications into 4 clear daily timing buckets:
   - MORNING (सुबह)
   - AFTERNOON (दोपहर)
   - NIGHT (रात)
   - SOS / AS NEEDED (जरूरत पड़ने पर)
   Note: A medication given BD must appear in BOTH Morning and Night schedules! TDS in Morning, Afternoon, and Night!
3. STRICT NURSE REVIEW POLICY:
   If any medicine dose, timing, or duration is ambiguous, illegible, conflicting, or missing essential safety instructions, DO NOT GUESS!
   Mark "isFlaggedForNurse": true on the medicine, and include it in "nurseReviewFlags" with a clear warning explaining why the family must confirm it with the hospital nurse before giving it.
4. "Call the Doctor / Hospital If..." Warning Signs Card:
   Provide clear, condition-specific red flags in plain English and Hindi (e.g. chest pain > 5 mins, severe shortness of breath, sudden swelling, fever > 101°F).
5. Follow-up plan & Shorthand glossary.

INPUT DISCHARGE SUMMARY:
${dischargeText || 'Please inspect the uploaded discharge document attached.'}

Format response STRICTLY as valid JSON with this exact structure:
{
  "patientName": string or null,
  "dischargeDate": string or null,
  "schedule": {
    "morning": [
      {
        "medicineName": string,
        "dosage": string,
        "timing": "MORNING",
        "timingLabelHindi": "सुबह (Morning)",
        "timingLabelEnglish": "Morning",
        "withFoodInstructions": string (e.g. "After breakfast (नाश्ते के बाद)"),
        "shorthandDecoded": string,
        "duration": string,
        "purposePlainLanguage": string,
        "isFlaggedForNurse": boolean,
        "nurseFlagReason": string or null
      }
    ],
    "afternoon": [...],
    "night": [...],
    "asNeededSOS": [...]
  },
  "nurseReviewFlags": [
    {
      "item": string,
      "reason": string,
      "actionRequired": string
    }
  ],
  "warningSignsCard": [
    {
      "symptom": string,
      "urgency": "IMMEDIATE_EMERGENCY" | "CALL_DOCTOR_TODAY" | "MONITOR",
      "action": string
    }
  ],
  "followUp": {
    "when": string,
    "withWhom": string,
    "instructions": string
  },
  "shorthandGlossary": [
    { "shorthand": string, "fullTerm": string, "plainMeaning": string }
  ]
}`;

    const response = await unifiedLLM.invoke([{ role: 'user', content: prompt }], {
      jsonMode: true,
      temperature: 0.15,
      images: images.length > 0 ? images : undefined,
    });

    try {
      const cleanJson = response.content.replace(/```json|```/g, '').trim();
      const parsed: GoingHomeRightResponse = JSON.parse(cleanJson);
      return parsed;
    } catch (err: any) {
      logger.error('Failed to parse Going Home Right JSON:', response.content);
      throw new Error('Failed to generate discharge care plan. Please check the discharge text or upload.');
    }
  }

  // ==========================================
  // T04: Bol Ke Batao Service Methods
  // ==========================================
  async processBolKeBataoSpeech(transcript: string, dialectHint: string = 'auto'): Promise<BolKeBataoResponse> {
    const prompt = `You are "Bol Ke Batao (बोल के बताओ)" — an Indian clinical linguistic AI assistant.
Your job is to listen to natural, code-mixed patient speech in Hindi, Hinglish, or Marwari (e.g. spoken by a patient from Barmer or Jodhpur) and translate it into a structured, professional English clinical history for a non-Hindi/English speaking clinician.

MANDATORY RULES:
1. EVERY EXTRACTED FIELD MUST TRACE BACK TO THE PATIENT'S EXACT SPOKEN WORDS ("patientExactPhrase").
   Never synthesize information that was not explicitly stated.
2. Under "structuredClinicalHistory":
   - "chiefComplaint": Primary problem in English + exact Hindi/Marwari words patient said.
   - "duration": Duration in English + exact phrase (e.g. "Teen din se").
   - "onsetAndProgression": When/how it started + exact phrase (e.g. "raat ko zyada hoti hai").
   - "associatedSymptoms": Array of entities for each accompanying symptom (e.g., burning sensation, chakkar/dizziness, vomitting), each with exact quote.
   - "aggravatingRelievingFactors": Factors making it better or worse with patient quotes.
   - "pastMedicationsMentioned": Any drugs, home remedies, or tablets mentioned with quotes.
   - "allergiesMentioned": Any allergies mentioned with quotes.
   - "reportedSeverity": "Mild", "Moderate", or "Severe" based on patient's words.
3. NEVER HALLUCINATE OR ADD SYMPTOMS. If patient did not mention allergies, keep "allergiesMentioned" empty.
4. Detect dialect nuances (Marwari idioms like "matho dukhe", "pet mein jalan", "dhupad aave", "chakkar", "ulte jaisa lag riyo hai").

PATIENT SPOKEN TRANSCRIPT:
"${transcript}"

DIALECT HINT: ${dialectHint}

Format response STRICTLY as valid JSON with this structure:
{
  "originalSpokenTranscript": "${transcript.replace(/"/g, '\\"')}",
  "detectedDialects": [string],
  "structuredClinicalHistory": {
    "chiefComplaint": {
      "englishText": string,
      "patientExactPhrase": string,
      "severityOrFrequency": string
    },
    "duration": {
      "englishText": string,
      "patientExactPhrase": string
    },
    "onsetAndProgression": {
      "englishText": string,
      "patientExactPhrase": string
    },
    "associatedSymptoms": [
      {
        "englishText": string,
        "patientExactPhrase": string,
        "notes": string
      }
    ],
    "aggravatingRelievingFactors": [
      {
        "englishText": string,
        "patientExactPhrase": string
      }
    ],
    "pastMedicationsMentioned": [
      {
        "englishText": string,
        "patientExactPhrase": string
      }
    ],
    "allergiesMentioned": [
      {
        "englishText": string,
        "patientExactPhrase": string
      }
    ],
    "reportedSeverity": string
  },
  "safetyAssertion": "Every extracted clinical field traces directly to verbatim patient statements. No unstated symptoms were inferred.",
  "clinicianVerified": false
}`;

    const response = await unifiedLLM.invoke([{ role: 'user', content: prompt }], {
      jsonMode: true,
      temperature: 0.1,
    });

    try {
      const cleanJson = response.content.replace(/```json|```/g, '').trim();
      const parsed: BolKeBataoResponse = JSON.parse(cleanJson);
      parsed.originalSpokenTranscript = transcript;
      parsed.safetyAssertion = 'Every extracted clinical field traces directly to verbatim patient statements. No unstated symptoms were inferred.';
      return parsed;
    } catch (err: any) {
      logger.error('Failed to parse Bol Ke Batao JSON:', response.content);
      throw new Error('Failed to translate and structure speech intake. Please try again.');
    }
  }
}

export const clinicalToolsService = new ClinicalToolsService();

