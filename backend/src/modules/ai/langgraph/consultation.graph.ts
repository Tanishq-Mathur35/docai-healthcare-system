import { StateGraph, END } from '@langchain/langgraph';
import { ConsultationStateAnnotation, ConsultationStateType } from './consultation.state';
import { checkEmergencyNode } from './nodes/checkEmergency';
import { retrieveContextNode } from './nodes/retrieveContext';
import { generateQuestionNode } from './nodes/generateQuestion';
import { evaluateSufficiencyNode } from './nodes/evaluateSufficiency';
import { generateReportNode } from './nodes/generateReport';
import { tavilyEnrichNode } from './nodes/tavilyEnrich';

// Decision edge: check if emergency was flagged
function routeAfterEmergencyCheck(state: ConsultationStateType): string {
  if (state.isEmergencyFlagged) {
    return 'generateReport';
  }
  return 'retrieveContext';
}

// Decision edge: check if enough information has been gathered
function routeAfterSufficiency(state: ConsultationStateType): string {
  if (state.isSufficiencyReached) {
    return 'generateReport';
  }
  return 'generateQuestion';
}

export function buildConsultationGraph() {
  const workflow = new StateGraph(ConsultationStateAnnotation)
    .addNode('checkEmergency', checkEmergencyNode)
    .addNode('retrieveContext', retrieveContextNode)
    .addNode('evaluateSufficiency', evaluateSufficiencyNode)
    .addNode('generateQuestion', generateQuestionNode)
    .addNode('generateReport', generateReportNode)
    .addNode('tavilyEnrich', tavilyEnrichNode)
    .addEdge('__start__', 'checkEmergency')
    .addConditionalEdges('checkEmergency', routeAfterEmergencyCheck, {
      generateReport: 'generateReport',
      retrieveContext: 'retrieveContext',
    })
    .addEdge('retrieveContext', 'evaluateSufficiency')
    .addConditionalEdges('evaluateSufficiency', routeAfterSufficiency, {
      generateReport: 'generateReport',
      generateQuestion: 'generateQuestion',
    })
    .addEdge('generateQuestion', END)
    .addEdge('generateReport', 'tavilyEnrich')
    .addEdge('tavilyEnrich', END);

  return workflow.compile();
}

export const consultationGraph = buildConsultationGraph();
