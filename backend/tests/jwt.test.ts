import { signAccessToken, verifyAccessToken, hashToken, generateSecureToken } from '../src/utils/jwt';

// Mock minimal env for testing
process.env.JWT_ACCESS_SECRET = 'test_super_secret_jwt_access_key_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_super_secret_jwt_refresh_key_32_characters_long';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';

describe('JWT Utilities & Cryptographic Functions', () => {
  const mockPayload = {
    id: 'user-uuid-12345',
    email: 'testdoctor@example.com',
    role: 'DOCTOR',
    firstName: 'Sarah',
    lastName: 'Connor',
  };

  it('should successfully sign and verify an access token', () => {
    const token = signAccessToken(mockPayload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = verifyAccessToken(token);
    expect(verified.id).toBe(mockPayload.id);
    expect(verified.email).toBe(mockPayload.email);
    expect(verified.role).toBe(mockPayload.role);
    expect(verified.firstName).toBe(mockPayload.firstName);
  });

  it('should produce consistent sha256 hashes for refresh token rotation store', () => {
    const rawToken = 'sample_refresh_token_string_random';
    const hash1 = hashToken(rawToken);
    const hash2 = hashToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 output length
  });

  it('should generate cryptographically secure unique tokens', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    expect(token1).not.toBe(token2);
    expect(token1).toHaveLength(64); // 32 bytes hex
  });
});
