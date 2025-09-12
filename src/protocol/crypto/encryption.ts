/**
 * Seed Guardian Safe Protocol - Client-Side Encryption
 * 
 * This module implements pure client-side encryption for guardian shares
 * using Web Crypto API and audited libraries.
 */

import { 
  CryptoError, 
  EncryptionError, 
  KeyGenerationError,
  handleProtocolError 
} from '../errors';
import { KeyPair } from '../core/types';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
  algorithm: string;
  keyId: string;
}

export interface DecryptionResult {
  decryptedData: string;
  verified: boolean;
}

export class ClientSideEncryption {
  private readonly algorithm = 'AES-GCM';
  private readonly keyLength = 256;

  /**
   * Generate a new RSA key pair for guardian encryption
   */
  async generateKeyPair(): Promise<KeyPair> {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      // Export public key
      const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyPem = this.bufferToPem(publicKeyBuffer, 'PUBLIC KEY');

      // Export private key
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKeyPem = this.bufferToPem(privateKeyBuffer, 'PRIVATE KEY');

      const keyId = await this.generateKeyId(publicKeyPem);

      return {
        publicKey: publicKeyPem,
        privateKey: privateKeyPem,
        keyId,
        algorithm: 'RSA-OAEP',
        keySize: 2048,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw handleProtocolError(
        new KeyGenerationError('Failed to generate key pair', { 
          algorithm: 'RSA-OAEP',
          keySize: 2048 
        }),
        { operation: 'generateKeyPair' }
      );
    }
  }

  /**
   * Encrypt data with RSA public key
   */
  async encryptWithRSA(
    data: string,
    publicKeyPem: string,
    keyId: string
  ): Promise<EncryptionResult> {
    try {
      // Import public key
      const publicKey = await this.importRSAPublicKey(publicKeyPem);

      // Convert data to buffer
      const dataBuffer = new TextEncoder().encode(data);

      // Encrypt with RSA-OAEP
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        dataBuffer
      );

      return {
        encryptedData: this.bufferToBase64(encryptedBuffer),
        iv: '', // Not used in RSA
        tag: '', // Not used in RSA
        algorithm: 'RSA-OAEP',
        keyId,
      };
    } catch (error) {
      throw handleProtocolError(
        new EncryptionError('Failed to encrypt with RSA', { 
          keyId,
          dataLength: data.length 
        }),
        { operation: 'encryptWithRSA', keyId }
      );
    }
  }

  /**
   * Decrypt data with RSA private key
   */
  async decryptWithRSA(
    encryptedData: string,
    privateKeyPem: string,
    keyId: string
  ): Promise<DecryptionResult> {
    try {
      // Import private key
      const privateKey = await this.importRSAPrivateKey(privateKeyPem);

      // Convert encrypted data to buffer
      const encryptedBuffer = this.base64ToBuffer(encryptedData);

      // Decrypt with RSA-OAEP
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKey,
        encryptedBuffer
      );

      const decryptedData = new TextDecoder().decode(decryptedBuffer);

      return {
        decryptedData,
        verified: true, // RSA-OAEP provides authentication
      };
    } catch (error) {
      throw handleProtocolError(
        new EncryptionError('Failed to decrypt with RSA', { 
          keyId,
          encryptedDataLength: encryptedData.length 
        }),
        { operation: 'decryptWithRSA', keyId }
      );
    }
  }

  /**
   * Encrypt data with AES-GCM (for local storage)
   */
  async encryptWithAES(
    data: string,
    password: string
  ): Promise<EncryptionResult> {
    try {
      // Generate key from password using PBKDF2
      const key = await this.deriveKeyFromPassword(password);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Convert data to buffer
      const dataBuffer = new TextEncoder().encode(data);

      // Encrypt with AES-GCM
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        key,
        dataBuffer
      );

      // Extract tag from encrypted data
      const tagLength = 16; // 128 bits
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const ciphertext = encryptedArray.slice(0, -tagLength);
      const tag = encryptedArray.slice(-tagLength);

      return {
        encryptedData: this.bufferToBase64(ciphertext),
        iv: this.bufferToBase64(iv),
        tag: this.bufferToBase64(tag),
        algorithm: this.algorithm,
        keyId: await this.generateKeyId(password),
      };
    } catch (error) {
      throw handleProtocolError(
        new EncryptionError('Failed to encrypt with AES', { 
          dataLength: data.length,
          algorithm: 'AES-GCM' 
        }),
        { operation: 'encryptWithAES' }
      );
    }
  }

  /**
   * Decrypt data with AES-GCM
   */
  async decryptWithAES(
    encryptedData: string,
    iv: string,
    tag: string,
    password: string
  ): Promise<DecryptionResult> {
    try {
      // Generate key from password using PBKDF2
      const key = await this.deriveKeyFromPassword(password);

      // Convert data to buffers
      const ciphertextBuffer = this.base64ToBuffer(encryptedData);
      const ivBuffer = this.base64ToBuffer(iv);
      const tagBuffer = this.base64ToBuffer(tag);

      // Combine ciphertext and tag
      const ciphertextArray = new Uint8Array(ciphertextBuffer);
      const tagArray = new Uint8Array(tagBuffer);
      const combinedBuffer = new Uint8Array(ciphertextArray.length + tagArray.length);
      combinedBuffer.set(ciphertextArray);
      combinedBuffer.set(tagArray, ciphertextArray.length);

      // Decrypt with AES-GCM
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: ivBuffer,
        },
        key,
        combinedBuffer
      );

      const decryptedData = new TextDecoder().decode(decryptedBuffer);

      return {
        decryptedData,
        verified: true, // AES-GCM provides authentication
      };
    } catch (error) {
      throw handleProtocolError(
        new EncryptionError('Failed to decrypt with AES', { 
          encryptedDataLength: encryptedData.length,
          algorithm: 'AES-GCM' 
        }),
        { operation: 'decryptWithAES' }
      );
    }
  }

  /**
   * Sign data with private key
   */
  async signData(
    data: string,
    privateKeyPem: string
  ): Promise<string> {
    try {
      // Import private key for signing
      const privateKey = await this.importRSAPrivateKey(privateKeyPem);

      // Convert data to buffer
      const dataBuffer = new TextEncoder().encode(data);

      // Sign with RSA-PSS
      const signatureBuffer = await crypto.subtle.sign(
        {
          name: 'RSA-PSS',
          saltLength: 32,
        },
        privateKey,
        dataBuffer
      );

      return this.bufferToBase64(signatureBuffer);
    } catch (error) {
      throw handleProtocolError(
        new CryptoError('Failed to sign data', 'SIGNING_FAILED', 'critical', { 
          dataLength: data.length 
        }),
        { operation: 'signData' }
      );
    }
  }

  /**
   * Verify signature with public key
   */
  async verifySignature(
    data: string,
    signature: string,
    publicKeyPem: string
  ): Promise<boolean> {
    try {
      // Import public key for verification
      const publicKey = await this.importRSAPublicKey(publicKeyPem);

      // Convert data and signature to buffers
      const dataBuffer = new TextEncoder().encode(data);
      const signatureBuffer = this.base64ToBuffer(signature);

      // Verify signature
      return await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32,
        },
        publicKey,
        signatureBuffer,
        dataBuffer
      );
    } catch (error) {
      throw handleProtocolError(
        new CryptoError('Failed to verify signature', 'SIGNATURE_VERIFICATION_FAILED', 'critical', { 
          signatureLength: signature.length,
          dataLength: data.length 
        }),
        { operation: 'verifySignature' }
      );
    }
  }

  /**
   * Derive key from password using PBKDF2
   */
  private async deriveKeyFromPassword(password: string): Promise<CryptoKey> {
    const passwordBuffer = new TextEncoder().encode(password);
    // Generate cryptographically secure random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Import RSA public key from PEM format
   */
  private async importRSAPublicKey(publicKeyPem: string): Promise<CryptoKey> {
    const publicKeyBuffer = this.pemToBuffer(publicKeyPem);
    
    return await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );
  }

  /**
   * Import RSA private key from PEM format
   */
  private async importRSAPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
    const privateKeyBuffer = this.pemToBuffer(privateKeyPem);
    
    return await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['decrypt']
    );
  }

  /**
   * Convert buffer to PEM format
   */
  private bufferToPem(buffer: ArrayBuffer, type: string): string {
    const base64 = this.bufferToBase64(buffer);
    const chunks = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type}-----\n${chunks.join('\n')}\n-----END ${type}-----`;
  }

  /**
   * Convert PEM format to buffer
   */
  private pemToBuffer(pem: string): ArrayBuffer {
    const base64 = pem
      .replace(/-----BEGIN [A-Z ]+-----/, '')
      .replace(/-----END [A-Z ]+-----/, '')
      .replace(/\s/g, '');
    
    return this.base64ToBuffer(base64);
  }

  /**
   * Convert buffer to base64 string
   */
  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  /**
   * Convert base64 string to buffer
   */
  private base64ToBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate unique key ID
   */
  private async generateKeyId(keyData: string): Promise<string> {
    const dataBuffer = new TextEncoder().encode(keyData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }
}

// Export singleton instance
export const encryption = new ClientSideEncryption();
