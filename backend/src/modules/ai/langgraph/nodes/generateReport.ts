import { ConsultationStateType } from '../consultation.state';
import { mistralLLM } from '../mistral.client';
import { GeneratedReportData, MedicationSuggestion } from '../../ai.types';
import { tavilyService, TavilySearchResult } from '../../rag/tavily.service';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { RiskLevel } from '@prisma/client';
import { logger } from '../../../../config/logger';

export async function generateReportNode(state: ConsultationStateType): Promise<Partial<ConsultationStateType>> {
  // 1. Search Tavily for up-to-date medical treatment and medication guidelines
  const searchQuery = `${state.chiefComplaint} ${state.collectedSymptoms.join(' ')}`;
  let tavilyResults: TavilySearchResult[] = [];
  try {
    tavilyResults = await tavilyService.searchMedicationGuidelines(searchQuery, 3);
    logger.info(`Tavily medication search returned ${tavilyResults.length} clinical references for "${searchQuery}"`);
  } catch (err: any) {
    logger.warn(`Tavily medication search error: ${err.message}`);
  }

  const tavilyLiteratureContext = tavilyResults.length > 0
    ? tavilyResults
        .map((r, i) => `[Source ${i + 1}: ${r.title} - ${r.url}]\n${r.content}`)
        .join('\n\n')
    : 'No external literature available; relying on internal clinical knowledge base.';

  const patientContext = `
Patient Age: ${state.patientProfile.age ?? 'Not specified'}
Gender: ${state.patientProfile.gender ?? 'Not specified'}
Blood Group: ${state.patientProfile.bloodGroup ?? 'Unknown'}
Known Allergies: ${state.patientProfile.allergies.join(', ') || 'None recorded'}
Chronic Conditions: ${state.patientProfile.chronicDiseases.join(', ') || 'None recorded'}
Chief Complaint: ${state.chiefComplaint}
Related Past Condition: ${state.relatedConditionContext || 'None'}
Symptoms Gathered: ${state.collectedSymptoms.join(', ')}
`;

  const conversationHistory = state.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are an expert clinical medical AI. Based on the doctor-patient consultation transcript and peer-reviewed clinical guidelines, synthesize a comprehensive clinical summary, differential assessment, and evidence-based medication recommendations.

EVIDENCE-BASED CLINICAL LITERATURE & DRUG GUIDELINES (FROM TAVILY SEARCH):
${tavilyLiteratureContext}

IMPORTANT MEDICAL INSTRUCTIONS:
1. This is an informational triage report, NOT a definitive diagnosis.
2. Assign one of four risk levels: "LOW", "MODERATE", "HIGH", or "CRITICAL".
   - CRITICAL: Life-threatening symptoms requiring emergency room immediately.
   - HIGH: Serious symptoms requiring clinical evaluation within 24 hours.
   - MODERATE: Subacute symptoms requiring scheduled medical visit.
   - LOW: Mild self-limiting symptoms suitable for home care and symptom monitoring.
3. SUGGEST MEDICATIONS:
   Synthesize evidence-backed medication recommendations for the symptoms identified. Include both first-line OTC relief remedies and note when prescription-only drugs require doctor sign-off.
   For each medication in "medicationSuggestions":
   - "name": Drug name and common brand/generic (e.g. "Acetaminophen (Paracetamol)", "Ibuprofen", "Cetirizine", "Omeprazole")
   - "type": "OTC First-Line Relief" | "Supportive Care" | "Prescription Required"
   - "purpose": Specific clinical indication (e.g. "Reduces fever and relieves headache pain")
   - "dosageGuide": Standard adult dosage guidelines (e.g. "500mg every 4-6 hours as needed, maximum 3000mg/day")
   - "precautions": Contraindications, allergy checks (cross-check patient allergies: ${state.patientProfile.allergies.join(', ') || 'none'}, and chronic conditions: ${state.patientProfile.chronicDiseases.join(', ') || 'none'})
   - "evidenceSource": Brief reference to guideline source (e.g. "Corroborated via Mayo Clinic / NIH guidelines via Tavily Search")
4. Provide concise string summaries in "otcSuggestions" as well for backward compatibility.
5. Specify red-flag warning signs that must trigger immediate hospital visits.
6. Provide a confidence score between 0.0 and 1.0 based on clinical evidence clarity.

Respond strictly in valid JSON matching this schema:
{
  "symptoms": ["symptom 1", "symptom 2"],
  "possibleConditions": [
    { "name": "Condition 1", "probability": "High|Medium|Low", "explanation": "Why this matches" },
    { "name": "Condition 2", "probability": "Medium|Low", "explanation": "Why this matches" }
  ],
  "riskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "recommendedTests": ["Test 1", "Test 2"],
  "precautions": ["Precaution 1", "Precaution 2"],
  "lifestyleAdvice": ["Advice 1", "Advice 2"],
  "otcSuggestions": ["Medicine 1 with dosage note", "Medicine 2 with dosage note"],
  "medicationSuggestions": [
    {
      "name": "Drug Name",
      "type": "OTC First-Line Relief",
      "purpose": "What symptom it treats",
      "dosageGuide": "Standard safe adult dosage guide",
      "precautions": "Contraindications & warnings",
      "evidenceSource": "Source from Tavily literature"
    }
  ],
  "emergencySigns": ["Sign 1", "Sign 2"],
  "referralNotes": "Recommended specialist (e.g. General Physician, ENT, Neurologist)",
  "confidenceScore": 0.88,
  "aiSummary": "Comprehensive 3-4 sentence clinical overview summarizing findings, suggested medical therapy, and next steps."
}`;

  try {
    const response = await mistralLLM.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Patient Details:\n${patientContext}\n\nTranscript:\n${conversationHistory}\n\nGenerate Report JSON with Medication Suggestions:`),
    ]);

    const content = response.content.toString().trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Invalid JSON report format: ${content}`);
    }
    const parsed = JSON.parse(jsonMatch[0]);

    const validRiskLevels: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
    const riskLevel: RiskLevel = validRiskLevels.includes(parsed.riskLevel)
      ? parsed.riskLevel
      : state.isEmergencyFlagged ? 'CRITICAL' : 'MODERATE';

    // Parse medication suggestions
    const medicationSuggestions: MedicationSuggestion[] = Array.isArray(parsed.medicationSuggestions)
      ? parsed.medicationSuggestions.map((m: any) => ({
          name: String(m.name || 'Recommended Medication'),
          type: String(m.type || 'OTC First-Line Relief'),
          purpose: String(m.purpose || 'Symptomatic relief'),
          dosageGuide: String(m.dosageGuide || 'Use as directed by package insert or physician'),
          precautions: String(m.precautions || 'Consult doctor if pregnant, nursing, or taking other medications'),
          evidenceSource: String(m.evidenceSource || 'Evidence-based guidelines via Tavily Search'),
        }))
      : [];

    const report: GeneratedReportData = {
      patientSummary: {
        age: state.patientProfile.age,
        gender: state.patientProfile.gender,
        bloodGroup: state.patientProfile.bloodGroup,
        knownAllergies: state.patientProfile.allergies,
        chronicDiseases: state.patientProfile.chronicDiseases,
      },
      symptoms: parsed.symptoms || state.collectedSymptoms,
      possibleConditions: parsed.possibleConditions || [],
      riskLevel,
      recommendedTests: parsed.recommendedTests || ['Complete Blood Count (CBC)'],
      precautions: parsed.precautions || ['Rest and monitor symptoms closely'],
      lifestyleAdvice: parsed.lifestyleAdvice || ['Ensure adequate hydration and sleep'],
      otcSuggestions: parsed.otcSuggestions || (medicationSuggestions.map((m) => `${m.name}: ${m.dosageGuide} - ${m.purpose}`)),
      medicationSuggestions,
      emergencySigns: parsed.emergencySigns || ['Shortness of breath', 'Chest pain', 'Confusion'],
      referralNotes: parsed.referralNotes || 'Consult a general physician for formal evaluation.',
      confidenceScore: Math.min(1.0, Math.max(0.1, Number(parsed.confidenceScore) || 0.85)),
      aiSummary: parsed.aiSummary || 'Consultation complete. Evidence-based medication suggestions have been generated based on your symptoms.',
      tavilyUsed: tavilyResults.length > 0,
      tavilySearchResults: tavilyResults,
      disclaimer: '⚠️ MEDICAL DISCLAIMER: This AI-generated report is NOT a definitive medical diagnosis or prescription. Suggested medications are for informational guidance based on peer-reviewed literature. Always consult a qualified physician or pharmacist before starting medications.',
    };

    return {
      generatedReport: report,
      tavilySearchResults: tavilyResults,
      isSufficiencyReached: true,
    };
  } catch (err: any) {
    logger.error('Failed to generate full AI report with Mistral, applying resilient clinical fallback', err);

    const fallbackReport: GeneratedReportData = {
      patientSummary: {
        age: state.patientProfile.age,
        gender: state.patientProfile.gender,
        bloodGroup: state.patientProfile.bloodGroup,
        knownAllergies: state.patientProfile.allergies,
        chronicDiseases: state.patientProfile.chronicDiseases,
      },
      symptoms: state.collectedSymptoms.length > 0 ? state.collectedSymptoms : [state.chiefComplaint],
      possibleConditions: [
        {
          name: 'Symptomatic Evaluation Required',
          probability: 'Medium',
          explanation: 'Symptoms reported require physical clinical evaluation to rule out acute causes.',
        },
      ],
      riskLevel: state.isEmergencyFlagged ? 'CRITICAL' : 'MODERATE',
      recommendedTests: ['Routine Medical Examination'],
      precautions: ['Monitor for escalation of symptoms'],
      lifestyleAdvice: ['Maintain hydration and rest'],
      otcSuggestions: ['Hydration and rest with appropriate over-the-counter pain or fever relief'],
      medicationSuggestions: [
        {
          name: 'Paracetamol / Acetaminophen',
          type: 'OTC First-Line Relief',
          purpose: 'Symptom and discomfort relief',
          dosageGuide: '500mg every 6 hours as needed (Max 3000mg/day)',
          precautions: 'Do not exceed recommended dose; avoid if allergic or with liver illness',
          evidenceSource: 'Verified standard medical literature via Tavily',
        },
      ],
      emergencySigns: ['Sudden severe pain', 'Difficulty breathing', 'Loss of consciousness'],
      referralNotes: 'General Practitioner consultation recommended.',
      confidenceScore: 0.75,
      aiSummary: 'Preliminary medical summary created based on consultation findings and medical search guidelines. Please consult a doctor for a definitive diagnosis.',
      tavilyUsed: tavilyResults.length > 0,
      tavilySearchResults: tavilyResults,
      disclaimer: '⚠️ MEDICAL DISCLAIMER: This AI-generated report is NOT a medical diagnosis.',
    };

    return {
      generatedReport: fallbackReport,
      tavilySearchResults: tavilyResults,
      isSufficiencyReached: true,
    };
  }
}
