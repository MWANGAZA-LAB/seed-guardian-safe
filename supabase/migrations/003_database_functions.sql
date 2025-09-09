-- Bitcoin Social Recovery Inheritance Wallet - Database Functions
-- Migration: 003_database_functions.sql

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

-- Function to hash sensitive data
CREATE OR REPLACE FUNCTION public.hash_sensitive_data(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(input_text || current_setting('app.hash_salt', true) || 'default_salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_user_id UUID,
    p_wallet_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        wallet_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_wallet_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate guardian threshold
CREATE OR REPLACE FUNCTION public.validate_guardian_threshold(
    p_wallet_id UUID,
    p_threshold INTEGER,
    p_total_guardians INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if threshold is valid
    IF p_threshold < 2 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if total guardians is sufficient
    IF p_total_guardians < p_threshold THEN
        RETURN FALSE;
    END IF;
    
    -- Check if we have enough accepted guardians
    IF p_total_guardians > (
        SELECT COUNT(*) 
        FROM public.guardians 
        WHERE wallet_id = p_wallet_id 
        AND status = 'accepted'
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get wallet balance
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS BIGINT AS $$
DECLARE
    total_balance BIGINT;
BEGIN
    SELECT COALESCE(SUM(balance_satoshis), 0)
    INTO total_balance
    FROM public.wallet_addresses
    WHERE wallet_id = p_wallet_id;
    
    RETURN total_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if recovery attempt is expired
CREATE OR REPLACE FUNCTION public.is_recovery_expired(p_recovery_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT expires_at
    INTO expires_at
    FROM public.recovery_attempts
    WHERE id = p_recovery_id;
    
    RETURN NOW() > expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get wallet guardian statistics
CREATE OR REPLACE FUNCTION public.get_wallet_guardians_status(p_wallet_id UUID)
RETURNS TABLE(
    total_guardians INTEGER,
    active_guardians INTEGER,
    pending_guardians INTEGER,
    declined_guardians INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_guardians,
        COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER as active_guardians,
        COUNT(*) FILTER (WHERE status = 'invited')::INTEGER as pending_guardians,
        COUNT(*) FILTER (WHERE status = 'declined')::INTEGER as declined_guardians
    FROM public.guardians 
    WHERE wallet_id = p_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired recovery attempts
CREATE OR REPLACE FUNCTION public.cleanup_expired_recovery_attempts()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE public.recovery_attempts
    SET status = 'expired'
    WHERE status IN ('pending', 'collecting')
    AND expires_at < NOW();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent wallet activity
CREATE OR REPLACE FUNCTION public.get_wallet_activity(p_wallet_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE(
    activity_type TEXT,
    activity_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    (
        SELECT 
            'transaction'::TEXT as activity_type,
            jsonb_build_object(
                'txid', txid,
                'amount_satoshis', amount_satoshis,
                'status', status,
                'transaction_type', transaction_type
            ) as activity_data,
            created_at
        FROM public.transactions
        WHERE wallet_id = p_wallet_id
        
        UNION ALL
        
        SELECT 
            'recovery_attempt'::TEXT as activity_type,
            jsonb_build_object(
                'recovery_reason', recovery_reason,
                'status', status,
                'required_signatures', required_signatures,
                'current_signatures', current_signatures
            ) as activity_data,
            created_at
        FROM public.recovery_attempts
        WHERE wallet_id = p_wallet_id
        
        UNION ALL
        
        SELECT 
            'proof_of_life'::TEXT as activity_type,
            jsonb_build_object(
                'proof_type', proof_type,
                'ip_address', ip_address
            ) as activity_data,
            verified_at as created_at
        FROM public.proof_of_life
        WHERE wallet_id = p_wallet_id
    )
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;