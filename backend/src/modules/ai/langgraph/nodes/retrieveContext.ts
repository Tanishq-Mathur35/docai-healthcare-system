import { ConsultationStateType } from '../consultation.state';
import { ragService } from '../../rag/rag.service';

export async function retrieveContextNode(state: ConsultationStateType): Promise<Partial<ConsultationStateType>> {
  // If the patient marked a condition relevant or if they have past records
  if (state.conditionRelevance === 'RELEVANT' || state.pastConditions.length > 0) {
    const contexts = await ragService.retrievePatientContext(
      state.patientId,
      state.chiefComplaint,
      state.relatedConditionId
    );

    const formattedContext = ragService.formatContextForPrompt(contexts);

    return {
      relatedConditionContext: formattedContext,
    };
  }

  return {};
}
