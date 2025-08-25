# Bitcoin Social Recovery Inheritance Wallet - Backend Implementation Guide

## 1. Project Overview
Implement a secure, scalable backend for the Bitcoin Social Recovery Inheritance Wallet (BSRI) using Supabase as the primary backend infrastructure. This system enables Bitcoin inheritance through cryptographic secret sharing among trusted guardians.

## 2. Database Schema Design

### 2.1 Core Tables Implementation

```sql
-- User profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    emergency_contact_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets table
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    encrypted_master_seed TEXT NOT NULL, -- Encrypted with user's master password
    derivation_path TEXT DEFAULT "m/44'/0'/0'",
    threshold_requirement INTEGER NOT NULL CHECK (threshold_requirement >= 2),
    total_guardians INTEGER NOT NULL CHECK (total_guardians >= threshold_requirement),
    wallet_type TEXT DEFAULT 'inheritance' CHECK (wallet_type IN ('inheritance', 'recovery')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'locked', 'recovering', 'recovered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guardians table
CREATE TABLE public.guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    encrypted_secret_share TEXT NOT NULL, -- Shamir's secret share
    share_index INTEGER NOT NULL,
    public_key TEXT NOT NULL,
    status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'revoked')),
    invitation_token TEXT,
    invitation_expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, share_index),
    UNIQUE(wallet_id, email)
);

-- Recovery attempts table
CREATE TABLE public.recovery_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    initiated_by_guardian_id UUID REFERENCES public.guardians(id),
    recovery_reason TEXT NOT NULL,
    required_signatures INTEGER NOT NULL,
    current_signatures INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collecting', 'completed', 'failed', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    new_owner_email TEXT,
    recovery_data JSONB, -- Additional recovery metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guardian signatures for recovery
CREATE TABLE public.recovery_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recovery_attempt_id UUID REFERENCES public.recovery_attempts(id) ON DELETE CASCADE NOT NULL,
    guardian_id UUID REFERENCES public.guardians(id) NOT NULL,
    signature_data TEXT NOT NULL, -- Cryptographic signature
    signed_message_hash TEXT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recovery_attempt_id, guardian_id)
);

-- Proof of life tracking
CREATE TABLE public.proof_of_life (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    proof_type TEXT NOT NULL CHECK (proof_type IN ('manual', 'biometric', 'transaction', 'login')),
    proof_data JSONB,
    ip_address INET,
    user_agent TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet addresses
CREATE TABLE public.wallet_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL UNIQUE,
    derivation_path TEXT NOT NULL,
    address_type TEXT CHECK (address_type IN ('legacy', 'segwit', 'native_segwit')),
    is_change BOOLEAN DEFAULT FALSE,
    address_index INTEGER NOT NULL,
    balance_satoshis BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    txid TEXT NOT NULL,
    amount_satoshis BIGINT NOT NULL,
    fee_satoshis BIGINT,
    transaction_type TEXT CHECK (transaction_type IN ('send', 'receive', 'recovery')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    block_height INTEGER,
    confirmation_count INTEGER DEFAULT 0,
    raw_transaction TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    wallet_id UUID REFERENCES public.wallets(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_of_life ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wallets policies
CREATE POLICY "Users can view their own wallets" ON public.wallets
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create wallets" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own wallets" ON public.wallets
    FOR UPDATE USING (auth.uid() = owner_id);

-- Guardians policies
CREATE POLICY "Wallet owners can manage guardians" ON public.guardians
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.wallets 
            WHERE wallets.id = guardians.wallet_id 
            AND wallets.owner_id = auth.uid()
        )
    );

CREATE POLICY "Guardians can view their assignments" ON public.guardians
    FOR SELECT USING (
        auth.jwt() ->> 'email' = email
    );

-- Recovery attempts policies
CREATE POLICY "Wallet owners and guardians can view recovery attempts" ON public.recovery_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wallets 
            WHERE wallets.id = recovery_attempts.wallet_id 
            AND wallets.owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.guardians 
            WHERE guardians.wallet_id = recovery_attempts.wallet_id 
            AND guardians.email = auth.jwt() ->> 'email'
        )
    );

-- Additional policies for other tables following similar patterns...
```

### 2.3 Database Functions

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if recovery threshold is met
CREATE OR REPLACE FUNCTION public.check_recovery_threshold(recovery_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    required_sigs INTEGER;
    current_sigs INTEGER;
BEGIN
    SELECT required_signatures, current_signatures
    INTO required_sigs, current_sigs
    FROM public.recovery_attempts
    WHERE id = recovery_id;
    
    RETURN current_sigs >= required_sigs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update signature count
CREATE OR REPLACE FUNCTION public.update_recovery_signature_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.recovery_attempts
    SET current_signatures = (
        SELECT COUNT(*)
        FROM public.recovery_signatures
        WHERE recovery_attempt_id = NEW.recovery_attempt_id
    )
    WHERE id = NEW.recovery_attempt_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_signature_count
    AFTER INSERT ON public.recovery_signatures
    FOR EACH ROW EXECUTE FUNCTION public.update_recovery_signature_count();
```

## 3. Edge Functions Implementation

### 3.1 Wallet Management Functions

```typescript
// supabase/functions/create-wallet/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ShamirSecretSharing } from '../_shared/crypto.ts'

interface CreateWalletRequest {
  name: string;
  masterSeed: string; // Client-encrypted
  guardians: Array<{
    email: string;
    fullName: string;
    phoneNumber?: string;
  }>;
  thresholdRequirement: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { name, masterSeed, guardians, thresholdRequirement }: CreateWalletRequest = await req.json();

    // Validate input
    if (guardians.length < thresholdRequirement || thresholdRequirement < 2) {
      throw new Error('Invalid threshold configuration');
    }

    // Create wallet record
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .insert({
        owner_id: user.id,
        name,
        encrypted_master_seed: masterSeed,
        threshold_requirement: thresholdRequirement,
        total_guardians: guardians.length
      })
      .select()
      .single();

    if (walletError) throw walletError;

    // Generate secret shares using Shamir's Secret Sharing
    const shamirSharing = new ShamirSecretSharing();
    const shares = await shamirSharing.splitSecret(
      masterSeed,
      thresholdRequirement,
      guardians.length
    );

    // Create guardian records with encrypted shares
    const guardianRecords = guardians.map((guardian, index) => ({
      wallet_id: wallet.id,
      email: guardian.email,
      full_name: guardian.fullName,
      phone_number: guardian.phoneNumber,
      encrypted_secret_share: shares[index].encryptedShare,
      share_index: index + 1,
      public_key: shares[index].publicKey,
      invitation_token: crypto.randomUUID(),
      invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    const { error: guardiansError } = await supabase
      .from('guardians')
      .insert(guardianRecords);

    if (guardiansError) throw guardiansError;

    // Send guardian invitations (implement email service)
    for (const guardian of guardianRecords) {
      await sendGuardianInvitation(guardian);
    }

    return new Response(
      JSON.stringify({ success: true, walletId: wallet.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
```

### 3.2 Recovery Management Functions

```typescript
// supabase/functions/initiate-recovery/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface InitiateRecoveryRequest {
  walletId: string;
  recoveryReason: string;
  newOwnerEmail: string;
  guardianEmail: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { walletId, recoveryReason, newOwnerEmail, guardianEmail }: InitiateRecoveryRequest = await req.json();

    // Verify guardian has permission to initiate recovery
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select('id, wallet_id')
      .eq('wallet_id', walletId)
      .eq('email', guardianEmail)
      .eq('status', 'accepted')
      .single();

    if (guardianError || !guardian) {
      throw new Error('Guardian not authorized for this wallet');
    }

    // Get wallet details
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('threshold_requirement, status')
      .eq('id', walletId)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.status !== 'active') {
      throw new Error('Wallet is not in active state');
    }

    // Create recovery attempt
    const { data: recoveryAttempt, error: recoveryError } = await supabase
      .from('recovery_attempts')
      .insert({
        wallet_id: walletId,
        initiated_by_guardian_id: guardian.id,
        recovery_reason: recoveryReason,
        required_signatures: wallet.threshold_requirement,
        new_owner_email: newOwnerEmail,
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours
      })
      .select()
      .single();

    if (recoveryError) throw recoveryError;

    // Update wallet status
    await supabase
      .from('wallets')
      .update({ status: 'recovering' })
      .eq('id', walletId);

    // Notify all guardians about recovery attempt
    const { data: allGuardians } = await supabase
      .from('guardians')
      .select('email, full_name')
      .eq('wallet_id', walletId)
      .eq('status', 'accepted');

    for (const guardianToNotify of allGuardians || []) {
      await sendRecoveryNotification(recoveryAttempt.id, guardianToNotify);
    }

    return new Response(
      JSON.stringify({ success: true, recoveryAttemptId: recoveryAttempt.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
```

### 3.3 Bitcoin Integration Functions

```typescript
// supabase/functions/bitcoin-service/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { BitcoinRPC } from '../_shared/bitcoin.ts'

interface CreateTransactionRequest {
  walletId: string;
  toAddress: string;
  amountSatoshis: number;
  feeRate?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bitcoin = new BitcoinRPC({
      host: Deno.env.get('BITCOIN_RPC_HOST'),
      port: parseInt(Deno.env.get('BITCOIN_RPC_PORT') || '8332'),
      username: Deno.env.get('BITCOIN_RPC_USER'),
      password: Deno.env.get('BITCOIN_RPC_PASSWORD')
    });

    const { walletId, toAddress, amountSatoshis, feeRate = 10 }: CreateTransactionRequest = await req.json();

    // Get wallet addresses and UTXOs
    const addresses = await getWalletAddresses(walletId);
    const utxos = await bitcoin.listUnspent(addresses);

    // Select UTXOs for transaction
    const selectedUtxos = selectUtxos(utxos, amountSatoshis, feeRate);
    
    // Create unsigned transaction
    const unsignedTx = await bitcoin.createRawTransaction(
      selectedUtxos.map(utxo => ({ txid: utxo.txid, vout: utxo.vout })),
      { [toAddress]: amountSatoshis / 100000000 } // Convert to BTC
    );

    // Calculate precise fee
    const estimatedSize = estimateTransactionSize(selectedUtxos.length, 2);
    const totalFee = estimatedSize * feeRate;

    return new Response(
      JSON.stringify({
        success: true,
        unsignedTransaction: unsignedTx,
        fee: totalFee,
        inputs: selectedUtxos
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
```

### 3.4 Guardian Verification Functions

```typescript
// supabase/functions/verify-guardian/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { EmailService } from '../_shared/email.ts'
import { SMSService } from '../_shared/sms.ts'

interface VerifyGuardianRequest {
  invitationToken: string;
  verificationCode: string;
  guardianInfo: {
    fullName: string;
    phoneNumber?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invitationToken, verificationCode, guardianInfo }: VerifyGuardianRequest = await req.json();

    // Find guardian by invitation token
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select('*')
      .eq('invitation_token', invitationToken)
      .eq('status', 'invited')
      .single();

    if (guardianError || !guardian) {
      throw new Error('Invalid invitation token');
    }

    // Check if invitation has expired
    if (new Date() > new Date(guardian.invitation_expires_at)) {
      throw new Error('Invitation has expired');
    }

    // Verify the verification code (implement your verification logic)
    const isCodeValid = await verifyGuardianCode(guardian.email, verificationCode);
    if (!isCodeValid) {
      throw new Error('Invalid verification code');
    }

    // Update guardian status and information
    const { error: updateError } = await supabase
      .from('guardians')
      .update({
        status: 'accepted',
        full_name: guardianInfo.fullName,
        phone_number: guardianInfo.phoneNumber,
        accepted_at: new Date().toISOString(),
        invitation_token: null // Clear the token
      })
      .eq('id', guardian.id);

    if (updateError) throw updateError;

    // Create guardian account if they don't have one
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(guardian.email);
    
    if (!existingUser.user) {
      // Send account creation invitation
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        guardian.email,
        {
          data: {
            role: 'guardian',
            full_name: guardianInfo.fullName
          }
        }
      );
      
      if (inviteError) console.error('Failed to send account invitation:', inviteError);
    }

    // Log the verification in audit trail
    await supabase
      .from('audit_logs')
      .insert({
        wallet_id: guardian.wallet_id,
        action: 'guardian_verified',
        resource_type: 'guardian',
        resource_id: guardian.id,
        new_values: { status: 'accepted' }
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Guardian verified successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
```

## 4. Shared Utilities

### 4.1 Cryptographic Utilities

```typescript
// supabase/functions/_shared/crypto.ts
export class ShamirSecretSharing {
  async splitSecret(secret: string, threshold: number, shares: number): Promise<SecretShare[]> {
    // Implement Shamir's Secret Sharing algorithm
    // This is a simplified version - use a proper crypto library in production
    
    const secretBytes = new TextEncoder().encode(secret);
    const shares_array: SecretShare[] = [];
    
    for (let i = 0; i < shares; i++) {
      // Generate polynomial coefficients
      const coefficients = this.generateCoefficients(secretBytes, threshold);
      
      // Calculate share value
      const shareValue = this.evaluatePolynomial(coefficients, i + 1);
      
      // Encrypt share with guardian's public key
      const publicKey = await this.generateKeyPair();
      const encryptedShare = await this.encryptShare(shareValue, publicKey.publicKey);
      
      shares_array.push({
        shareIndex: i + 1,
        encryptedShare: encryptedShare,
        publicKey: publicKey.publicKey,
        privateKey: publicKey.privateKey // Store securely
      });
    }
    
    return shares_array;
  }

  async reconstructSecret(shares: SecretShare[]): Promise<string> {
    // Implement Lagrange interpolation to reconstruct secret
    // Decrypt shares and reconstruct the original secret
    
    const decryptedShares = await Promise.all(
      shares.map(share => this.decryptShare(share.encryptedShare, share.privateKey))
    );
    
    const reconstructed = this.lagrangeInterpolation(decryptedShares);
    return new TextDecoder().decode(reconstructed);
  }

  private generateCoefficients(secret: Uint8Array, threshold: number): number[] {
    // Generate random coefficients for the polynomial
    const coefficients = [secret[0]]; // Secret is the constant term
    
    for (let i = 1; i < threshold; i++) {
      coefficients.push(crypto.getRandomValues(new Uint8Array(1))[0]);
    }
    
    return coefficients;
  }

  private evaluatePolynomial(coefficients: number[], x: number): number {
    let result = 0;
    for (let i = 0; i < coefficients.length; i++) {
      result += coefficients[i] * Math.pow(x, i);
    }
    return result % 256; // Keep within byte range
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

  private async encryptShare(share: number, publicKey: string): Promise<string> {
    // Implement encryption with public key
    const shareBytes = new Uint8Array([share]);
    // Use Web Crypto API for encryption
    return btoa(String.fromCharCode(...shareBytes)); // Simplified
  }

  private async decryptShare(encryptedShare: string, privateKey: string): Promise<number> {
    // Implement decryption with private key
    const shareBytes = new Uint8Array(atob(encryptedShare).split('').map(c => c.charCodeAt(0)));
    return shareBytes[0]; // Simplified
  }

  private lagrangeInterpolation(shares: Array<{ x: number; y: number }>): Uint8Array {
    // Implement Lagrange interpolation
    let result = 0;
    
    for (let i = 0; i < shares.length; i++) {
      let term = shares[i].y;
      
      for (let j = 0; j < shares.length; j++) {
        if (i !== j) {
          term *= (0 - shares[j].x) / (shares[i].x - shares[j].x);
        }
      }
      
      result += term;
    }
    
    return new Uint8Array([Math.round(result) % 256]);
  }
}

interface SecretShare {
  shareIndex: number;
  encryptedShare: string;
  publicKey: string;
  privateKey: string;
}
```

### 4.2 Bitcoin Utilities

```typescript
// supabase/functions/_shared/bitcoin.ts
export class BitcoinRPC {
  private host: string;
  private port: number;
  private username: string;
  private password: string;

  constructor(config: { host: string; port: number; username: string; password: string }) {
    this.host = config.host;
    this.port = config.port;
    this.username = config.username;
    this.password = config.password;
  }

  async call(method: string, params: any[] = []): Promise<any> {
    const auth = btoa(`${this.username}:${this.password}`);
    
    const response = await fetch(`http://${this.host}:${this.port}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method,
        params
      })
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Bitcoin RPC Error: ${result.error.message}`);
    }
    
    return result.result;
  }

  async getBlockchainInfo(): Promise<any> {
    return this.call('getblockchaininfo');
  }

  async listUnspent(addresses: string[]): Promise<UTXO[]> {
    return this.call('listunspent', [0, 9999999, addresses]);
  }

  async createRawTransaction(inputs: any[], outputs: any): Promise<string> {
    return this.call('createrawtransaction', [inputs, outputs]);
  }

  async signRawTransaction(rawTx: string, privateKeys: string[]): Promise<any> {
    return this.call('signrawtransactionwithkey', [rawTx, privateKeys]);
  }

  async sendRawTransaction(signedTx: string): Promise<string> {
    return this.call('sendrawtransaction', [signedTx]);
  }

  async getAddressBalance(address: string): Promise<number> {
    const utxos = await this.listUnspent([address]);
    return utxos.reduce((total, utxo) => total + utxo.amount * 100000000, 0); // Convert to satoshis
  }
}

export interface UTXO {
  txid: string;
  vout: number;
  address: string;
  amount: number;
  confirmations: number;
  spendable: boolean;
}

export function selectUtxos(utxos: UTXO[], targetAmount: number, feeRate: number): UTXO[] {
  // Implement coin selection algorithm (e.g., Branch and Bound)
  let selected: UTXO[] = [];
  let selectedAmount = 0;
  
  // Sort UTXOs by amount (largest first for simplicity)
  const sortedUtxos = [...utxos].sort((a, b) => b.amount - a.amount);
  
  for (const utxo of sortedUtxos) {
    selected.push(utxo);
    selectedAmount += utxo.amount * 100000000; // Convert to satoshis
    
    // Estimate fee for current selection
    const estimatedFee = estimateTransactionSize(selected.length, 2) * feeRate;
    
    if (selectedAmount >= targetAmount + estimatedFee) {
      break;
    }
  }
  
  return selected;
}

export function estimateTransactionSize(inputs: number, outputs: number): number {
  // Estimate transaction size in bytes
  // Base size + inputs + outputs
  return 10 + (inputs * 148) + (outputs * 34);
}
```

### 4.3 Communication Services

```typescript
// supabase/functions/_shared/email.ts
export class EmailService {
  private apiKey: string;

  constructor() {
    this.apiKey = Deno.env.get('SENDGRID_API_KEY') || '';
  }

  async sendGuardianInvitation(guardian: any): Promise<void> {
    const emailData = {
      to: guardian.email,
      from: 'noreply@bsriwallet.com',
      subject: 'You\'ve been invited as a Bitcoin Wallet Guardian',
      html: this.generateInvitationEmail(guardian)
    };

    await this.sendEmail(emailData);
  }

  async sendRecoveryNotification(recoveryId: string, guardian: any): Promise<void> {
    const emailData = {
      to: guardian.email,
      from: 'noreply@bsriwallet.com',
      subject: 'Wallet Recovery Request - Action Required',
      html: this.generateRecoveryEmail(recoveryId, guardian)
    };

    await this.sendEmail(emailData);
  }

  private async sendEmail(emailData: any): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  }

  private generateInvitationEmail(guardian: any): string {
    return `
      <h2>Bitcoin Wallet Guardian Invitation</h2>
      <p>Dear ${guardian.full_name},</p>
      <p>You have been invited to serve as a guardian for a Bitcoin inheritance wallet.</p>
      <p>As a guardian, you will help protect and recover the wallet in case of emergency.</p>
      <p><a href="${Deno.env.get('FRONTEND_URL')}/guardian/verify?token=${guardian.invitation_token}">Accept Invitation</a></p>
      <p>This invitation expires on ${new Date(guardian.invitation_expires_at).toLocaleDateString()}.</p>
    `;
  }

  private generateRecoveryEmail(recoveryId: string, guardian: any): string {
    return `
      <h2>Wallet Recovery Request</h2>
      <p>Dear ${guardian.full_name},</p>
      <p>A wallet recovery has been initiated for a wallet you are protecting as a guardian.</p>
      <p>Please review the recovery request and provide your signature if you approve.</p>
      <p><a href="${Deno.env.get('FRONTEND_URL')}/guardian/recovery/${recoveryId}">Review Recovery Request</a></p>
      <p><strong>This is time-sensitive.</strong> Please respond within 72 hours.</p>
    `;
  }
}

// supabase/functions/_shared/sms.ts
export class SMSService {
  private apiKey: string;

  constructor() {
    this.apiKey = Deno.env.get('TWILIO_API_KEY') || '';
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    // Implement SMS sending using Twilio or similar service
    const message = `Your BSRI Wallet verification code is: ${code}. This code expires in 10 minutes.`;
    
    // Implementation would depend on your chosen SMS provider
    console.log(`Sending SMS to ${phoneNumber}: ${message}`);
  }

  async sendRecoveryAlert(phoneNumber: string, recoveryId: string): Promise<void> {
    const message = `URGENT: A wallet recovery has been initiated for a wallet you protect. Check your email immediately.`;
    
    console.log(`Sending recovery alert to ${phoneNumber}: ${message}`);
  }
}
```

## 5. Security Configuration

### 5.1 Environment Variables Required

```bash
# Bitcoin Node Configuration
BITCOIN_RPC_HOST=your.bitcoin.node.host
BITCOIN_RPC_PORT=8332
BITCOIN_RPC_USER=bitcoinrpc
BITCOIN_RPC_PASSWORD=your_secure_password

# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key

# SMS Service (Twilio)
TWILIO_API_KEY=your_twilio_api_key
TWILIO_PHONE_NUMBER=your_twilio_phone

# Frontend URL
FRONTEND_URL=https://your-app-domain.com

# Encryption Keys
MASTER_ENCRYPTION_KEY=your_master_encryption_key_32_chars
AES_ENCRYPTION_IV=your_iv_16_chars

# Supabase (auto-configured)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5.2 Additional Security Measures

```sql
-- Create function to hash sensitive data
CREATE OR REPLACE FUNCTION public.hash_sensitive_data(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(input_text || current_setting('app.hash_salt'), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            old_values,
            new_values
        ) VALUES (
            auth.uid(),
            'update',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            new_values
        ) VALUES (
            auth.uid(),
            'insert',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            old_values
        ) VALUES (
            auth.uid(),
            'delete',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_wallets
    AFTER INSERT OR UPDATE OR DELETE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_guardians
    AFTER INSERT OR UPDATE OR DELETE ON public.guardians
    FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_recovery_attempts
    AFTER INSERT OR UPDATE OR DELETE ON public.recovery_attempts
    FOR EACH ROW EXECUTE FUNCTION public.audit_changes();
```

## 6. Implementation Priorities

### Phase 1: Core Infrastructure (Weeks 1-4)
1. Database schema setup with RLS policies
2. Basic authentication and user management
3. Wallet creation and management APIs
4. Guardian invitation system
5. Basic security measures

### Phase 2: Cryptographic Core (Weeks 5-8)
1. Shamir's Secret Sharing implementation
2. Bitcoin wallet generation and management
3. Transaction creation and signing
4. Key derivation and address generation

### Phase 3: Recovery System (Weeks 9-12)
1. Recovery initiation workflow
2. Guardian signature collection
3. Recovery execution logic
4. Audit trail and logging

### Phase 4: Advanced Features (Weeks 13-16)
1. Proof of life monitoring
2. Bitcoin transaction processing
3. Email and SMS notifications
4. Advanced security features

### Phase 5: Testing & Optimization (Weeks 17-20)
1. Comprehensive testing suite
2. Security audit and penetration testing
3. Performance optimization
4. Documentation and deployment

This comprehensive backend architecture provides a secure, scalable foundation for the Bitcoin Social Recovery Inheritance Wallet, implementing industry best practices for cryptography, security, and blockchain integration.