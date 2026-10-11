import api from './api';

export const consultationService = {
  start: (chiefComplaint: string) =>
    api.post('/ai/consultation/start', { chiefComplaint }),

  respond: (consultationId: string, answer: string) =>
    api.post(`/ai/consultation/${consultationId}/respond`, { answer }),

  setRelevance: (consultationId: string, conditionId: string, relevance: 'RELEVANT' | 'NOT_RELEVANT') =>
    api.post(`/ai/consultation/${consultationId}/relevance`, { conditionId, relevance }),

  getState: (consultationId: string) =>
    api.get(`/ai/consultation/${consultationId}/state`),

  finish: (consultationId: string) =>
    api.post(`/ai/consultation/${consultationId}/finish`),

  getPdfUrl: (reportId: string) =>
    api.get(`/ai/reports/${reportId}/pdf`),
};
