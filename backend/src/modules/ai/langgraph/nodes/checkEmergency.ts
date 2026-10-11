import { ConsultationStateType } from '../consultation.state';
import { detectEmergency } from '../../../../utils/emergencySymptoms';
import { mistralFastLLM } from '../mistral.client';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

export async function checkEmergencyNode(state: ConsultationStateType): Promise<Partial<ConsultationStateType>> {
  const latestUserMessage = [...state.messages].reverse().find((m) => m.role === 'user')?.content || state.chiefComplaint;

  // 1. Fast deterministic keyword matching check
  const keywordResult = detectEmergency(latestUserMessage);
  if (keywordResult.isEmergency) {
    return {
      isEmergencyFlagged: true,
      emergencyReason: `Critical symptoms detected (${keywordResult.matchedKeywords.join(', ')}). Immediate emergency care is advised.`,
    };
  }

  // 2. LLM emergency nuance check for subtle red flags
  try {
    const prompt = `You are a clinical triage safety monitor. Analyze the patient message for acute medical emergencies that require immediate 911 / emergency room intervention (e.g. cardiac arrest signs, stroke signs, severe hemorrhage, acute respiratory distress, anaphylaxis, severe head trauma).
Patient message: "${latestUserMessage}"

Respond ONLY with valid JSON:
{
  "isEmergency": boolean,
  "reason": "Brief explanation if true, otherwise empty"
}`;

    const response = await mistralFastLLM.invoke([
      new SystemMessage('You are a clinical emergency evaluator. Output only JSON.'),
      new HumanMessage(prompt),
    ]);

    const content = response.content.toString().trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.isEmergency) {
        return {
          isEmergencyFlagged: true,
          emergencyReason: parsed.reason || 'Urgent medical escalation required.',
        };
      }
    }
  } catch {
    // Non-blocking fallback
  }

  return { isEmergencyFlagged: false };
}
