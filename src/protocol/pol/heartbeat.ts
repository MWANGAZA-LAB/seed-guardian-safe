/**
 * Proof of Life Heartbeat System
 * 
 * This module implements the automatic and manual check-in system
 * for Proof of Life verification.
 */

import { 
  PoLProof, 
  PoLConfig, 
  PoLHeartbeatConfig, 
  PoLKeyPair, 
  PoLError, 
  PoLNetworkError
} from './types';
import { PoLKeyManager } from './keygen';

export interface HeartbeatEvent {
  type: 'check_in' | 'missed' | 'escalated' | 'recovery_triggered';
  timestamp: number;
  walletId: string;
  data?: any;
}

export interface HeartbeatCallbacks {
  onCheckIn?: (proof: PoLProof) => void;
  onMissed?: (walletId: string, missedCount: number) => void;
  onEscalated?: (walletId: string, escalationLevel: number) => void;
  onRecoveryTriggered?: (walletId: string, reason: string) => void;
  onError?: (error: PoLError) => void;
}

export class PoLHeartbeat {
  private keyManager: PoLKeyManager;
  private config: PoLConfig;
  private heartbeatConfig: PoLHeartbeatConfig;
  private callbacks: HeartbeatCallbacks;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastCheckIn: number = 0;
  private missedCount: number = 0;
  private walletId: string;
  private keyPair: PoLKeyPair | null = null;

  constructor(
    keyManager: PoLKeyManager,
    config: PoLConfig,
    heartbeatConfig: PoLHeartbeatConfig,
    callbacks: HeartbeatCallbacks = {}
  ) {
    this.keyManager = keyManager;
    this.config = config;
    this.heartbeatConfig = heartbeatConfig;
    this.callbacks = callbacks;
    this.walletId = '';
  }

  /**
   * Initialize the heartbeat system
   */
  async initialize(walletId: string, keyPair: PoLKeyPair): Promise<void> {
    this.walletId = walletId;
    this.keyPair = keyPair;
    this.lastCheckIn = Date.now();
    
    if (this.heartbeatConfig.enabled) {
      await this.start();
    }
  }

  /**
   * Start the heartbeat system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    if (!this.keyPair) {
      throw new PoLError('Key pair not initialized', 'KEY_PAIR_NOT_INITIALIZED');
    }

    this.isRunning = true;
    
    // Start the interval
    this.intervalId = setInterval(async () => {
      try {
        await this.performCheckIn();
      } catch (error) {
        this.handleError(error);
      }
    }, this.heartbeatConfig.interval);

    // Perform initial check-in
    try {
      await this.performCheckIn();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Stop the heartbeat system
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Perform a check-in
   */
  async performCheckIn(proofType: 'automatic' | 'manual' | 'emergency' = 'automatic'): Promise<PoLProof> {
    if (!this.keyPair) {
      throw new PoLError('Key pair not initialized', 'KEY_PAIR_NOT_INITIALIZED');
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const challenge = await this.generateChallenge();
      
      // Create the data to sign
      const dataToSign = `${timestamp}:${challenge}:${this.walletId}`;
      
      // Sign the data
      const signature = await this.keyManager.signData(
        dataToSign,
        this.keyPair.privateKey,
        this.keyPair.algorithm
      );

      // Create the proof
      const proof: PoLProof = {
        id: await this.generateProofId(),
        walletId: this.walletId,
        timestamp,
        challenge,
        signature,
        publicKey: this.keyPair.publicKey,
        proofType,
        metadata: {
          deviceFingerprint: await this.getDeviceFingerprint(),
          userAgent: navigator.userAgent,
          ipAddress: await this.getIPAddress(),
        },
      };

      // Submit the proof
      await this.submitProof(proof);

      // Update last check-in time
      this.lastCheckIn = Date.now();
      this.missedCount = 0;

      // Notify callback
      if (this.callbacks.onCheckIn) {
        this.callbacks.onCheckIn(proof);
      }

      return proof;
    } catch (error) {
      if (error instanceof PoLError) {
        throw error;
      }
      throw new PoLError(
        'Check-in failed',
        'CHECK_IN_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Submit proof to the server
   */
  private async submitProof(_proof: PoLProof): Promise<void> {
    try {
      // In a real implementation, this would make an API call to the server
      // For now, we'll simulate the submission
      const response = await this.simulateServerSubmission(proof);
      
      if (!response.success) {
        throw new PoLNetworkError('Failed to submit proof', { response });
      }
    } catch (error) {
      if (error instanceof PoLError) {
        throw error;
      }
      throw new PoLNetworkError(
        'Proof submission failed',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Simulate server submission (replace with real API call)
   */
  private async simulateServerSubmission(proof: PoLProof): Promise<{ success: boolean; message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate success
    return {
      success: true,
      message: 'Proof submitted successfully',
    };
  }

  /**
   * Generate a random challenge
   */
  private async generateChallenge(): Promise<string> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a unique proof ID
   */
  private async generateProofId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
    return `pol_proof_${timestamp}_${randomHex}`;
  }

  /**
   * Get device fingerprint
   */
  private async getDeviceFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
      }
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
      ].join('|');
      
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
      return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      return 'unknown_device';
    }
  }

  /**
   * Get IP address (simplified)
   */
  private async getIPAddress(): Promise<string> {
    try {
      // In a real implementation, this would make a request to get the IP
      // For now, return a placeholder
      return '127.0.0.1';
    } catch (error) {
      return 'unknown_ip';
    }
  }

  /**
   * Check if check-in is overdue
   */
  isOverdue(): boolean {
    const now = Date.now();
    const nextCheckIn = this.lastCheckIn + (this.config.checkInInterval * 1000);
    return now > nextCheckIn;
  }

  /**
   * Get time until next check-in
   */
  getTimeUntilNextCheckIn(): number {
    const now = Date.now();
    const nextCheckIn = this.lastCheckIn + (this.config.checkInInterval * 1000);
    return Math.max(0, nextCheckIn - now);
  }

  /**
   * Get missed check-in count
   */
  getMissedCount(): number {
    return this.missedCount;
  }

  /**
   * Get escalation level
   */
  getEscalationLevel(): number {
    const now = Date.now();
    const timeSinceLastCheckIn = now - this.lastCheckIn;
    const escalationThreshold = this.config.escalationThreshold * 24 * 60 * 60 * 1000; // Convert days to ms
    const recoveryThreshold = this.config.recoveryThreshold * 24 * 60 * 60 * 1000; // Convert days to ms

    if (timeSinceLastCheckIn >= recoveryThreshold) {
      return 3; // Recovery triggered
    } else if (timeSinceLastCheckIn >= escalationThreshold) {
      return 2; // Escalated
    } else if (this.missedCount > 0) {
      return 1; // Missed
    } else {
      return 0; // Active
    }
  }

  /**
   * Handle missed check-in
   */
  private async handleMissedCheckIn(): Promise<void> {
    this.missedCount++;
    
    if (this.callbacks.onMissed) {
      this.callbacks.onMissed(this.walletId, this.missedCount);
    }

    // Check for escalation
    const escalationLevel = this.getEscalationLevel();
    if (escalationLevel >= 2) {
      if (this.callbacks.onEscalated) {
        this.callbacks.onEscalated(this.walletId, escalationLevel);
      }
    }

    // Check for recovery trigger
    if (escalationLevel >= 3) {
      if (this.callbacks.onRecoveryTriggered) {
        this.callbacks.onRecoveryTriggered(this.walletId, 'pol_timeout');
      }
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    if (this.callbacks.onError) {
      if (error instanceof PoLError) {
        this.callbacks.onError(error);
      } else {
        this.callbacks.onError(new PoLError(
          'Heartbeat error',
          'HEARTBEAT_ERROR',
          { originalError: error instanceof Error ? error.message : 'Unknown error' }
        ));
      }
    }
  }

  /**
   * Get heartbeat status
   */
  getStatus(): {
    isRunning: boolean;
    lastCheckIn: number;
    missedCount: number;
    escalationLevel: number;
    timeUntilNextCheckIn: number;
    isOverdue: boolean;
  } {
    return {
      isRunning: this.isRunning,
      lastCheckIn: this.lastCheckIn,
      missedCount: this.missedCount,
      escalationLevel: this.getEscalationLevel(),
      timeUntilNextCheckIn: this.getTimeUntilNextCheckIn(),
      isOverdue: this.isOverdue(),
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PoLConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update heartbeat configuration
   */
  updateHeartbeatConfig(config: Partial<PoLHeartbeatConfig>): void {
    this.heartbeatConfig = { ...this.heartbeatConfig, ...config };
    
    // Restart if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Force a manual check-in
   */
  async forceCheckIn(): Promise<PoLProof> {
    return await this.performCheckIn('manual');
  }

  /**
   * Emergency check-in
   */
  async emergencyCheckIn(): Promise<PoLProof> {
    return await this.performCheckIn('emergency');
  }

  /**
   * Reset missed count
   */
  resetMissedCount(): void {
    this.missedCount = 0;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.keyPair = null;
    this.walletId = '';
  }
}
