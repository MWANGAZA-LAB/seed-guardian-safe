// Cryptographic utilities for Bitcoin Social Recovery Inheritance Wallet

export interface SecretShare {
  shareIndex: number;
  encryptedShare: string;
  publicKey: string;
  privateKey: string;
}

export class ShamirSecretSharing {
  private readonly prime = 2n ** 127n - 1n; // Large prime for finite field arithmetic

  async splitSecret(secret: string, threshold: number, shares: number): Promise<SecretShare[]> {
    if (threshold > shares) {
      throw new Error('Threshold cannot be greater than number of shares');
    }

    const secretBytes = new TextEncoder().encode(secret);
    const secretBigInt = this.bytesToBigInt(secretBytes);
    
    // Generate random coefficients for polynomial
    const coefficients: bigint[] = [secretBigInt];
    for (let i = 1; i < threshold; i++) {
      coefficients.push(this.generateRandomBigInt());
    }

    const shares_array: SecretShare[] = [];
    
    for (let i = 0; i < shares; i++) {
      const x = BigInt(i + 1);
      const y = this.evaluatePolynomial(coefficients, x);
      
      // Generate key pair for this share
      const keyPair = await this.generateKeyPair();
      
      // Encrypt the share value
      const shareBytes = this.bigIntToBytes(y);
      const encryptedShare = await this.encryptData(shareBytes, keyPair.publicKey);
      
      shares_array.push({
        shareIndex: i + 1,
        encryptedShare: encryptedShare,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey
      });
    }
    
    return shares_array;
  }

  async reconstructSecret(shares: SecretShare[]): Promise<string> {
    if (shares.length < 2) {
      throw new Error('Need at least 2 shares to reconstruct secret');
    }

    // Decrypt shares
    const decryptedShares: Array<{ x: bigint; y: bigint }> = [];
    
    for (const share of shares) {
      const decryptedData = await this.decryptData(share.encryptedShare, share.privateKey);
      const y = this.bytesToBigInt(decryptedData);
      decryptedShares.push({ x: BigInt(share.shareIndex), y });
    }

    // Use Lagrange interpolation to reconstruct the secret
    const reconstructed = this.lagrangeInterpolation(decryptedShares);
    const secretBytes = this.bigIntToBytes(reconstructed);
    
    return new TextDecoder().decode(secretBytes);
  }

  private evaluatePolynomial(coefficients: bigint[], x: bigint): bigint {
    let result = 0n;
    let power = 1n;
    
    for (const coefficient of coefficients) {
      result = (result + (coefficient * power)) % this.prime;
      power = (power * x) % this.prime;
    }
    
    return result;
  }

  private lagrangeInterpolation(points: Array<{ x: bigint; y: bigint }>): bigint {
    let result = 0n;
    
    for (let i = 0; i < points.length; i++) {
      let term = points[i].y;
      let denominator = 1n;
      
      for (let j = 0; j < points.length; j++) {
        if (i !== j) {
          term = (term * (0n - points[j].x)) % this.prime;
          denominator = (denominator * (points[i].x - points[j].x)) % this.prime;
        }
      }
      
      // Calculate modular multiplicative inverse
      const inverse = this.modInverse(denominator, this.prime);
      result = (result + (term * inverse)) % this.prime;
    }
    
    return result;
  }

  private modInverse(a: bigint, m: bigint): bigint {
    let [old_r, r] = [a, m];
    let [old_s, s] = [1n, 0n];
    let [old_t, t] = [0n, 1n];

    while (r !== 0n) {
      const quotient = old_r / r;
      [old_r, r] = [r, old_r - quotient * r];
      [old_s, s] = [s, old_s - quotient * s];
      [old_t, t] = [t, old_t - quotient * t];
    }

    return (old_s % m + m) % m;
  }

  private generateRandomBigInt(): bigint {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return this.bytesToBigInt(randomBytes) % this.prime;
  }

  private bytesToBigInt(bytes: Uint8Array): bigint {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) + BigInt(bytes[i]);
    }
    return result;
  }

  private bigIntToBytes(bigInt: bigint): Uint8Array {
    const bytes: number[] = [];
    let temp = bigInt;
    
    while (temp > 0n) {
      bytes.unshift(Number(temp & 0xffn));
      temp = temp >> 8n;
    }
    
    return new Uint8Array(bytes);
  }

  private async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
      publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
      privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
    };
  }

  private async encryptData(data: Uint8Array, publicKeyBase64: string): Promise<string> {
    const publicKeyBuffer = new Uint8Array(atob(publicKeyBase64).split('').map(c => c.charCodeAt(0)));
    const publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      data
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  private async decryptData(encryptedDataBase64: string, privateKeyBase64: string): Promise<Uint8Array> {
    const privateKeyBuffer = new Uint8Array(atob(privateKeyBase64).split('').map(c => c.charCodeAt(0)));
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    const encryptedData = new Uint8Array(atob(encryptedDataBase64).split('').map(c => c.charCodeAt(0)));
    const decrypted = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedData
    );

    return new Uint8Array(decrypted);
  }
}

// Bitcoin-specific cryptographic utilities
export class BitcoinCrypto {
  static async generateMnemonic(): Promise<string> {
    // Generate 256 bits of entropy
    const entropy = new Uint8Array(32);
    crypto.getRandomValues(entropy);
    
    // Convert to mnemonic (simplified - in production use a proper BIP39 library)
    const words = this.entropyToWords(entropy);
    return words.join(' ');
  }

  static async deriveSeedFromMnemonic(mnemonic: string, passphrase: string = ''): Promise<Uint8Array> {
    // In production, use proper PBKDF2 implementation
    const salt = 'mnemonic' + passphrase;
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(mnemonic),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const seed = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: 2048,
        hash: 'SHA-512'
      },
      keyMaterial,
      512
    );
    
    return new Uint8Array(seed);
  }

  private static entropyToWords(entropy: Uint8Array): string[] {
    // Simplified word list - in production use full BIP39 word list
    const wordList = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
      'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
      'action', 'actor', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult',
      'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree'
    ];
    
    const words: string[] = [];
    for (let i = 0; i < entropy.length; i += 2) {
      const index = entropy[i] % wordList.length;
      words.push(wordList[index]);
    }
    
    return words;
  }
}

// Utility functions for data encryption/decryption
export class DataEncryption {
  static async encryptWithPassword(data: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      new TextEncoder().encode(data)
    );
    
    const encryptedArray = new Uint8Array(encrypted);
    const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(encryptedArray, salt.length + iv.length);
    
    return btoa(String.fromCharCode(...result));
  }

  static async decryptWithPassword(encryptedData: string, password: string): Promise<string> {
    const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }
}
