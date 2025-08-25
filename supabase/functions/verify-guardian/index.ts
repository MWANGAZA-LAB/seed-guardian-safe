import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { EmailService } from '../_shared/email.ts'

interface VerifyGuardianRequest {
  invitationToken: string;
  verificationCode: string;
  guardianInfo: {
    fullName: string;
    phoneNumber?: string;
  };
}

interface VerifyGuardianResponse {
  success: boolean;
  message?: string;
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

    const { invitationToken, verificationCode, guardianInfo }: VerifyGuardianRequest = await req.json();

    // Validate input
    if (!invitationToken || !verificationCode || !guardianInfo?.fullName) {
      throw new Error('Missing required fields');
    }

    // Find guardian by invitation token
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select('*')
      .eq('invitation_token', invitationToken)
      .eq('status', 'invited')
      .single();

    if (guardianError || !guardian) {
      throw new Error('Invalid or expired invitation token');
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
        invitation_token: null, // Clear the token
        last_activity_at: new Date().toISOString()
      })
      .eq('id', guardian.id);

    if (updateError) {
      console.error('Guardian update error:', updateError);
      throw new Error('Failed to update guardian status');
    }

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
      
      if (inviteError) {
        console.error('Failed to send account invitation:', inviteError);
        // Don't fail the verification if account invitation fails
      }
    }

    // Get wallet information for audit log
    const { data: wallet } = await supabase
      .from('wallets')
      .select('owner_id, name')
      .eq('id', guardian.wallet_id)
      .single();

    // Log the verification in audit trail
    await supabase.rpc('create_audit_log', {
      p_user_id: wallet?.owner_id,
      p_wallet_id: guardian.wallet_id,
      p_action: 'guardian_verified',
      p_resource_type: 'guardian',
      p_resource_id: guardian.id,
      p_new_values: { 
        status: 'accepted',
        full_name: guardianInfo.fullName,
        email: guardian.email
      },
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      p_user_agent: req.headers.get('user-agent')
    });

    // Send confirmation email to guardian
    const emailService = new EmailService();
    try {
      await emailService.sendGuardianConfirmation(guardian.email, guardianInfo.fullName, wallet?.name);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail verification if email fails
    }

    const response: VerifyGuardianResponse = {
      success: true,
      message: 'Guardian verified successfully'
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Guardian verification error:', error);
    
    const response: VerifyGuardianResponse = {
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

// Function to verify guardian code (implement your verification logic)
async function verifyGuardianCode(email: string, code: string): Promise<boolean> {
  // In a real implementation, you would:
  // 1. Store verification codes in the database with expiration
  // 2. Check if the code matches and hasn't expired
  // 3. Mark the code as used
  
  // For now, we'll use a simple implementation
  // In production, implement proper verification code storage and validation
  
  // Simulate verification (replace with actual implementation)
  const expectedCode = generateExpectedCode(email);
  return code === expectedCode;
}

// Function to generate expected verification code (simplified)
function generateExpectedCode(email: string): string {
  // In production, use a proper verification code system
  // This is just for demonstration
  const hash = btoa(email).slice(0, 6).toUpperCase();
  return hash.replace(/[^A-Z0-9]/g, '0');
}

// Add guardian confirmation email method to EmailService
declare module '../_shared/email.ts' {
  interface EmailService {
    sendGuardianConfirmation(email: string, fullName: string, walletName?: string): Promise<void>;
  }
}

// Extend EmailService with guardian confirmation method
EmailService.prototype.sendGuardianConfirmation = async function(email: string, fullName: string, walletName?: string): Promise<void> {
  const emailData = {
    to: email,
    from: this.fromEmail,
    subject: 'Guardian Role Confirmed - Bitcoin Wallet Protection',
    html: this.generateGuardianConfirmationEmail(fullName, walletName),
    text: this.generateGuardianConfirmationEmailText(fullName, walletName)
  };

  await this.sendEmail(emailData);
};

// Add these methods to the EmailService class
EmailService.prototype.generateGuardianConfirmationEmail = function(fullName: string, walletName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Guardian Role Confirmed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Guardian Role Confirmed</h1>
        </div>
        <div class="content">
          <h2>Dear ${fullName},</h2>
          <p>Thank you for accepting the role of guardian for the Bitcoin inheritance wallet${walletName ? ` "${walletName}"` : ''}.</p>
          
          <div class="success">
            <strong>Guardian Status: Active</strong><br>
            You are now officially protecting this Bitcoin wallet.
          </div>
          
          <h3>Your Responsibilities:</h3>
          <ul>
            <li>Hold an encrypted share of the wallet's recovery key</li>
            <li>Participate in recovery processes when needed</li>
            <li>Maintain the security of your guardian credentials</li>
            <li>Respond to recovery requests within 72 hours</li>
          </ul>
          
          <h3>What Happens Next:</h3>
          <p>You will receive notifications if a wallet recovery is initiated. Please respond promptly to any recovery requests to help protect the wallet owner's Bitcoin.</p>
          
          <p><strong>Security Note:</strong> Keep your guardian credentials secure and never share them with anyone.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Bitcoin Social Recovery Inheritance Wallet system.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

EmailService.prototype.generateGuardianConfirmationEmailText = function(fullName: string, walletName?: string): string {
  return `
Guardian Role Confirmed - Bitcoin Wallet Protection

Dear ${fullName},

Thank you for accepting the role of guardian for the Bitcoin inheritance wallet${walletName ? ` "${walletName}"` : ''}.

Guardian Status: Active
You are now officially protecting this Bitcoin wallet.

Your Responsibilities:
- Hold an encrypted share of the wallet's recovery key
- Participate in recovery processes when needed
- Maintain the security of your guardian credentials
- Respond to recovery requests within 72 hours

What Happens Next:
You will receive notifications if a wallet recovery is initiated. Please respond promptly to any recovery requests to help protect the wallet owner's Bitcoin.

Security Note: Keep your guardian credentials secure and never share them with anyone.

This is an automated message from the Bitcoin Social Recovery Inheritance Wallet system.
  `;
};
