import crypto from 'node:crypto';

/**
 * Constant-time comparison for secrets and tokens to prevent timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a standard UUID v4.
 */
export function generateUuid(): string {
  return crypto.randomUUID();
}

/**
 * Formats a date into a strict UTC ISO-8601 string.
 */
export function toUtcIsoString(date = new Date()): string {
  return date.toISOString();
}

/**
 * Validates whether an amount is a valid positive integer representing paise.
 */
export function isValidPaise(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
}
