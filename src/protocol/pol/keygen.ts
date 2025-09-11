/**
 * Proof of Life Key Generation and Management
 * 
 * This module handles the generation and management of cryptographic key pairs
 * for the Proof of Life system.
 */

import { PoLKeyPair, PoLError, PoLStorageError } from './types';

export interface KeyGenConfig {
  algorithm: 'ed25519' | 'secp256k1';
  keyId?: string;
  exportable: boolean;
}

export class PoLKeyManager {
  private storage: any; // Will be injected

  constructor(storage?: any) {
    this.storage = storage;
  }

  /**
   * Generate a new PoL key pair
   */
  async generateKeyPair(config: KeyGenConfig): Promise<PoLKeyPair> {
    try {
      const keyId = config.keyId || await this.generateKeyId();
      
      let keyPair: PoLKeyPair;
      
      if (config.algorithm === 'ed25519') {
        keyPair = await this.generateEd25519KeyPair(keyId);
      } else if (config.algorithm === 'secp256k1') {
        keyPair = await this.generateSecp256k1KeyPair(keyId);
      } else {
        throw new PoLError('Unsupported algorithm', 'UNSUPPORTED_ALGORITHM', { algorithm: config.algorithm });
      }

      // Store the key pair if storage is available
      if (this.storage && config.exportable) {
        await this.storage.storeKeyPair(keyPair);
      }

      return keyPair;
    } catch (error) {
      if (error instanceof PoLError) {
        throw error;
      }
      throw new PoLError(
        'Key generation failed',
        'KEY_GENERATION_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Generate Ed25519 key pair
   */
  private async generateEd25519KeyPair(keyId: string): Promise<PoLKeyPair> {
    try {
      // Generate Ed25519 key pair using Web Crypto API
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'Ed25519',
          namedCurve: 'Ed25519',
        },
        true, // extractable
        ['sign', 'verify']
      );

      // Export public key
      const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      const publicKey = this.arrayBufferToBase64(publicKeyBuffer);

      // Export private key
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKey = this.arrayBufferToBase64(privateKeyBuffer);

      return {
        publicKey,
        privateKey,
        keyId,
        algorithm: 'ed25519',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new PoLError(
        'Ed25519 key generation failed',
        'ED25519_GENERATION_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Generate secp256k1 key pair
   */
  private async generateSecp256k1KeyPair(keyId: string): Promise<PoLKeyPair> {
    try {
      // Generate secp256k1 key pair using Web Crypto API
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256', // Using P-256 as secp256k1 is not directly supported
        },
        true, // extractable
        ['sign', 'verify']
      );

      // Export public key
      const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      const publicKey = this.arrayBufferToBase64(publicKeyBuffer);

      // Export private key
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKey = this.arrayBufferToBase64(privateKeyBuffer);

      return {
        publicKey,
        privateKey,
        keyId,
        algorithm: 'secp256k1',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new PoLError(
        'secp256k1 key generation failed',
        'SECP256K1_GENERATION_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Sign data with the private key
   */
  async signData(
    data: string,
    privateKey: string,
    algorithm: 'ed25519' | 'secp256k1'
  ): Promise<string> {
    try {
      const privateKeyBuffer = this.base64ToArrayBuffer(privateKey);
      const dataBuffer = new TextEncoder().encode(data);

      let cryptoKey: CryptoKey;
      
      if (algorithm === 'ed25519') {
        cryptoKey = await crypto.subtle.importKey(
          'pkcs8',
          privateKeyBuffer,
          { name: 'Ed25519' },
          false,
          ['sign']
        );
      } else {
        cryptoKey = await crypto.subtle.importKey(
          'pkcs8',
          privateKeyBuffer,
          { name: 'ECDSA', hash: 'SHA-256' },
          false,
          ['sign']
        );
      }

      const signature = await crypto.subtle.sign(
        algorithm === 'ed25519' ? { name: 'Ed25519' } : { name: 'ECDSA', hash: 'SHA-256' },
        cryptoKey,
        dataBuffer
      );

      return this.arrayBufferToBase64(signature);
    } catch (error) {
      throw new PoLError(
        'Data signing failed',
        'SIGNING_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Verify signature with the public key
   */
  async verifySignature(
    data: string,
    signature: string,
    publicKey: string,
    algorithm: 'ed25519' | 'secp256k1'
  ): Promise<boolean> {
    try {
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKey);
      const signatureBuffer = this.base64ToArrayBuffer(signature);
      const dataBuffer = new TextEncoder().encode(data);

      let cryptoKey: CryptoKey;
      
      if (algorithm === 'ed25519') {
        cryptoKey = await crypto.subtle.importKey(
          'raw',
          publicKeyBuffer,
          { name: 'Ed25519' },
          false,
          ['verify']
        );
      } else {
        cryptoKey = await crypto.subtle.importKey(
          'raw',
          publicKeyBuffer,
          { name: 'ECDSA', hash: 'SHA-256' },
          false,
          ['verify']
        );
      }

      const isValid = await crypto.subtle.verify(
        algorithm === 'ed25519' ? { name: 'Ed25519' } : { name: 'ECDSA', hash: 'SHA-256' },
        cryptoKey,
        signatureBuffer,
        dataBuffer
      );

      return isValid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate a unique key ID
   */
  private async generateKeyId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
    return `pol_key_${timestamp}_${randomHex}`;
  }

  /**
   * Derive a key from a password using PBKDF2
   */
  async deriveKeyFromPassword(
    password: string,
    salt: string,
    iterations: number = 100000
  ): Promise<string> {
    try {
      const passwordBuffer = new TextEncoder().encode(password);
      const saltBuffer = this.base64ToArrayBuffer(salt);

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: iterations,
          hash: 'SHA-256',
        },
        await crypto.subtle.importKey(
          'raw',
          passwordBuffer,
          'PBKDF2',
          false,
          ['deriveKey']
        ),
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const keyBuffer = await crypto.subtle.exportKey('raw', key);
      return this.arrayBufferToBase64(keyBuffer);
    } catch (error) {
      throw new PoLError(
        'Key derivation failed',
        'KEY_DERIVATION_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Encrypt private key with a derived key
   */
  async encryptPrivateKey(
    privateKey: string,
    password: string,
    salt: string
  ): Promise<{ encryptedKey: string; iv: string }> {
    try {
      const derivedKey = await this.deriveKeyFromPassword(password, salt);
      const keyBuffer = this.base64ToArrayBuffer(derivedKey);
      const privateKeyBuffer = new TextEncoder().encode(privateKey);
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'AES-GCM',
        false,
        ['encrypt']
      );

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        privateKeyBuffer
      );

      return {
        encryptedKey: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv.buffer),
      };
    } catch (error) {
      throw new PoLError(
        'Private key encryption failed',
        'ENCRYPTION_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Decrypt private key with a derived key
   */
  async decryptPrivateKey(
    encryptedKey: string,
    password: string,
    salt: string,
    iv: string
  ): Promise<string> {
    try {
      const derivedKey = await this.deriveKeyFromPassword(password, salt);
      const keyBuffer = this.base64ToArrayBuffer(derivedKey);
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedKey);
      const ivBuffer = this.base64ToArrayBuffer(iv);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'AES-GCM',
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        cryptoKey,
        encryptedBuffer
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new PoLError(
        'Private key decryption failed',
        'DECRYPTION_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Generate a random salt
   */
  generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    return this.arrayBufferToBase64(salt.buffer);
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Validate key pair integrity
   */
  async validateKeyPair(keyPair: PoLKeyPair): Promise<boolean> {
    try {
      const testData = 'test_data_for_validation';
      const signature = await this.signData(testData, keyPair.privateKey, keyPair.algorithm);
      const isValid = await this.verifySignature(testData, signature, keyPair.publicKey, keyPair.algorithm);
      return isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get key pair from storage
   */
  async getKeyPair(keyId: string): Promise<PoLKeyPair | null> {
    if (!this.storage) {
      throw new PoLStorageError('Storage not available');
    }

    try {
      return await this.storage.retrieveKeyPair(keyId);
    } catch (error) {
      throw new PoLStorageError(
        'Failed to retrieve key pair',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Delete key pair from storage
   */
  async deleteKeyPair(_keyId: string): Promise<void> {
    if (!this.storage) {
      throw new PoLStorageError('Storage not available');
    }

    try {
      // Implementation depends on storage interface
      // This would typically call storage.deleteKeyPair(keyId)
    } catch (error) {
      throw new PoLStorageError(
        'Failed to delete key pair',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}
