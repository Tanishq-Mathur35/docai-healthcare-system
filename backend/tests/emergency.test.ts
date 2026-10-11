import { detectEmergency, EMERGENCY_KEYWORDS } from '../src/utils/emergencySymptoms';

describe('Emergency Symptoms Escalation Detector', () => {
  it('should detect critical chest pain and cardiac symptoms', () => {
    const input = 'Patient is experiencing severe chest tightness radiating down left arm with shortness of breath';
    const result = detectEmergency(input);

    expect(result.isEmergency).toBe(true);
    expect(result.matchedKeywords).toContain('chest tightness');
    expect(result.matchedKeywords).toContain('shortness of breath');
  });

  it('should detect stroke red-flags', () => {
    const input = 'Noticed sudden facial drooping and speech difficulty since this morning';
    const result = detectEmergency(input);

    expect(result.isEmergency).toBe(true);
    expect(result.matchedKeywords).toContain('facial drooping');
    expect(result.matchedKeywords).toContain('speech difficulty');
  });

  it('should detect suicidal ideation or self harm', () => {
    const input = 'Feeling completely hopeless and having suicidal thoughts';
    const result = detectEmergency(input);

    expect(result.isEmergency).toBe(true);
    expect(result.matchedKeywords).toContain('suicidal');
  });

  it('should return false for routine non-emergency symptoms', () => {
    const input = 'I have a mild runny nose, slight dry cough, and low-grade fatigue since yesterday';
    const result = detectEmergency(input);

    expect(result.isEmergency).toBe(false);
    expect(result.matchedKeywords).toHaveLength(0);
  });

  it('should be case-insensitive', () => {
    const input = 'ACUTE CHEST PAIN and CANNOT BREATHE';
    const result = detectEmergency(input);

    expect(result.isEmergency).toBe(true);
    expect(result.matchedKeywords).toContain('chest pain');
    expect(result.matchedKeywords).toContain('cannot breathe');
  });
});
