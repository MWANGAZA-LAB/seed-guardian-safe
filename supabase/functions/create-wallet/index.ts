import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ShamirSecretSharing, BitcoinCrypto, DataEncryption } from '../_shared/crypto.ts'
import { EmailService } from '../_shared/email.ts'
import { Validator, createWalletSchema, guardianSchema, sanitizeEmail, sanitizeString, sanitizePhoneNumber } from '../_shared/validation.ts'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  createCORSResponse,
  AuthenticationError,
  ValidationError,
  DatabaseError,
  CryptoError,
  ErrorHandler
} from '../_shared/errors.ts'

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
    return createCORSResponse();
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new AuthenticationError('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Parse and validate request body
    const requestData = await req.json();
    
    // Validate main request structure
    const validator = new Validator(createWalletSchema);
    const validatedData = validator.validate(requestData);

    // Validate guardians array
    if (!Array.isArray(validatedData.guardians) || validatedData.guardians.length < 2) {
      throw new ValidationError('At least 2 guardians are required');
    }

    if (validatedData.guardians.length > 10) {
      throw new ValidationError('Maximum 10 guardians allowed');
    }

    // Validate threshold requirement
    if (validatedData.thresholdRequirement < 2 || validatedData.thresholdRequirement > validatedData.guardians.length) {
      throw new ValidationError('Threshold must be between 2 and the number of guardians');
    }

    // Validate and sanitize each guardian
    const guardianValidator = new Validator(guardianSchema);
    const sanitizedGuardians = validatedData.guardians.map((guardian, index) => {
      const validatedGuardian = guardianValidator.validate(guardian);
      return {
        email: sanitizeEmail(validatedGuardian.email),
        fullName: sanitizeString(validatedGuardian.fullName),
        phoneNumber: validatedGuardian.phoneNumber ? sanitizePhoneNumber(validatedGuardian.phoneNumber) : undefined,
      };
    });

    // Check for duplicate guardian emails
    const guardianEmails = sanitizedGuardians.map(g => g.email);
    const uniqueEmails = new Set(guardianEmails);
    if (uniqueEmails.size !== guardianEmails.length) {
      throw new ValidationError('Duplicate guardian emails are not allowed');
    }

    // Encrypt master seed with user password for additional security
    const encryptedMasterSeed = await DataEncryption.encryptWithPassword(
      validatedData.masterSeed, 
      validatedData.userPassword
    );

    // Create wallet record
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .insert({
        owner_id: user.id,
        name: sanitizeString(validatedData.name),
        encrypted_master_seed: encryptedMasterSeed,
        threshold_requirement: validatedData.thresholdRequirement,
        total_guardians: sanitizedGuardians.length
      })
      .select()
      .single();

    if (walletError) {
      throw new DatabaseError('create_wallet', walletError.message, walletError);
    }

    // Split the master seed using Shamir's Secret Sharing
    const shamirSharing = new ShamirSecretSharing();
    const secretShares = await shamirSharing.splitSecret(
      validatedData.masterSeed,
      validatedData.thresholdRequirement,
      sanitizedGuardians.length
    );

    // Create guardian records
    const guardianRecords = sanitizedGuardians.map((guardian, index) => ({
      wallet_id: wallet.id,
      email: guardian.email,
      full_name: guardian.fullName,
      phone_number: guardian.phoneNumber,
      share_index: secretShares[index].shareIndex,
      encrypted_share: secretShares[index].encryptedShare,
      public_key: secretShares[index].publicKey,
      private_key: secretShares[index].privateKey,
      invitation_token: crypto.randomUUID(),
      invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending'
    }));

    const { error: guardianError } = await supabase
      .from('guardians')
      .insert(guardianRecords);

    if (guardianError) {
      // Clean up wallet if guardian creation fails
      await supabase.from('wallets').delete().eq('id', wallet.id);
      throw new DatabaseError('create_guardians', guardianError.message, guardianError);
    }

    // Send invitation emails to guardians
    const emailService = new EmailService();
    const emailPromises = guardianRecords.map(guardian => 
      emailService.sendGuardianInvitation(guardian)
    );

    // Send emails in parallel but don't fail the entire operation if emails fail
    try {
      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      console.error('Failed to send some guardian invitations:', emailError);
      // Continue with the operation even if emails fail
    }

    // Create audit log entry
    await supabase.from('audit_logs').insert({
      wallet_id: wallet.id,
      user_id: user.id,
      action: 'wallet_created',
      details: {
        wallet_name: validatedData.name,
        guardian_count: sanitizedGuardians.length,
        threshold: validatedData.thresholdRequirement
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    });

    return createSuccessResponse({
      success: true,
      walletId: wallet.id,
      message: 'Wallet created successfully. Guardian invitations have been sent.'
    });

  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return createErrorResponse(appError);
  }
});
