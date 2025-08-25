-- Bitcoin Social Recovery Inheritance Wallet - RLS Policies
-- Migration: 002_rls_policies.sql

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

CREATE POLICY "Guardians can create recovery attempts" ON public.recovery_attempts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.guardians 
            WHERE guardians.wallet_id = recovery_attempts.wallet_id 
            AND guardians.email = auth.jwt() ->> 'email'
            AND guardians.status = 'accepted'
        )
    );

-- Recovery signatures policies
CREATE POLICY "Guardians can manage their signatures" ON public.recovery_signatures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.guardians 
            WHERE guardians.id = recovery_signatures.guardian_id 
            AND guardians.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Wallet owners can view recovery signatures" ON public.recovery_signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.recovery_attempts ra
            JOIN public.wallets w ON ra.wallet_id = w.id
            WHERE ra.id = recovery_signatures.recovery_attempt_id 
            AND w.owner_id = auth.uid()
        )
    );

-- Proof of life policies
CREATE POLICY "Wallet owners can manage proof of life" ON public.proof_of_life
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.wallets 
            WHERE wallets.id = proof_of_life.wallet_id 
            AND wallets.owner_id = auth.uid()
        )
    );

-- Wallet addresses policies
CREATE POLICY "Wallet owners can manage addresses" ON public.wallet_addresses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.wallets 
            WHERE wallets.id = wallet_addresses.wallet_id 
            AND wallets.owner_id = auth.uid()
        )
    );

-- Transactions policies
CREATE POLICY "Wallet owners can manage transactions" ON public.transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.wallets 
            WHERE wallets.id = transactions.wallet_id 
            AND wallets.owner_id = auth.uid()
        )
    );

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.wallets 
            WHERE wallets.id = audit_logs.wallet_id 
            AND wallets.owner_id = auth.uid()
        )
    );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);
