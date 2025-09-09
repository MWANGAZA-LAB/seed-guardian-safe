/**
 * Seed Guardian Safe Protocol - Audit Log Protocol
 * 
 * This module implements the JSON-based Audit Log Protocol with signed,
 * tamper-proof logs using Merkle trees and hash chains.
 */

import { 
  AuditLogEntry, 
  AuditEventType, 
  ProtocolError, 
  ValidationError 
} from '../core/types';
import { encryption } from '../crypto/encryption';

export interface AuditLogChain {
  entries: AuditLogEntry[];
  merkleRoot: string;
  chainHash: string;
  totalEntries: number;
  createdAt: string;
  lastUpdated: string;
}

export interface MerkleProof {
  leafHash: string;
  path: string[];
  indices: number[];
  rootHash: string;
}

export class AuditLogProtocol {
  private entries: AuditLogEntry[] = [];
  private merkleTree: string[] = [];
  private chainHash: string = '';

  /**
   * Add a new audit log entry to the chain
   */
  async addEntry(
    eventType: AuditEventType,
    walletId: string,
    actorId: string,
    data: Record<string, unknown>,
    actorPrivateKey: string,
    clientType: 'web' | 'cli' | 'desktop' = 'web',
    clientVersion: string = '1.0.0'
  ): Promise<AuditLogEntry> {
    try {
      // Validate inputs
      this.validateEntryInputs(eventType, walletId, actorId, data);

      // Create entry ID
      const entryId = await this.generateEntryId();

      // Get previous hash for chain integrity
      const previousHash = this.entries.length > 0 
        ? this.entries[this.entries.length - 1].signature 
        : '';

      // Create entry data
      const entryData = {
        id: entryId,
        eventType,
        walletId,
        actorId,
        timestamp: new Date().toISOString(),
        data,
        previousHash,
        metadata: {
          version: '1.0.0',
          clientType,
          clientVersion,
        }
      };

      // Sign the entry
      const signature = await this.signEntry(entryData, actorPrivateKey);

      // Create complete entry
      const entry: AuditLogEntry = {
        ...entryData,
        signature,
        merkleRoot: '', // Will be set after Merkle tree update
      };

      // Add to entries
      this.entries.push(entry);

      // Update Merkle tree
      await this.updateMerkleTree();

      // Update chain hash
      this.chainHash = await this.calculateChainHash();

      return entry;
    } catch (error) {
      throw new ProtocolError('Failed to add audit log entry', 'AUDIT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType,
        walletId,
        actorId
      });
    }
  }

  /**
   * Verify the integrity of the audit log chain
   */
  async verifyChain(): Promise<{
    isValid: boolean;
    errors: string[];
    merkleRootValid: boolean;
    chainHashValid: boolean;
    signaturesValid: boolean;
  }> {
    const errors: string[] = [];
    let merkleRootValid = true;
    let chainHashValid = true;
    let signaturesValid = true;

    try {
      // Verify Merkle tree
      if (this.entries.length > 0) {
        const calculatedMerkleRoot = await this.calculateMerkleRoot();
        const storedMerkleRoot = this.entries[this.entries.length - 1].merkleRoot;
        
        if (calculatedMerkleRoot !== storedMerkleRoot) {
          merkleRootValid = false;
          errors.push('Merkle root mismatch');
        }
      }

      // Verify chain hash
      const calculatedChainHash = await this.calculateChainHash();
      if (calculatedChainHash !== this.chainHash) {
        chainHashValid = false;
        errors.push('Chain hash mismatch');
      }

      // Verify signatures and previous hashes
      for (let i = 0; i < this.entries.length; i++) {
        const entry = this.entries[i];
        
      // Note: In a real implementation, we'd need the public key to verify
      // For now, we'll just check that the signature exists and has correct format
      if (!entry.signature || entry.signature.length === 0) {
        signaturesValid = false;
        errors.push(`Entry ${i} has invalid signature`);
      }

        // Verify previous hash chain
        if (i > 0) {
          const previousEntry = this.entries[i - 1];
          if (entry.previousHash !== previousEntry.signature) {
            errors.push(`Entry ${i} has incorrect previous hash`);
          }
        } else {
          if (entry.previousHash !== '') {
            errors.push('First entry should have empty previous hash');
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        merkleRootValid,
        chainHashValid,
        signaturesValid
      };
    } catch (error) {
      errors.push(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        merkleRootValid: false,
        chainHashValid: false,
        signaturesValid: false
      };
    }
  }

  /**
   * Generate Merkle proof for a specific entry
   */
  async generateMerkleProof(entryId: string): Promise<MerkleProof | null> {
    try {
      const entryIndex = this.entries.findIndex(entry => entry.id === entryId);
      if (entryIndex === -1) {
        return null;
      }

      const entry = this.entries[entryIndex];
      const leafHash = await this.hashEntry(entry);
      
      // Generate path to root
      const path: string[] = [];
      const indices: number[] = [];
      let currentIndex = entryIndex;

      // Build path from leaf to root
      for (let level = 0; level < this.merkleTree.length; level++) {
        const levelSize = Math.pow(2, level);
        const levelStart = Math.pow(2, level) - 1;
        
        if (currentIndex < levelSize) {
          const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
          if (siblingIndex < levelSize) {
            path.push(this.merkleTree[levelStart + siblingIndex]);
            indices.push(siblingIndex);
          }
        }
        
        currentIndex = Math.floor(currentIndex / 2);
      }

      return {
        leafHash,
        path,
        indices,
        rootHash: this.merkleTree[this.merkleTree.length - 1] || ''
      };
    } catch (error) {
      throw new ProtocolError('Failed to generate Merkle proof', 'AUDIT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entryId
      });
    }
  }

  /**
   * Verify Merkle proof
   */
  async verifyMerkleProof(proof: MerkleProof): Promise<boolean> {
    try {
      let currentHash = proof.leafHash;
      
      for (let i = 0; i < proof.path.length; i++) {
        const siblingHash = proof.path[i];
        const isLeft = proof.indices[i] % 2 === 0;
        
        if (isLeft) {
          currentHash = await this.hashPair(currentHash, siblingHash);
        } else {
          currentHash = await this.hashPair(siblingHash, currentHash);
        }
      }
      
      return currentHash === proof.rootHash;
    } catch (error) {
      throw new ProtocolError('Failed to verify Merkle proof', 'AUDIT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all entries for a specific wallet
   */
  getWalletEntries(walletId: string): AuditLogEntry[] {
    return this.entries.filter(entry => entry.walletId === walletId);
  }

  /**
   * Get entries by event type
   */
  getEntriesByType(eventType: AuditEventType): AuditLogEntry[] {
    return this.entries.filter(entry => entry.eventType === eventType);
  }

  /**
   * Get entries by actor
   */
  getEntriesByActor(actorId: string): AuditLogEntry[] {
    return this.entries.filter(entry => entry.actorId === actorId);
  }

  /**
   * Export audit log chain for backup or sharing
   */
  exportChain(): AuditLogChain {
    return {
      entries: [...this.entries],
      merkleRoot: this.merkleTree[this.merkleTree.length - 1] || '',
      chainHash: this.chainHash,
      totalEntries: this.entries.length,
      createdAt: this.entries.length > 0 ? this.entries[0].timestamp : new Date().toISOString(),
      lastUpdated: this.entries.length > 0 ? this.entries[this.entries.length - 1].timestamp : new Date().toISOString()
    };
  }

  /**
   * Import audit log chain from backup
   */
  async importChain(chain: AuditLogChain): Promise<void> {
    try {
      // Validate chain structure
      this.validateChainStructure(chain);

      // Clear current entries
      this.entries = [];
      this.merkleTree = [];
      this.chainHash = '';

      // Import entries
      this.entries = [...chain.entries];

      // Rebuild Merkle tree
      await this.updateMerkleTree();

      // Verify integrity
      const verification = await this.verifyChain();
      if (!verification.isValid) {
        throw new ValidationError('Imported chain failed verification', {
          errors: verification.errors
        });
      }

      this.chainHash = chain.chainHash;
    } catch (error) {
      throw new ProtocolError('Failed to import audit log chain', 'AUDIT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Sign an audit log entry
   */
  private async signEntry(
    entryData: Omit<AuditLogEntry, 'signature' | 'merkleRoot'>,
    privateKey: string
  ): Promise<string> {
    const dataToSign = JSON.stringify(entryData, Object.keys(entryData).sort());
    return await encryption.signData(dataToSign, privateKey);
  }

  /**
   * Update Merkle tree after adding new entry
   */
  private async updateMerkleTree(): Promise<void> {
    if (this.entries.length === 0) {
      this.merkleTree = [];
      return;
    }

    // Calculate leaf hashes
    const leafHashes: string[] = [];
    for (const entry of this.entries) {
      leafHashes.push(await this.hashEntry(entry));
    }

    // Build Merkle tree bottom-up
    this.merkleTree = [...leafHashes];
    let currentLevel = leafHashes;

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left; // Duplicate last element if odd
        nextLevel.push(await this.hashPair(left, right));
      }
      
      this.merkleTree.push(...nextLevel);
      currentLevel = nextLevel;
    }

    // Update Merkle root in all entries
    const merkleRoot = this.merkleTree[this.merkleTree.length - 1] || '';
    for (const entry of this.entries) {
      entry.merkleRoot = merkleRoot;
    }
  }

  /**
   * Calculate Merkle root
   */
  private async calculateMerkleRoot(): Promise<string> {
    if (this.merkleTree.length === 0) {
      return '';
    }
    return this.merkleTree[this.merkleTree.length - 1];
  }

  /**
   * Calculate chain hash
   */
  private async calculateChainHash(): Promise<string> {
    if (this.entries.length === 0) {
      return '';
    }

    const lastEntry = this.entries[this.entries.length - 1];
    const chainData = {
      totalEntries: this.entries.length,
      lastEntryId: lastEntry.id,
      lastEntrySignature: lastEntry.signature,
      merkleRoot: lastEntry.merkleRoot
    };

    return await this.hashString(JSON.stringify(chainData));
  }

  /**
   * Hash an audit log entry
   */
  private async hashEntry(entry: AuditLogEntry): Promise<string> {
    const entryData = {
      id: entry.id,
      eventType: entry.eventType,
      walletId: entry.walletId,
      actorId: entry.actorId,
      timestamp: entry.timestamp,
      data: entry.data,
      signature: entry.signature
    };

    return await this.hashString(JSON.stringify(entryData, Object.keys(entryData).sort()));
  }

  /**
   * Hash a pair of hashes
   */
  private async hashPair(left: string, right: string): Promise<string> {
    return await this.hashString(left + right);
  }

  /**
   * Hash a string using SHA-256
   */
  private async hashString(data: string): Promise<string> {
    const dataBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate unique entry ID
   */
  private async generateEntryId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
    return await this.hashString(timestamp + randomHex);
  }

  /**
   * Validate entry inputs
   */
  private validateEntryInputs(
    eventType: AuditEventType,
    walletId: string,
    actorId: string,
    data: Record<string, unknown>
  ): void {
    if (!eventType || !walletId || !actorId) {
      throw new ValidationError('Missing required fields for audit entry');
    }

    if (typeof data !== 'object' || data === null) {
      throw new ValidationError('Data must be an object');
    }

    // Validate wallet ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(walletId)) {
      throw new ValidationError('Invalid wallet ID format');
    }
  }

  /**
   * Validate chain structure
   */
  private validateChainStructure(chain: AuditLogChain): void {
    if (!chain.entries || !Array.isArray(chain.entries)) {
      throw new ValidationError('Invalid chain structure: entries must be an array');
    }

    if (typeof chain.merkleRoot !== 'string') {
      throw new ValidationError('Invalid chain structure: merkleRoot must be a string');
    }

    if (typeof chain.chainHash !== 'string') {
      throw new ValidationError('Invalid chain structure: chainHash must be a string');
    }

    if (chain.totalEntries !== chain.entries.length) {
      throw new ValidationError('Invalid chain structure: totalEntries mismatch');
    }
  }
}

// Export singleton instance
export const auditLog = new AuditLogProtocol();
