const VALID_KEY_TYPES = [
  'ssh-rsa',
  'ssh-dss',
  'ssh-ed25519',
  'ecdsa-sha2-nistp256',
  'ecdsa-sha2-nistp384',
  'ecdsa-sha2-nistp521',
];

// Minimum length of the base64-encoded key material for it to represent a
// plausible real key (shortest valid key is ed25519 at ~68 bytes → ~91 base64 chars).
const MIN_KEY_DATA_LENGTH = 60;

/**
 * Validates an SSH public key string of the form "<type> <base64> [comment]".
 * Returns true only when the key type is recognised and the key data is long
 * enough to represent a real key.
 */
export const validateSshKey = (sshKey: string): boolean => {
  const parts = sshKey.trim().split(/\s+/);
  if (parts.length < 2) {
    return false;
  }
  const [keyType, keyData] = parts;
  if (!VALID_KEY_TYPES.includes(keyType)) {
    return false;
  }
  if (keyData.length < MIN_KEY_DATA_LENGTH) {
    return false;
  }
  if (!/^[A-Za-z0-9+/]+=*$/.test(keyData)) {
    return false;
  }
  return true;
};
