import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { EmailService } from '../_shared/email.ts'

interface InitiateRecoveryRequest {
  walletId: string;
  recoveryReason: string;
  newOwnerEmail: string;
  guardianEmail: string;
}

interface InitiateRecoveryResponse {
  success: boolean;
  recoveryAttemptId?: string;
  error?: string;
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

    // Validate input
    if (!walletId || !recoveryReason || !newOwnerEmail || !guardianEmail) {
      throw new Error('Missing required fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newOwnerEmail) || !emailRegex.test(guardianEmail)) {
      throw new Error('Invalid email format');
    }

    // Verify guardian has permission to initiate recovery
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select('id, wallet_id, full_name')
      .eq('wallet_id', walletId)
      .eq('email', guardianEmail.toLowerCase())
      .eq('status', 'accepted')
      .single();

    if (guardianError || !guardian) {
      throw new Error('Guardian not authorized for this wallet');
    }

    // Get wallet details
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('threshold_requirement, status, name, owner_id')
      .eq('id', walletId)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.status !== 'active') {
      throw new Error('Wallet is not in active state');
    }

    // Check if there's already an active recovery attempt
    const { data: existingRecovery } = await supabase
      .from('recovery_attempts')
      .select('id, status')
      .eq('wallet_id', walletId)
      .in('status', ['pending', 'collecting'])
      .single();

    if (existingRecovery) {
      throw new Error('Recovery attempt already in progress');
    }

    // Create recovery attempt
    const { data: recoveryAttempt, error: recoveryError } = await supabase
      .from('recovery_attempts')
      .insert({
        wallet_id: walletId,
        initiated_by_guardian_id: guardian.id,
        recovery_reason: recoveryReason,
        required_signatures: wallet.threshold_requirement,
        new_owner_email: newOwnerEmail.toLowerCase(),
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
        recovery_data: {
          initiated_by: guardianEmail,
          initiated_at: new Date().toISOString(),
          reason: recoveryReason
        }
      })
      .select()
      .single();

    if (recoveryError) {
      console.error('Recovery creation error:', recoveryError);
      throw new Error('Failed to create recovery attempt');
    }

    // Update wallet status
    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .update({ status: 'recovering' })
      .eq('id', walletId);

    if (walletUpdateError) {
      console.error('Wallet status update error:', walletUpdateError);
      // Continue even if status update fails
    }

    // Get all guardians for notification
    const { data: allGuardians } = await supabase
      .from('guardians')
      .select('email, full_name')
      .eq('wallet_id', walletId)
      .eq('status', 'accepted');

    // Send notifications to all guardians
    const emailService = new EmailService();
    const notificationPromises = (allGuardians || []).map(async (guardianToNotify) => {
      try {
        await emailService.sendRecoveryNotification(recoveryAttempt.id, guardianToNotify);
      } catch (emailError) {
        console.error(`Failed to send recovery notification to ${guardianToNotify.email}:`, emailError);
        // Continue with other notifications even if one fails
      }
    });

    await Promise.all(notificationPromises);

    // Create audit log
    await supabase.rpc('create_audit_log', {
      p_user_id: wallet.owner_id,
      p_wallet_id: walletId,
      p_action: 'recovery_initiated',
      p_resource_type: 'recovery_attempt',
      p_resource_id: recoveryAttempt.id,
      p_new_values: {
        recovery_reason: recoveryReason,
        new_owner_email: newOwnerEmail,
        initiated_by_guardian: guardianEmail,
        required_signatures: wallet.threshold_requirement
      },
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      p_user_agent: req.headers.get('user-agent')
    });

    const response: InitiateRecoveryResponse = {
      success: true,
      recoveryAttemptId: recoveryAttempt.id
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Recovery initiation error:', error);
    
    const response: InitiateRecoveryResponse = {
      success: false,
      error: error.message
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
