/**
 * WebAuthn Integration for Proof of Life
 * 
 * This module provides WebAuthn integration for biometric authentication
 * in the Proof of Life system.
 */

import { WebAuthnCredential, PoLError } from './types';

export interface WebAuthnConfig {
  rpId: string; // Relying Party ID
  rpName: string; // Relying Party Name
  timeout: number; // Timeout in milliseconds
  userVerification: 'required' | 'preferred' | 'discouraged';
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    userVerification?: 'required' | 'preferred' | 'discouraged';
    requireResidentKey?: boolean;
  };
}

export class WebAuthnManager {
  private config: WebAuthnConfig;

  constructor(config: WebAuthnConfig) {
    this.config = config;
  }

  /**
   * Check if WebAuthn is supported by the browser
   */
  isSupported(): boolean {
    try {
      return !!(
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        window.navigator?.credentials &&
        typeof window.navigator.credentials.create === 'function' &&
        typeof window.navigator.credentials.get === 'function'
      );
    } catch {
      return false;
    }
  }

  /**
   * Enroll a new WebAuthn credential for PoL
   */
  async enrollCredential(
    userId: string,
    userName: string,
    userDisplayName: string
  ): Promise<WebAuthnCredential> {
    if (!this.isSupported()) {
      throw new PoLError('WebAuthn not supported', 'WEBAUTHN_NOT_SUPPORTED');
    }

    try {
      // Generate challenge
      const challenge = this.generateChallenge();
      
      // Create credential creation options
      const createOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            id: this.config.rpId,
            name: this.config.rpName,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userName,
            displayName: userDisplayName,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false,
            ...this.config.authenticatorSelection,
          },
          timeout: this.config.timeout,
          attestation: 'direct',
        },
      };

      // Create credential
      const credential = await navigator.credentials.create(createOptions) as PublicKeyCredential;
      
      if (!credential) {
        throw new PoLError('Failed to create WebAuthn credential', 'CREDENTIAL_CREATION_FAILED');
      }

      // Extract credential data
      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKey = this.arrayBufferToBase64(response.getPublicKey()!);
      
      return {
        id: credential.id,
        publicKey: publicKey,
        algorithm: this.getAlgorithmName(response.getPublicKeyAlgorithm()),
        counter: 0,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof PoLError) {
        throw error;
      }
      throw new PoLError(
        'WebAuthn enrollment failed',
        'ENROLLMENT_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Authenticate using WebAuthn credential
   */
  async authenticate(
    credentialId: string,
    challenge: string
  ): Promise<{
    credential: PublicKeyCredential;
    signature: string;
    authenticatorData: string;
    clientDataJSON: string;
  }> {
    if (!this.isSupported()) {
      throw new PoLError('WebAuthn not supported', 'WEBAUTHN_NOT_SUPPORTED');
    }

    try {
      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: this.base64ToArrayBuffer(challenge),
          allowCredentials: [{
            id: this.base64ToArrayBuffer(credentialId),
            type: 'public-key',
            transports: ['internal', 'usb', 'nfc', 'ble'],
          }],
          timeout: this.config.timeout,
          userVerification: this.config.userVerification,
        },
      };

      const credential = await navigator.credentials.get(getOptions) as PublicKeyCredential;
      
      if (!credential) {
        throw new PoLError('WebAuthn authentication failed', 'AUTHENTICATION_FAILED');
      }

      const response = credential.response as AuthenticatorAssertionResponse;
      
      return {
        credential,
        signature: this.arrayBufferToBase64(response.signature),
        authenticatorData: this.arrayBufferToBase64(response.authenticatorData),
        clientDataJSON: this.arrayBufferToBase64(response.clientDataJSON),
      };
    } catch (error) {
      if (error instanceof PoLError) {
        throw error;
      }
      throw new PoLError(
        'WebAuthn authentication failed',
        'AUTHENTICATION_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Verify WebAuthn signature
   */
  async verifySignature(
    signature: string,
    authenticatorData: string,
    clientDataJSON: string,
    publicKey: string,
    _challenge: string
  ): Promise<boolean> {
    try {
      // Import the public key
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKey);
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        publicKeyBuffer,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      );

      // Prepare the data to verify
      const clientDataBuffer = this.base64ToArrayBuffer(clientDataJSON);
      const authenticatorDataBuffer = this.base64ToArrayBuffer(authenticatorData);
      
      // Concatenate authenticatorData and clientDataJSON hash
      const clientDataHash = await crypto.subtle.digest('SHA-256', clientDataBuffer);
      const dataToVerify = new Uint8Array(authenticatorDataBuffer.byteLength + clientDataHash.byteLength);
      dataToVerify.set(new Uint8Array(authenticatorDataBuffer), 0);
      dataToVerify.set(new Uint8Array(clientDataHash), authenticatorDataBuffer.byteLength);

      // Verify the signature
      const signatureBuffer = this.base64ToArrayBuffer(signature);
      const isValid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        cryptoKey,
        signatureBuffer,
        dataToVerify
      );

      return isValid;
    } catch (error) {
      console.error('WebAuthn signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate a random challenge
   */
  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array.buffer;
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
   * Get algorithm name from COSE algorithm identifier
   */
  private getAlgorithmName(algorithm: number): string {
    switch (algorithm) {
      case -7: return 'ES256';
      case -257: return 'RS256';
      case -35: return 'ES384';
      case -36: return 'ES512';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Check if a credential is available for the given user
   */
  async isCredentialAvailable(_userId: string): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      // Try to get credentials for the user
      const credentials = await navigator.credentials.get({
        publicKey: {
          challenge: this.generateChallenge(),
          allowCredentials: [],
          timeout: 1000,
          userVerification: 'discouraged',
        },
      });

      return !!credentials;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available authenticator types
   */
  async getAvailableAuthenticators(): Promise<{
    platform: boolean;
    crossPlatform: boolean;
    userVerification: boolean;
  }> {
    if (!this.isSupported()) {
      return { platform: false, crossPlatform: false, userVerification: false };
    }

    try {
      // Test platform authenticator
      const platformTest = await navigator.credentials.create({
        publicKey: {
          challenge: this.generateChallenge(),
          rp: { id: this.config.rpId, name: this.config.rpName },
          user: { id: new TextEncoder().encode('test'), name: 'test', displayName: 'test' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform' },
          timeout: 1000,
        },
      }).catch(() => null);

      // Test cross-platform authenticator
      const crossPlatformTest = await navigator.credentials.create({
        publicKey: {
          challenge: this.generateChallenge(),
          rp: { id: this.config.rpId, name: this.config.rpName },
          user: { id: new TextEncoder().encode('test'), name: 'test', displayName: 'test' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'cross-platform' },
          timeout: 1000,
        },
      }).catch(() => null);

      return {
        platform: !!platformTest,
        crossPlatform: !!crossPlatformTest,
        userVerification: true, // Assume supported if WebAuthn is available
      };
    } catch (error) {
      return { platform: false, crossPlatform: false, userVerification: false };
    }
  }
}
