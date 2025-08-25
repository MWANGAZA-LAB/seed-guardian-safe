import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ShamirSecretSharing, BitcoinCrypto, DataEncryption } from '../_shared/crypto.ts'
import { EmailService } from '../_shared/email.ts'

interface CreateWalletRequest {
  name: string;
  masterSeed: string; // Client-encrypted
  guardians: Array<{
    email: string;
    fullName: string;
    phoneNumber?: string;
  }>;
  thresholdRequirement: number;
  userPassword: string; // For additional encryption
}

interface CreateWalletResponse {
  success: boolean;
  walletId?: string;
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

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { name, masterSeed, guardians, thresholdRequirement, userPassword }: CreateWalletRequest = await req.json();

    // Validate input
    if (!name || !masterSeed || !guardians || !thresholdRequirement || !userPassword) {
      throw new Error('Missing required fields');
    }

    if (guardians.length < thresholdRequirement || thresholdRequirement < 2) {
      throw new Error('Invalid threshold configuration: must have at least 2 guardians and threshold cannot exceed guardian count');
    }

    if (guardians.length > 10) {
      throw new Error('Maximum 10 guardians allowed');
    }

    // Validate guardian emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const guardian of guardians) {
      if (!emailRegex.test(guardian.email)) {
        throw new Error(`Invalid email address: ${guardian.email}`);
      }
    }

    // Check for duplicate guardian emails
    const guardianEmails = guardians.map(g => g.email.toLowerCase());
    const uniqueEmails = new Set(guardianEmails);
    if (uniqueEmails.size !== guardianEmails.length) {
      throw new Error('Duplicate guardian emails are not allowed');
    }

    // Encrypt master seed with user password for additional security
    const encryptedMasterSeed = await DataEncryption.encryptWithPassword(masterSeed, userPassword);

    // Create wallet record
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .insert({
        owner_id: user.id,
        name,
        encrypted_master_seed: encryptedMasterSeed,
        threshold_requirement: thresholdRequirement,
        total_guardians: guardians.length
      })
      .select()
      .single();

    if (walletError) {
      console.error('Wallet creation error:', walletError);
      throw new Error('Failed to create wallet');
    }

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
      email: guardian.email.toLowerCase(),
      full_name: guardian.fullName,
      phone_number: guardian.phoneNumber,
      encrypted_secret_share: shares[index].encryptedShare,
      share_index: index + 1,
      public_key: shares[index].publicKey,
      invitation_token: crypto.randomUUID(),
      invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    }));

    const { error: guardiansError } = await supabase
      .from('guardians')
      .insert(guardianRecords);

    if (guardiansError) {
      console.error('Guardian creation error:', guardiansError);
      // Clean up wallet if guardian creation fails
      await supabase.from('wallets').delete().eq('id', wallet.id);
      throw new Error('Failed to create guardians');
    }

    // Create audit log
    await supabase.rpc('create_audit_log', {
      p_user_id: user.id,
      p_wallet_id: wallet.id,
      p_action: 'wallet_created',
      p_resource_type: 'wallet',
      p_resource_id: wallet.id,
      p_new_values: {
        name,
        threshold_requirement: thresholdRequirement,
        total_guardians: guardians.length
      }
    });

    // Send guardian invitations
    const emailService = new EmailService();
    for (const guardianRecord of guardianRecords) {
      try {
        await emailService.sendGuardianInvitation(guardianRecord);
      } catch (emailError) {
        console.error(`Failed to send invitation to ${guardianRecord.email}:`, emailError);
        // Continue with other invitations even if one fails
      }
    }

    // Create initial proof of life entry
    await supabase
      .from('proof_of_life')
      .insert({
        wallet_id: wallet.id,
        proof_type: 'manual',
        proof_data: { action: 'wallet_creation' },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      });

    const response: CreateWalletResponse = {
      success: true,
      walletId: wallet.id
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    );

  } catch (error) {
    console.error('Create wallet error:', error);
    
    const response: CreateWalletResponse = {
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
