/**
 * Proof of Life Client-Side Storage
 * 
 * This module provides client-side storage for Proof of Life data
 * using IndexedDB, localStorage, and other browser storage APIs.
 */

import { 
  PoLKeyPair, 
  PoLProof, 
  PoLConfig, 
  PoLStorage, 
  PoLStorageError 
} from './types';

export interface StorageConfig {
  dbName: string;
  dbVersion: number;
  useIndexedDB: boolean;
  useLocalStorage: boolean;
  encryptionKey?: string;
}

export class ClientPoLStorage implements PoLStorage {
  private config: StorageConfig;
  private db: IDBDatabase | null = null;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  /**
   * Initialize storage
   */
  async initialize(): Promise<void> {
    if (this.config.useIndexedDB) {
      await this.initializeIndexedDB();
    }
  }

  /**
   * Store key pair
   */
  async storeKeyPair(keyPair: PoLKeyPair): Promise<void> {
    try {
      if (this.config.useIndexedDB && this.db) {
        await this.storeInIndexedDB('keyPairs', keyPair);
      } else if (this.config.useLocalStorage) {
        await this.storeInLocalStorage(`pol_keypair_${keyPair.keyId}`, keyPair);
      } else {
        throw new PoLStorageError('No storage method available');
      }
    } catch (error) {
      throw new PoLStorageError(
        'Failed to store key pair',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Retrieve key pair
   */
  async retrieveKeyPair(keyId: string): Promise<PoLKeyPair | null> {
    try {
      if (this.config.useIndexedDB && this.db) {
        return await this.retrieveFromIndexedDB('keyPairs', keyId);
      } else if (this.config.useLocalStorage) {
        return await this.retrieveFromLocalStorage(`pol_keypair_${keyId}`);
      } else {
        throw new PoLStorageError('No storage method available');
      }
    } catch (error) {
      throw new PoLStorageError(
        'Failed to retrieve key pair',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Store proof
   */
  async storeProof(proof: PoLProof): Promise<void> {
    try {
      if (this.config.useIndexedDB && this.db) {
        await this.storeInIndexedDB('proofs', proof);
      } else if (this.config.useLocalStorage) {
        const key = `pol_proof_${proof.walletId}_${proof.id}`;
        await this.storeInLocalStorage(key, proof);
      } else {
        throw new PoLStorageError('No storage method available');
      }
    } catch (error) {
      throw new PoLStorageError(
        'Failed to store proof',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Retrieve proofs
   */
  async retrieveProofs(walletId: string): Promise<PoLProof[]> {
    try {
      if (this.config.useIndexedDB && this.db) {
        return await this.retrieveProofsFromIndexedDB(walletId);
      } else if (this.config.useLocalStorage) {
        return await this.retrieveProofsFromLocalStorage(walletId);
      } else {
        throw new PoLStorageError('No storage method available');
      }
    } catch (error) {
      throw new PoLStorageError(
        'Failed to retrieve proofs',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Store configuration
   */
  async storeConfig(config: PoLConfig): Promise<void> {
    try {
      if (this.config.useIndexedDB && this.db) {
        await this.storeInIndexedDB('configs', config);
      } else if (this.config.useLocalStorage) {
        await this.storeInLocalStorage('pol_config', config);
      } else {
        throw new PoLStorageError('No storage method available');
      }
    } catch (error) {
      throw new PoLStorageError(
        'Failed to store configuration',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Retrieve configuration
   */
  async retrieveConfig(walletId: string): Promise<PoLConfig | null> {
    try {
      if (this.config.useIndexedDB && this.db) {
        return await this.retrieveFromIndexedDB('configs', walletId);
      } else if (this.config.useLocalStorage) {
        return await this.retrieveFromLocalStorage('pol_config');
      } else {
        throw new PoLStorageError('No storage method available');
      }
    } catch (error) {
      throw new PoLStorageError(
        'Failed to retrieve configuration',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Clear storage
   */
  async clearStorage(walletId: string): Promise<void> {
    try {
      if (this.config.useIndexedDB && this.db) {
        await this.clearIndexedDB(walletId);
      } else if (this.config.useLocalStorage) {
        await this.clearLocalStorage(walletId);
      } else {
        throw new PoLStorageError('No storage method available');
      }
    } catch (error) {
      throw new PoLStorageError(
        'Failed to clear storage',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => {
        reject(new PoLStorageError('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('keyPairs')) {
          const keyPairsStore = db.createObjectStore('keyPairs', { keyPath: 'keyId' });
          keyPairsStore.createIndex('walletId', 'walletId', { unique: false });
        }

        if (!db.objectStoreNames.contains('proofs')) {
          const proofsStore = db.createObjectStore('proofs', { keyPath: 'id' });
          proofsStore.createIndex('walletId', 'walletId', { unique: false });
          proofsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('configs')) {
          const configsStore = db.createObjectStore('configs', { keyPath: 'walletId' });
        }
      };
    });
  }

  /**
   * Store data in IndexedDB
   */
  private async storeInIndexedDB(storeName: string, data: any): Promise<void> {
    if (!this.db) {
      throw new PoLStorageError('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new PoLStorageError('Failed to store in IndexedDB'));
    });
  }

  /**
   * Retrieve data from IndexedDB
   */
  private async retrieveFromIndexedDB(storeName: string, key: string): Promise<any> {
    if (!this.db) {
      throw new PoLStorageError('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new PoLStorageError('Failed to retrieve from IndexedDB'));
    });
  }

  /**
   * Retrieve proofs from IndexedDB
   */
  private async retrieveProofsFromIndexedDB(walletId: string): Promise<PoLProof[]> {
    if (!this.db) {
      throw new PoLStorageError('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['proofs'], 'readonly');
      const store = transaction.objectStore('proofs');
      const index = store.index('walletId');
      const request = index.getAll(walletId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new PoLStorageError('Failed to retrieve proofs from IndexedDB'));
    });
  }

  /**
   * Clear IndexedDB data
   */
  private async clearIndexedDB(walletId: string): Promise<void> {
    if (!this.db) {
      throw new PoLStorageError('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['keyPairs', 'proofs', 'configs'], 'readwrite');
      
      // Clear key pairs
      const keyPairsStore = transaction.objectStore('keyPairs');
      const keyPairsIndex = keyPairsStore.index('walletId');
      const keyPairsRequest = keyPairsIndex.getAll(walletId);
      
      keyPairsRequest.onsuccess = () => {
        keyPairsRequest.result.forEach((keyPair: any) => {
          keyPairsStore.delete(keyPair.keyId);
        });
      };

      // Clear proofs
      const proofsStore = transaction.objectStore('proofs');
      const proofsIndex = proofsStore.index('walletId');
      const proofsRequest = proofsIndex.getAll(walletId);
      
      proofsRequest.onsuccess = () => {
        proofsRequest.result.forEach((proof: any) => {
          proofsStore.delete(proof.id);
        });
      };

      // Clear config
      const configsStore = transaction.objectStore('configs');
      configsStore.delete(walletId);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new PoLStorageError('Failed to clear IndexedDB'));
    });
  }

  /**
   * Store data in localStorage
   */
  private async storeInLocalStorage(key: string, data: any): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      throw new PoLStorageError('Failed to store in localStorage');
    }
  }

  /**
   * Retrieve data from localStorage
   */
  private async retrieveFromLocalStorage(key: string): Promise<any> {
    try {
      const serialized = localStorage.getItem(key);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      throw new PoLStorageError('Failed to retrieve from localStorage');
    }
  }

  /**
   * Retrieve proofs from localStorage
   */
  private async retrieveProofsFromLocalStorage(walletId: string): Promise<PoLProof[]> {
    try {
      const proofs: PoLProof[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`pol_proof_${walletId}_`)) {
          const proof = await this.retrieveFromLocalStorage(key);
          if (proof) {
            proofs.push(proof);
          }
        }
      }
      
      return proofs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      throw new PoLStorageError('Failed to retrieve proofs from localStorage');
    }
  }

  /**
   * Clear localStorage data
   */
  private async clearLocalStorage(walletId: string): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(walletId) || key === 'pol_config')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      throw new PoLStorageError('Failed to clear localStorage');
    }
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    if (this.config.useIndexedDB) {
      return 'indexedDB' in window;
    } else if (this.config.useLocalStorage) {
      return 'localStorage' in window;
    }
    return false;
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo(): Promise<{
    used: number;
    available: number;
    quota: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
        quota: estimate.quota || 0,
      };
    }
    
    return {
      used: 0,
      available: 0,
      quota: 0,
    };
  }
}

// Factory function for creating storage
export function createClientStorage(config: Partial<StorageConfig> = {}): ClientPoLStorage {
  const defaultConfig: StorageConfig = {
    dbName: 'seed_guardian_pol',
    dbVersion: 1,
    useIndexedDB: true,
    useLocalStorage: true,
    ...config,
  };

  return new ClientPoLStorage(defaultConfig);
}
