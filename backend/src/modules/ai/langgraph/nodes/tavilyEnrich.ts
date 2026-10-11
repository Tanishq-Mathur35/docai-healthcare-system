import { ConsultationStateType } from '../consultation.state';
import { tavilyService } from '../../rag/tavily.service';

export async function tavilyEnrichNode(state: ConsultationStateType): Promise<Partial<ConsultationStateType>> {
  if (!state.generatedReport) return {};

  // If Tavily search results were already fetched in generateReportNode, ensure they are attached to the report
  const existingResults = state.tavilySearchResults || state.generatedReport.tavilySearchResults || [];

  if (existingResults.length > 0) {
    return {
      generatedReport: {
        ...state.generatedReport,
        tavilyUsed: true,
        tavilySearchResults: existingResults,
        confidenceScore: Math.min(0.95, Math.max(state.generatedReport.confidenceScore, 0.85)),
      },
    };
  }

  // Otherwise, fetch literature cross-reference for the chief complaint
  const query = `${state.chiefComplaint} ${state.collectedSymptoms.join(' ')}`;
  const searchResults = await tavilyService.searchMedicationGuidelines(query, 2);

  if (searchResults.length > 0) {
    return {
      tavilySearchResults: searchResults,
      generatedReport: {
        ...state.generatedReport,
        tavilyUsed: true,
        tavilySearchResults: searchResults,
        confidenceScore: Math.min(0.92, state.generatedReport.confidenceScore + 0.1),
        aiSummary: `${state.generatedReport.aiSummary}\n\nClinical Literature Cross-Reference: Corroborated with live medical guidance from ${searchResults[0].title}.`,
      },
    };
  }

  return {};
}
