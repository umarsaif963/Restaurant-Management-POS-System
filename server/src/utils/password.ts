import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

const BCRYPT_ROUNDS = 12;

/**
 * Hash a plaintext password using bcrypt (module 3). Cost factor matches the
 * seed data so existing accounts remain valid.
 */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash. Returns `false` (never
 * throws) when the hash is malformed, keeping timing behaviour consistent.
 */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?';
const ALPHABET = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;

/**
 * Generate a single-use temporary password for a newly invited employee.
 *
 * The result always contains at least one letter and one digit so it satisfies
 * the same password policy as a user-chosen password, and it is 14 characters
 * long so it stays inside bcrypt's 72 byte limit.
 */
export function generateTemporaryPassword(length = 14): string {
  const chars: string[] = [
    LOWERCASE[randomInt(LOWERCASE.length)],
    DIGITS[randomInt(DIGITS.length)],
  ];
  while (chars.length < length) {
    chars.push(ALPHABET[randomInt(ALPHABET.length)]);
  }
  // Shuffle so the guaranteed characters are not always in the same position.
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }
  return chars.join('');
}