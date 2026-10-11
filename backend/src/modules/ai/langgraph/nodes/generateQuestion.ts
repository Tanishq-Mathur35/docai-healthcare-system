import { ConsultationStateType } from '../consultation.state';
import { mistralLLM } from '../mistral.client';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { logger } from '../../../../config/logger';

export async function generateQuestionNode(state: ConsultationStateType): Promise<Partial<ConsultationStateType>> {
  // If emergency flagged, do not generate normal diagnostic questions
  if (state.isEmergencyFlagged) {
    const alertMessage = `EMERGENCY ALERT: Based on your symptoms (${state.emergencyReason}), you require immediate medical evaluation. Please call your local emergency number (e.g. 911, 112) or go to the nearest emergency room immediately.`;
    return {
      currentQuestion: alertMessage,
      messages: [
        {
          role: 'assistant',
          content: alertMessage,
          timestamp: new Date().toISOString(),
        },
      ],
      isSufficiencyReached: true,
    };
  }

  const patientContext = `
Patient Age: ${state.patientProfile.age ?? 'Unknown'}
Gender: ${state.patientProfile.gender ?? 'Unknown'}
Known Allergies: ${state.patientProfile.allergies.join(', ') || 'None'}
Chronic Diseases: ${state.patientProfile.chronicDiseases.join(', ') || 'None'}
Chief Complaint: ${state.chiefComplaint}
${state.relatedConditionContext ? `Related Medical Condition Context: ${state.relatedConditionContext}` : ''}
Symptoms identified so far: ${state.collectedSymptoms.join(', ') || 'None'}
Questions asked so far: ${state.questionCount} of maximum ${state.maxQuestions}
`;

  const conversationHistory = state.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are an empathetic, clinical AI doctor conducting an adaptive medical interview.
Your goal is to ask ONE targeted, precise follow-up question to narrow down the patient's symptoms, onset, severity, aggravating/relieving factors, and associated signs.
RULES:
1. NEVER repeat a question already asked in the conversation.
2. Formulate only ONE clear, compassionate question at a time.
3. If a previous medical condition was marked relevant, explicitly factor it into your line of inquiry.
4. In your response, extract any newly mentioned symptoms and formulate the next question.

Output JSON only in this format:
{
  "newSymptoms": ["symptom1", "symptom2"],
  "question": "Your single follow-up question here"
}`;

  const userPrompt = `
Context:
${patientContext}

Conversation:
${conversationHistory || 'Consultation just started.'}

Generate the next question in JSON:`;

  try {
    const response = await mistralLLM.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const content = response.content.toString().trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Invalid JSON response: ${content}`);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const question = parsed.question || "Could you describe when these symptoms first started and if anything makes them better or worse?";
    const newSymptoms: string[] = Array.isArray(parsed.newSymptoms) ? parsed.newSymptoms : [];

    return {
      currentQuestion: question,
      collectedSymptoms: Array.from(new Set([...state.collectedSymptoms, ...newSymptoms])),
      questionCount: state.questionCount + 1,
      messages: [
        {
          role: 'assistant',
          content: question,
          timestamp: new Date().toISOString(),
        },
      ],
    };
  } catch (err: any) {
    logger.warn(`⚠️ Question generation fallback notice: ${err.message}. Synthesizing dynamic clinical inquiry.`);

    const lastUserMsg = [...state.messages].reverse().find((m) => m.role === 'user')?.content || state.chiefComplaint;
    const complaint = (state.chiefComplaint || '').toLowerCase();

    // Context-sensitive dynamic inquiries tailored directly to what the patient described
    let fallbackQuestion = `Regarding your symptoms of "${state.chiefComplaint}", could you tell me how long this has been happening and if the severity changes throughout the day?`;

    if (complaint.includes('pain') || complaint.includes('ache') || complaint.includes('hurt')) {
      if (state.questionCount === 0) {
        fallbackQuestion = `I hear you're experiencing discomfort related to "${state.chiefComplaint}". On a scale of 1 to 10, how intense is the discomfort right now, and is it constant, throbbing, or sharp?`;
      } else if (state.questionCount === 1) {
        fallbackQuestion = `Does the pain stay in one specific spot, or does it radiate or spread to any surrounding areas?`;
      } else if (state.questionCount === 2) {
        fallbackQuestion = `Are you noticing any other associated symptoms alongside the discomfort, such as fever, dizziness, or nausea?`;
      } else {
        fallbackQuestion = `Have you tried any medications or home remedies so far, and does anything specific bring you temporary relief?`;
      }
    } else if (complaint.includes('cough') || complaint.includes('cold') || complaint.includes('throat') || complaint.includes('fever')) {
      if (state.questionCount === 0) {
        fallbackQuestion = `For how many days have you had these symptoms, and have you measured your temperature recently?`;
      } else if (state.questionCount === 1) {
        fallbackQuestion = `Is your cough dry, or are you bringing up any phlegm or mucus? Have you noticed any chest congestion?`;
      } else {
        fallbackQuestion = `Are you having any difficulty swallowing, shortness of breath, or headache accompanying this?`;
      }
    } else if (complaint.includes('stomach') || complaint.includes('digest') || complaint.includes('nausea') || complaint.includes('diarrhea')) {
      if (state.questionCount === 0) {
        fallbackQuestion = `When did this stomach discomfort start, and is it noticeably worse before or after meals?`;
      } else {
        fallbackQuestion = `Have you experienced any vomiting, fever, or signs of dehydration such as increased thirst or lightheadedness?`;
      }
    } else {
      if (state.questionCount === 0) {
        fallbackQuestion = `I want to understand your experience with "${state.chiefComplaint}". When did you first notice this beginning, and has it become more frequent or severe?`;
      } else if (state.questionCount === 1) {
        fallbackQuestion = `Reflecting on "${lastUserMsg.slice(0, 45)}...", does anything in your daily routine trigger or worsen these symptoms?`;
      } else {
        fallbackQuestion = `Have you taken any medications or tried any treatments for relief so far, and did they make a difference?`;
      }
    }

    return {
      currentQuestion: fallbackQuestion,
      questionCount: state.questionCount + 1,
      messages: [
        {
          role: 'assistant',
          content: fallbackQuestion,
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }
}
