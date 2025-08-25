import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ShamirSecretSharing } from '../_shared/crypto.ts'
import { EmailService } from '../_shared/email.ts'

interface SignRecoveryRequest {
  recoveryAttemptId: string;
  guardianEmail: string;
  signatureData: string;
  signedMessageHash: string;
}

interface SignRecoveryResponse {
  success: boolean;
  message?: string;
  error?: string;
  recoveryCompleted?: boolean;
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

    const { recoveryAttemptId, guardianEmail, signatureData, signedMessageHash }: SignRecoveryRequest = await req.json();

    // Validate input
    if (!recoveryAttemptId || !guardianEmail || !signatureData || !signedMessageHash) {
      throw new Error('Missing required fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guardianEmail)) {
      throw new Error('Invalid email format');
    }

    // Get recovery attempt details
    const { data: recoveryAttempt, error: recoveryError } = await supabase
      .from('recovery_attempts')
      .select('*')
      .eq('id', recoveryAttemptId)
      .single();

    if (recoveryError || !recoveryAttempt) {
      throw new Error('Recovery attempt not found');
    }

    // Check if recovery attempt is still active
    if (recoveryAttempt.status !== 'pending' && recoveryAttempt.status !== 'collecting') {
      throw new Error('Recovery attempt is no longer active');
    }

    // Check if recovery attempt has expired
    if (new Date() > new Date(recoveryAttempt.expires_at)) {
      throw new Error('Recovery attempt has expired');
    }

    // Verify guardian has permission to sign this recovery
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select('id, wallet_id, full_name')
      .eq('wallet_id', recoveryAttempt.wallet_id)
      .eq('email', guardianEmail.toLowerCase())
      .eq('status', 'accepted')
      .single();

    if (guardianError || !guardian) {
      throw new Error('Guardian not authorized for this recovery');
    }

    // Check if guardian has already signed
    const { data: existingSignature } = await supabase
      .from('recovery_signatures')
      .select('id')
      .eq('recovery_attempt_id', recoveryAttemptId)
      .eq('guardian_id', guardian.id)
      .single();

    if (existingSignature) {
      throw new Error('Guardian has already signed this recovery attempt');
    }

    // Create recovery signature
    const { error: signatureError } = await supabase
      .from('recovery_signatures')
      .insert({
        recovery_attempt_id: recoveryAttemptId,
        guardian_id: guardian.id,
        signature_data: signatureData,
        signed_message_hash: signedMessageHash
      });

    if (signatureError) {
      console.error('Signature creation error:', signatureError);
      throw new Error('Failed to create recovery signature');
    }

    // Get updated signature count
    const { data: signatureCount } = await supabase
      .from('recovery_signatures')
      .select('id', { count: 'exact' })
      .eq('recovery_attempt_id', recoveryAttemptId);

    const currentSignatures = signatureCount?.length || 0;

    // Check if threshold is met
    const thresholdMet = currentSignatures >= recoveryAttempt.required_signatures;

    let recoveryCompleted = false;

    if (thresholdMet) {
      // Complete the recovery
      const { error: completionError } = await supabase
        .from('recovery_attempts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', recoveryAttemptId);

      if (completionError) {
        console.error('Recovery completion error:', completionError);
        throw new Error('Failed to complete recovery');
      }

      // Update wallet status
      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({ status: 'recovered' })
        .eq('id', recoveryAttempt.wallet_id);

      if (walletUpdateError) {
        console.error('Wallet status update error:', walletUpdateError);
        // Continue even if status update fails
      }

      // Send recovery completed notification
      const emailService = new EmailService();
      try {
        await emailService.sendRecoveryCompleted(recoveryAttempt.wallet_id, recoveryAttempt.new_owner_email);
      } catch (emailError) {
        console.error('Failed to send recovery completed email:', emailError);
        // Continue even if email fails
      }

      recoveryCompleted = true;
    } else {
      // Update recovery attempt status to collecting if it was pending
      if (recoveryAttempt.status === 'pending') {
        const { error: statusUpdateError } = await supabase
          .from('recovery_attempts')
          .update({ status: 'collecting' })
          .eq('id', recoveryAttemptId);

        if (statusUpdateError) {
          console.error('Status update error:', statusUpdateError);
          // Continue even if status update fails
        }
      }
    }

    // Create audit log
    await supabase.rpc('create_audit_log', {
      p_wallet_id: recoveryAttempt.wallet_id,
      p_action: 'recovery_signed',
      p_resource_type: 'recovery_signature',
      p_resource_id: recoveryAttemptId,
      p_new_values: {
        guardian_email: guardianEmail,
        guardian_name: guardian.full_name,
        current_signatures: currentSignatures,
        required_signatures: recoveryAttempt.required_signatures,
        threshold_met: thresholdMet
      },
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      p_user_agent: req.headers.get('user-agent')
    });

    const response: SignRecoveryResponse = {
      success: true,
      message: thresholdMet ? 'Recovery threshold met and wallet recovered' : 'Recovery signature added successfully',
      recoveryCompleted
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Recovery signature error:', error);
    
    const response: SignRecoveryResponse = {
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
