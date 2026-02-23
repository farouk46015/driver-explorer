import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedVisitorId: string | null = null;

/**
 * Get the browser fingerprint (visitor ID)
 * This is cached after the first call for performance
 */
export async function getFingerprint(): Promise<string> {
  if (cachedVisitorId) {
    return cachedVisitorId;
  }

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedVisitorId = result.visitorId;
    return cachedVisitorId;
  } catch (error) {
    console.error('Error getting fingerprint:', error);
    // Fallback to a random ID if fingerprinting fails
    const fallbackId = `fallback_${Math.random().toString(36).substring(2, 15)}`;
    cachedVisitorId = fallbackId;
    return fallbackId;
  }
}

/**
 * Clear the cached fingerprint (useful for testing)
 */
export function clearFingerprintCache(): void {
  cachedVisitorId = null;
}
