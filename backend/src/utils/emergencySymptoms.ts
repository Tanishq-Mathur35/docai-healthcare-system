// Red-flag symptom keywords for emergency escalation
export const EMERGENCY_KEYWORDS = [
  'chest pain',
  'chest tightness',
  'heart attack',
  'difficulty breathing',
  'shortness of breath',
  'cannot breathe',
  'stroke',
  'facial drooping',
  'arm weakness',
  'speech difficulty',
  'sudden severe headache',
  'thunderclap headache',
  'loss of consciousness',
  'unconscious',
  'unresponsive',
  'seizure',
  'convulsion',
  'suicidal',
  'self harm',
  'overdose',
  'severe bleeding',
  'coughing blood',
  'vomiting blood',
  'blood in stool',
  'anaphylaxis',
  'throat closing',
  'severe allergic',
  'diabetic coma',
  'blood sugar very high',
  'blood sugar very low',
  'severe abdominal pain',
  'appendicitis',
  'paralysis',
  'vision loss',
  'sudden blindness',
];

export function detectEmergency(text: string): { isEmergency: boolean; matchedKeywords: string[] } {
  const lowerText = text.toLowerCase();
  const matchedKeywords = EMERGENCY_KEYWORDS.filter((kw) => lowerText.includes(kw));
  return {
    isEmergency: matchedKeywords.length > 0,
    matchedKeywords,
  };
}
