import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export class CryptoUtil {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create a deterministic hash for a given input.
   * This will always return the same hash for the same input.
   */
  static createDeterministicHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Generate a temporary ID for session management
   */
  static generateTempId(): string {
    return crypto.randomUUID();
  }
}
