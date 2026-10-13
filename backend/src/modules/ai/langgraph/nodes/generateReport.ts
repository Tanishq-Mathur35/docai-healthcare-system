import { ConsultationStateType } from '../consultation.state';
import { mistralLLM } from '../mistral.client';
import { GeneratedReportData, HomeRemedy } from '../../ai.types';
import { tavilyService, TavilySearchResult } from '../../rag/tavily.service';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { RiskLevel } from '@prisma/client';
import { logger } from '../../../../config/logger';

export async function generateReportNode(state: ConsultationStateType): Promise<Partial<ConsultationStateType>> {
  // 1. Search Tavily for up-to-date supportive care, natural remedies, and clinical precautions
  const searchQuery = `evidence based supportive care home remedies precautions lifestyle: ${state.chiefComplaint} ${state.collectedSymptoms.join(' ')}`;
  let tavilyResults: TavilySearchResult[] = [];
  try {
    tavilyResults = await tavilyService.searchMedicationGuidelines(searchQuery, 3);
    logger.info(`Tavily clinical references returned ${tavilyResults.length} sources for "${searchQuery}"`);
  } catch (err: any) {
    logger.warn(`Tavily search notice: ${err.message}`);
  }

  const tavilyLiteratureContext = tavilyResults.length > 0
    ? tavilyResults
        .map((r, i) => `[Source ${i + 1}: ${r.title} - ${r.url}]\n${r.content}`)
        .join('\n\n')
    : 'Relying on internal clinical knowledge base for natural supportive care.';

  const pastRecordsSummary =
    state.pastConditions && state.pastConditions.length > 0
      ? state.pastConditions
          .map((c) => `${c.conditionName} (${c.conditionType}${c.description ? `: ${c.description}` : ''})`)
          .join('; ')
      : 'None recorded';

  const patientContext = `
Patient Age: ${state.patientProfile.age ?? 'Not specified'}
Gender: ${state.patientProfile.gender ?? 'Not specified'}
Blood Group: ${state.patientProfile.bloodGroup ?? 'Unknown'}
Known Allergies: ${state.patientProfile.allergies.join(', ') || 'None recorded'}
Chronic Conditions: ${state.patientProfile.chronicDiseases.join(', ') || 'None recorded'}
Previous Medical History & Uploaded Records (Surgeries, Heart Attacks, Diabetes, Prescriptions, Lab Reports): ${pastRecordsSummary}
Chief Complaint: ${state.chiefComplaint}
Related Past Condition: ${state.relatedConditionContext || 'None'}
Symptoms Gathered: ${state.collectedSymptoms.join(', ')}
`;

  const conversationHistory = state.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are an expert clinical medical AI. Based on the patient consultation transcript, synthesize a clinical summary, differential assessment, necessary precautions, and evidence-based HOME REMEDIES (Gharelu Nuskhe).

EVIDENCE-BASED CLINICAL SUPPORTIVE CARE LITERATURE:
${tavilyLiteratureContext}

CRITICAL MEDICAL SAFETY DIRECTIVES:
1. STRICTLY NO MEDICATIONS OR PHARMACEUTICAL DRUGS:
   Under NO circumstances should you prescribe, recommend, or mention pharmaceutical drug names (NO paracetamol, acetaminophen, ibuprofen, antibiotics, painkillers, or OTC pharmaceutical brands).
   Prescriptions are solely within the purview of a licensed human physician.
2. PROVIDE ONLY RELEVANT HOME REMEDIES (GHARELU NUSKHE) & SUPPORTIVE CARE:
   Suggest traditional, safe, evidence-supported natural remedies and self-care measures (e.g., warm ginger-honey water, turmeric milk / haldi doodh, steam inhalation, salt water gargling, herbal infusions, hydration, cold/warm compress).
   For each item in "homeRemedies":
   - "remedy": Name of the remedy in English with traditional Hindi/Indian reference (e.g. "Warm Turmeric Milk (Haldi Doodh)", "Ginger-Honey Warm Water (Adrak & Shahad)", "Steam Inhalation (Bhaap)")
   - "preparation": Clear step-by-step preparation instructions
   - "frequency": Safe daily usage frequency (e.g. "Once before sleeping", "Twice daily after meals")
   - "benefit": Physiological soothing mechanism for the reported symptoms
   - "precautions": Contraindications or allergy warnings (cross-check patient allergies: ${state.patientProfile.allergies.join(', ') || 'none'}, and chronic conditions: ${state.patientProfile.chronicDiseases.join(', ') || 'none'})
3. Assign one of four risk levels: "LOW", "MODERATE", "HIGH", or "CRITICAL".
   - CRITICAL: Life-threatening symptoms requiring emergency room immediately.
   - HIGH: Serious symptoms requiring clinical evaluation within 24 hours.
   - MODERATE: Subacute symptoms requiring scheduled medical visit.
   - LOW: Mild self-limiting symptoms suitable for home care and symptom monitoring.
4. Specify clinical red-flag emergency signs that require hospital emergency evaluation.
5. Provide a confidence score between 0.0 and 1.0 based on clinical evidence clarity.

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
  "homeRemedies": [
    {
      "remedy": "Remedy Name (e.g. Warm Turmeric Milk / Haldi Doodh)",
      "preparation": "How to prepare and take",
      "frequency": "Usage frequency",
      "benefit": "How it helps the symptoms",
      "precautions": "Safety notes or contraindications"
    }
  ],
  "emergencySigns": ["Sign 1", "Sign 2"],
  "referralNotes": "Recommended specialist (e.g. General Physician, ENT, Pulmonologist)",
  "confidenceScore": 0.88,
  "aiSummary": "Comprehensive 3-4 sentence clinical overview summarizing findings, supportive home care, and next steps."
}`;

  try {
    const response = await mistralLLM.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Patient Details:\n${patientContext}\n\nTranscript:\n${conversationHistory}\n\nGenerate Report JSON with Home Remedies:`),
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

    // Parse home remedies (gharelu nuskhe)
    const homeRemedies: HomeRemedy[] = Array.isArray(parsed.homeRemedies)
      ? parsed.homeRemedies.map((r: any) => ({
          remedy: String(r.remedy || 'Supportive Natural Care'),
          preparation: String(r.preparation || 'Prepare with clean warm water or ingredients as traditionally advised'),
          frequency: String(r.frequency || '1-2 times daily as needed'),
          benefit: String(r.benefit || 'Symptom relief and soothing support'),
          precautions: r.precautions ? String(r.precautions) : 'Discontinue if irritation or discomfort occurs',
        }))
      : [
          {
            remedy: 'Warm Ginger & Honey Infusion (Adrak-Shahad)',
            preparation: 'Boil freshly crushed ginger in water for 5 minutes, strain, and stir in a spoonful of pure honey when warm.',
            frequency: 'Twice daily after meals',
            benefit: 'Provides natural anti-inflammatory comfort and throat/stomach soothing.',
            precautions: 'Do not give honey to infants under 1 year of age.',
          },
          {
            remedy: 'Steam Inhalation (Bhaap)',
            preparation: 'Inhale steam from warm water with a drop of eucalyptus oil or tulsi leaves for 5-10 minutes.',
            frequency: 'Once to twice daily',
            benefit: 'Moisturizes airways and eases respiratory congestion naturally.',
            precautions: 'Keep a safe distance to prevent hot water burns.',
          },
        ];

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
      recommendedTests: parsed.recommendedTests || ['General Clinical Examination'],
      precautions: parsed.precautions || ['Rest and monitor symptoms closely', 'Avoid cold foods and heavy exertion'],
      lifestyleAdvice: parsed.lifestyleAdvice || ['Ensure adequate hydration (2-3 liters of warm fluids)', 'Ensure 7-8 hours of sleep'],
      homeRemedies,
      emergencySigns: parsed.emergencySigns || ['Shortness of breath', 'Chest pain', 'High persistent fever'],
      referralNotes: parsed.referralNotes || 'Consult a general physician for formal in-person examination.',
      confidenceScore: Math.min(1.0, Math.max(0.1, Number(parsed.confidenceScore) || 0.85)),
      aiSummary: parsed.aiSummary || 'Consultation assessment completed. Supportive home remedies and clinical precautions have been synthesized.',
      tavilyUsed: tavilyResults.length > 0,
      tavilySearchResults: tavilyResults,
      disclaimer: '⚠️ CLINICAL SAFETY NOTICE: This AI assessment is strictly educational and does NOT include pharmaceutical drug prescriptions. All medications must be evaluated and prescribed by a licensed human physician. Home remedies are supportive measures only.',
    };

    return {
      generatedReport: report,
      tavilySearchResults: tavilyResults,
      isSufficiencyReached: true,
    };
  } catch (err: any) {
    logger.error('Failed to generate full AI report with LLM, applying resilient clinical fallback', err);

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
      precautions: [
        'Monitor for escalation of symptoms',
        'Avoid strenuous exertion and maintain rest',
      ],
      lifestyleAdvice: [
        'Drink warm water regularly to maintain optimal hydration',
        'Prioritize 8 hours of quality restful sleep',
      ],
      homeRemedies: [
        {
          remedy: 'Warm Ginger & Honey Decoction (Adrak & Shahad)',
          preparation: 'Crush 1 inch of fresh ginger, boil in 1.5 cups of water for 5 minutes, strain, and mix with 1 teaspoon of honey.',
          frequency: 'Twice daily after meals',
          benefit: 'Soothes throat irritation, supports digestive comfort, and provides natural bio-active antioxidants.',
          precautions: 'Avoid if diabetic without adjusting honey intake; do not give honey to infants.',
        },
        {
          remedy: 'Warm Turmeric Milk (Golden Haldi Doodh)',
          preparation: 'Add half teaspoon of organic turmeric powder and a pinch of black pepper to a glass of warm milk.',
          frequency: 'Once daily before bedtime',
          benefit: 'Curcumin provides natural anti-inflammatory and soothing systemic comfort.',
          precautions: 'Use plant-based milk if lactose intolerant.',
        },
        {
          remedy: 'Steam Inhalation (Vashp / Bhaap)',
          preparation: 'Inhale gentle steam from warm water for 5 to 7 minutes with a clean towel over your head.',
          frequency: '1-2 times daily',
          benefit: 'Relieves congestion, clears nasal passages, and hydrates mucosal lining.',
          precautions: 'Maintain safe distance from hot water container to prevent scalding.',
        },
      ],
      emergencySigns: ['Sudden severe pain', 'Difficulty breathing', 'Loss of consciousness'],
      referralNotes: 'General Practitioner consultation recommended.',
      confidenceScore: 0.75,
      aiSummary: 'Preliminary triage completed based on consultation findings. Evidence-supported home remedies and precautions are provided. Consult a doctor for any pharmaceutical prescriptions.',
      tavilyUsed: tavilyResults.length > 0,
      tavilySearchResults: tavilyResults,
      disclaimer: '⚠️ MEDICAL SAFETY NOTICE: This AI report does NOT prescribe medicines. Only a licensed physician can prescribe drugs. Home remedies are supportive non-pharmacological measures.',
    };

    return {
      generatedReport: fallbackReport,
      tavilySearchResults: tavilyResults,
      isSufficiencyReached: true,
    };
  }
}
