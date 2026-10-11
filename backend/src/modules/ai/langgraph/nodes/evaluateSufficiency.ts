import { ConsultationStateType } from '../consultation.state';
import { mistralFastLLM } from '../mistral.client';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { logger } from '../../../../config/logger';

export async function evaluateSufficiencyNode(state: ConsultationStateType): Promise<Partial<ConsultationStateType>> {
  // If emergency is flagged or question count reached max, stop immediately
  if (state.isEmergencyFlagged || state.questionCount >= state.maxQuestions) {
    return { isSufficiencyReached: true };
  }

  // Minimum 3 questions needed before evaluating sufficiency
  if (state.questionCount < 3) {
    return { isSufficiencyReached: false };
  }

  const prompt = `You are a clinical decision evaluation assistant.
Chief Complaint: ${state.chiefComplaint}
Collected Symptoms: ${state.collectedSymptoms.join(', ')}
Total Questions Answered: ${state.questionCount}
Max Allowed Questions: ${state.maxQuestions}

Conversation:
${state.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Evaluate whether enough clinical information has been gathered to form a preliminary medical triage report (including possible conditions, risk level, and next steps).
Criteria:
- Onset and duration are known
- Character/severity of main symptoms is known
- Key associated red flags or related symptoms have been probed

Respond ONLY with JSON:
{
  "isSufficient": boolean,
  "confidence": number,
  "reason": "short explanation"
}`;

  try {
    const response = await mistralFastLLM.invoke([
      new SystemMessage('You evaluate diagnostic interview completeness. Output JSON only.'),
      new HumanMessage(prompt),
    ]);

    const content = response.content.toString().trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { isSufficiencyReached: state.questionCount >= 5 };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      isSufficiencyReached: !!parsed.isSufficient,
    };
  } catch (err: any) {
    logger.warn(`⚠️ Mistral sufficiency evaluation notice: ${err.message}`);
    return { isSufficiencyReached: state.questionCount >= 5 };
  }
}
