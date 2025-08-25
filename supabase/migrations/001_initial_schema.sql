-- Bitcoin Social Recovery Inheritance Wallet - Initial Schema
-- Migration: 001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    derivation_path TEXT DEFAULT 'm/44''/0''/0''',
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

-- Create indexes for performance
CREATE INDEX idx_wallets_owner_id ON public.wallets(owner_id);
CREATE INDEX idx_guardians_wallet_id ON public.guardians(wallet_id);
CREATE INDEX idx_guardians_email ON public.guardians(email);
CREATE INDEX idx_recovery_attempts_wallet_id ON public.recovery_attempts(wallet_id);
CREATE INDEX idx_recovery_signatures_attempt_id ON public.recovery_signatures(recovery_attempt_id);
CREATE INDEX idx_proof_of_life_wallet_id ON public.proof_of_life(wallet_id);
CREATE INDEX idx_wallet_addresses_wallet_id ON public.wallet_addresses(wallet_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_audit_logs_wallet_id ON public.audit_logs(wallet_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
