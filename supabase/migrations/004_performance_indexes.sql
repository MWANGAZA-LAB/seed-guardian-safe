-- Bitcoin Social Recovery Inheritance Wallet - Performance Indexes
-- Migration: 004_performance_indexes.sql

-- Add composite indexes for common query patterns

-- Guardians: Optimize queries by wallet and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guardians_wallet_status 
ON public.guardians(wallet_id, status);

-- Guardians: Optimize email lookups with status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guardians_status_email 
ON public.guardians(status, email);

-- Recovery attempts: Optimize by wallet, status, and expiration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recovery_attempts_wallet_status_expires 
ON public.recovery_attempts(wallet_id, status, expires_at);

-- Recovery attempts: Optimize by status and expiration for cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recovery_attempts_status_expires 
ON public.recovery_attempts(status, expires_at);

-- Recovery signatures: Optimize by recovery attempt and guardian
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recovery_signatures_attempt_guardian 
ON public.recovery_signatures(recovery_attempt_id, guardian_id);

-- Transactions: Optimize by wallet and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_wallet_status 
ON public.transactions(wallet_id, status);

-- Transactions: Optimize by wallet and creation time for recent transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_wallet_created 
ON public.transactions(wallet_id, created_at DESC);

-- Wallet addresses: Optimize by wallet and address type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_addresses_wallet_type 
ON public.wallet_addresses(wallet_id, address_type);

-- Wallet addresses: Optimize by address for lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_addresses_address 
ON public.wallet_addresses(address);

-- Proof of life: Optimize by wallet and verification time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proof_of_life_wallet_verified 
ON public.proof_of_life(wallet_id, verified_at DESC);

-- Audit logs: Optimize by user and creation time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created 
ON public.audit_logs(user_id, created_at DESC);

-- Audit logs: Optimize by wallet and action type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_wallet_action 
ON public.audit_logs(wallet_id, action);

-- Add partial indexes for active records only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guardians_active 
ON public.guardians(wallet_id, email) 
WHERE status IN ('accepted', 'invited');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recovery_attempts_active 
ON public.recovery_attempts(wallet_id, status) 
WHERE status IN ('pending', 'collecting');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_pending 
ON public.transactions(wallet_id, created_at DESC) 
WHERE status = 'pending';

-- Add indexes for text search (if needed for guardian names)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guardians_full_name_gin 
ON public.guardians USING gin(to_tsvector('english', full_name));

-- Add indexes for JSONB fields that might be queried
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recovery_attempts_data_gin 
ON public.recovery_attempts USING gin(recovery_data);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proof_of_life_data_gin 
ON public.proof_of_life USING gin(proof_data);

-- Add statistics for better query planning
ANALYZE public.guardians;
ANALYZE public.recovery_attempts;
ANALYZE public.recovery_signatures;
ANALYZE public.transactions;
ANALYZE public.wallet_addresses;
ANALYZE public.proof_of_life;
ANALYZE public.audit_logs;
