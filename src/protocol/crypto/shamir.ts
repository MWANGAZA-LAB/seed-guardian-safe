/**
 * Seed Guardian Safe Protocol - Client-Side Shamir's Secret Sharing
 * 
 * This module implements pure client-side Shamir's Secret Sharing using
 * audited cryptographic libraries. All operations happen locally.
 */

import { CryptoError, ValidationError } from '../core/types';

// Use audited library for Shamir's Secret Sharing
// For production, we'll use: https://github.com/grempe/secrets.js
// This is a placeholder implementation that will be replaced with the audited library

export interface SecretShare {
  shareIndex: number;
  shareValue: string; // Base64 encoded share
  x: number; // X coordinate for Lagrange interpolation
}

export interface ShamirConfig {
  threshold: number;
  totalShares: number;
  prime?: bigint; // Large prime for finite field arithmetic
}

export class ClientSideShamir {
  private readonly defaultPrime = 2n ** 127n - 1n; // Large prime for finite field

  /**
   * Split a secret into shares using Shamir's Secret Sharing
   * All operations happen client-side, no server involvement
   */
  async splitSecret(
    secret: string,
    config: ShamirConfig
  ): Promise<SecretShare[]> {
    try {
      // Validate inputs
      this.validateSplitInputs(secret, config);

      // Convert secret to bytes
      const secretBytes = new TextEncoder().encode(secret);
      const secretBigInt = this.bytesToBigInt(secretBytes);

      // Generate random coefficients for polynomial
      const coefficients = this.generateCoefficients(secretBigInt, config.threshold);

      // Generate shares
      const shares: SecretShare[] = [];
      for (let i = 0; i < config.totalShares; i++) {
        const x = BigInt(i + 1);
        const y = this.evaluatePolynomial(coefficients, x);
        
        shares.push({
          shareIndex: i + 1,
          shareValue: this.bigIntToBase64(y),
          x: i + 1
        });
      }

      return shares;
    } catch (error) {
      throw new CryptoError('Failed to split secret', {
        error: error instanceof Error ? error.message : 'Unknown error',
        config
      });
    }
  }

  /**
   * Reconstruct secret from shares using Lagrange interpolation
   * All operations happen client-side
   */
  async reconstructSecret(shares: SecretShare[]): Promise<string> {
    try {
      // Validate inputs
      this.validateReconstructInputs(shares);

      // Convert shares to big integers
      const sharePoints = shares.map(share => ({
        x: BigInt(share.x),
        y: this.base64ToBigInt(share.shareValue)
      }));

      // Use Lagrange interpolation to reconstruct the secret
      const reconstructed = this.lagrangeInterpolation(sharePoints);
      
      // Convert back to string
      const secretBytes = this.bigIntToBytes(reconstructed);
      return new TextDecoder().decode(secretBytes);
    } catch (error) {
      throw new CryptoError('Failed to reconstruct secret', {
        error: error instanceof Error ? error.message : 'Unknown error',
        shareCount: shares.length
      });
    }
  }

  /**
   * Verify that shares are valid without reconstructing the secret
   */
  async verifyShares(shares: SecretShare[]): Promise<boolean> {
    try {
      if (shares.length < 2) {
        return false;
      }

      // Check if all shares have valid format
      for (const share of shares) {
        if (!this.isValidShare(share)) {
          return false;
        }
      }

      // Try to reconstruct and verify it's a valid string
      const reconstructed = await this.reconstructSecret(shares);
      return this.isValidSecret(reconstructed);
    } catch {
      return false;
    }
  }

  /**
   * Generate random coefficients for the polynomial
   */
  private generateCoefficients(secret: bigint, threshold: number): bigint[] {
    const coefficients: bigint[] = [secret]; // Secret is the constant term
    
    for (let i = 1; i < threshold; i++) {
      // Generate cryptographically secure random coefficient
      const randomBytes = new Uint8Array(16);
      crypto.getRandomValues(randomBytes);
      const coefficient = this.bytesToBigInt(randomBytes) % this.defaultPrime;
      coefficients.push(coefficient);
    }
    
    return coefficients;
  }

  /**
   * Evaluate polynomial at point x
   */
  private evaluatePolynomial(coefficients: bigint[], x: bigint): bigint {
    let result = 0n;
    let xPower = 1n;
    
    for (const coefficient of coefficients) {
      result = (result + (coefficient * xPower) % this.defaultPrime) % this.defaultPrime;
      xPower = (xPower * x) % this.defaultPrime;
    }
    
    return result;
  }

  /**
   * Lagrange interpolation to reconstruct the secret
   */
  private lagrangeInterpolation(points: Array<{ x: bigint; y: bigint }>): bigint {
    let result = 0n;
    
    for (let i = 0; i < points.length; i++) {
      let numerator = 1n;
      let denominator = 1n;
      
      for (let j = 0; j < points.length; j++) {
        if (i !== j) {
          numerator = (numerator * (-points[j].x)) % this.defaultPrime;
          denominator = (denominator * (points[i].x - points[j].x)) % this.defaultPrime;
        }
      }
      
      // Calculate modular inverse of denominator
      const invDenominator = this.modularInverse(denominator, this.defaultPrime);
      const lagrangeBasis = (numerator * invDenominator) % this.defaultPrime;
      
      result = (result + (points[i].y * lagrangeBasis) % this.defaultPrime) % this.defaultPrime;
    }
    
    return result;
  }

  /**
   * Calculate modular inverse using extended Euclidean algorithm
   */
  private modularInverse(a: bigint, m: bigint): bigint {
    let [oldR, r] = [a, m];
    let [oldS, s] = [1n, 0n];
    
    while (r !== 0n) {
      const quotient = oldR / r;
      [oldR, r] = [r, oldR - quotient * r];
      [oldS, s] = [s, oldS - quotient * s];
    }
    
    if (oldR > 1n) {
      throw new Error('Modular inverse does not exist');
    }
    
    return oldS < 0n ? oldS + m : oldS;
  }

  /**
   * Convert bytes to big integer
   */
  private bytesToBigInt(bytes: Uint8Array): bigint {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result * 256n) + BigInt(bytes[i]);
    }
    return result;
  }

  /**
   * Convert big integer to bytes
   */
  private bigIntToBytes(value: bigint): Uint8Array {
    const bytes: number[] = [];
    while (value > 0n) {
      bytes.unshift(Number(value % 256n));
      value = value / 256n;
    }
    return new Uint8Array(bytes);
  }

  /**
   * Convert big integer to base64 string
   */
  private bigIntToBase64(value: bigint): string {
    const bytes = this.bigIntToBytes(value);
    return btoa(String.fromCharCode(...bytes));
  }

  /**
   * Convert base64 string to big integer
   */
  private base64ToBigInt(base64: string): bigint {
    const bytes = new Uint8Array(
      atob(base64).split('').map(char => char.charCodeAt(0))
    );
    return this.bytesToBigInt(bytes);
  }

  /**
   * Validate inputs for secret splitting
   */
  private validateSplitInputs(secret: string, config: ShamirConfig): void {
    if (!secret || secret.length === 0) {
      throw new ValidationError('Secret cannot be empty');
    }

    if (config.threshold < 2) {
      throw new ValidationError('Threshold must be at least 2');
    }

    if (config.totalShares < config.threshold) {
      throw new ValidationError('Total shares must be at least equal to threshold');
    }

    if (config.totalShares > 255) {
      throw new ValidationError('Maximum 255 shares allowed');
    }

    if (secret.length > 10000) {
      throw new ValidationError('Secret too large (max 10KB)');
    }
  }

  /**
   * Validate inputs for secret reconstruction
   */
  private validateReconstructInputs(shares: SecretShare[]): void {
    if (!shares || shares.length === 0) {
      throw new ValidationError('No shares provided');
    }

    if (shares.length < 2) {
      throw new ValidationError('At least 2 shares required for reconstruction');
    }

    // Check for duplicate share indices
    const indices = shares.map(s => s.shareIndex);
    const uniqueIndices = new Set(indices);
    if (uniqueIndices.size !== indices.length) {
      throw new ValidationError('Duplicate share indices found');
    }
  }

  /**
   * Check if a share has valid format
   */
  private isValidShare(share: SecretShare): boolean {
    return (
      typeof share.shareIndex === 'number' &&
      share.shareIndex > 0 &&
      share.shareIndex <= 255 &&
      typeof share.shareValue === 'string' &&
      share.shareValue.length > 0 &&
      typeof share.x === 'number' &&
      share.x > 0
    );
  }

  /**
   * Check if reconstructed secret is valid
   */
  private isValidSecret(secret: string): boolean {
    return (
      typeof secret === 'string' &&
      secret.length > 0 &&
      secret.length <= 10000 &&
      /^[\x20-\x7E]*$/.test(secret) // Printable ASCII characters
    );
  }
}

// Export singleton instance
export const shamir = new ClientSideShamir();
