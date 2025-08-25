// Email service for Bitcoin Social Recovery Inheritance Wallet

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = Deno.env.get('SENDGRID_API_KEY') || '';
    this.fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@bsriwallet.com';
    this.baseUrl = 'https://api.sendgrid.com/v3/mail/send';
  }

  async sendEmail(emailData: EmailData): Promise<void> {
    if (!this.apiKey) {
      console.warn('SendGrid API key not configured, skipping email send');
      return;
    }

    const payload = {
      personalizations: [
        {
          to: [{ email: emailData.to }],
          subject: emailData.subject
        }
      ],
      from: { email: emailData.from },
      content: [
        {
          type: 'text/html',
          value: emailData.html
        }
      ]
    };

    if (emailData.text) {
      payload.content.push({
        type: 'text/plain',
        value: emailData.text
      });
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  async sendGuardianInvitation(guardian: any): Promise<void> {
    const emailData: EmailData = {
      to: guardian.email,
      from: this.fromEmail,
      subject: 'You\'ve been invited as a Bitcoin Wallet Guardian',
      html: this.generateInvitationEmail(guardian),
      text: this.generateInvitationEmailText(guardian)
    };

    await this.sendEmail(emailData);
  }

  async sendRecoveryNotification(recoveryId: string, guardian: any): Promise<void> {
    const emailData: EmailData = {
      to: guardian.email,
      from: this.fromEmail,
      subject: 'Wallet Recovery Request - Action Required',
      html: this.generateRecoveryEmail(recoveryId, guardian),
      text: this.generateRecoveryEmailText(recoveryId, guardian)
    };

    await this.sendEmail(emailData);
  }

  async sendRecoveryCompleted(walletId: string, newOwnerEmail: string): Promise<void> {
    const emailData: EmailData = {
      to: newOwnerEmail,
      from: this.fromEmail,
      subject: 'Bitcoin Wallet Recovery Completed',
      html: this.generateRecoveryCompletedEmail(walletId),
      text: this.generateRecoveryCompletedEmailText(walletId)
    };

    await this.sendEmail(emailData);
  }

  async sendProofOfLifeReminder(walletId: string, userEmail: string): Promise<void> {
    const emailData: EmailData = {
      to: userEmail,
      from: this.fromEmail,
      subject: 'Proof of Life Check Required',
      html: this.generateProofOfLifeEmail(walletId),
      text: this.generateProofOfLifeEmailText(walletId)
    };

    await this.sendEmail(emailData);
  }

  private generateInvitationEmail(guardian: any): string {
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://bsriwallet.com';
    const verifyUrl = `${frontendUrl}/guardian/verify?token=${guardian.invitation_token}`;
    const expiresDate = new Date(guardian.invitation_expires_at).toLocaleDateString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bitcoin Wallet Guardian Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f7931a 0%, #e6a23c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f7931a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Bitcoin Wallet Guardian Invitation</h1>
          </div>
          <div class="content">
            <h2>Dear ${guardian.full_name},</h2>
            <p>You have been invited to serve as a guardian for a Bitcoin inheritance wallet. This is a significant responsibility that helps protect digital assets for future generations.</p>
            
            <h3>What is a Guardian?</h3>
            <p>As a guardian, you will:</p>
            <ul>
              <li>Hold an encrypted share of the wallet's recovery key</li>
              <li>Help recover the wallet if the owner becomes unavailable</li>
              <li>Participate in the social recovery process when needed</li>
            </ul>
            
            <div class="warning">
              <strong>Important:</strong> This invitation expires on ${expiresDate}. Please respond promptly.
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" class="button">Accept Guardian Invitation</a>
            </p>
            
            <p>If you have any questions about this role, please contact the wallet owner directly.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Bitcoin Social Recovery Inheritance Wallet system.</p>
            <p>If you did not expect this invitation, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateInvitationEmailText(guardian: any): string {
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://bsriwallet.com';
    const verifyUrl = `${frontendUrl}/guardian/verify?token=${guardian.invitation_token}`;
    const expiresDate = new Date(guardian.invitation_expires_at).toLocaleDateString();

    return `
Bitcoin Wallet Guardian Invitation

Dear ${guardian.full_name},

You have been invited to serve as a guardian for a Bitcoin inheritance wallet. This is a significant responsibility that helps protect digital assets for future generations.

What is a Guardian?
As a guardian, you will:
- Hold an encrypted share of the wallet's recovery key
- Help recover the wallet if the owner becomes unavailable
- Participate in the social recovery process when needed

Important: This invitation expires on ${expiresDate}. Please respond promptly.

To accept this invitation, visit: ${verifyUrl}

If you have any questions about this role, please contact the wallet owner directly.

This is an automated message from the Bitcoin Social Recovery Inheritance Wallet system.
If you did not expect this invitation, please ignore this email.
    `;
  }

  private generateRecoveryEmail(recoveryId: string, guardian: any): string {
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://bsriwallet.com';
    const recoveryUrl = `${frontendUrl}/guardian/recovery/${recoveryId}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wallet Recovery Request - Action Required</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .urgent { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Wallet Recovery Request</h1>
          </div>
          <div class="content">
            <h2>Dear ${guardian.full_name},</h2>
            <p>A wallet recovery has been initiated for a Bitcoin wallet you are protecting as a guardian.</p>
            
            <div class="urgent">
              <strong>URGENT ACTION REQUIRED</strong><br>
              This recovery request requires your immediate attention and signature.
            </div>
            
            <h3>What you need to do:</h3>
            <ol>
              <li>Review the recovery request details</li>
              <li>Verify the recovery reason is legitimate</li>
              <li>Provide your cryptographic signature if you approve</li>
            </ol>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${recoveryUrl}" class="button">Review Recovery Request</a>
            </p>
            
            <p><strong>Time-sensitive:</strong> This recovery request expires in 72 hours. Please respond promptly.</p>
            
            <p>If you have any concerns about this recovery request, please contact the other guardians immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Bitcoin Social Recovery Inheritance Wallet system.</p>
            <p>Recovery ID: ${recoveryId}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateRecoveryEmailText(recoveryId: string, guardian: any): string {
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://bsriwallet.com';
    const recoveryUrl = `${frontendUrl}/guardian/recovery/${recoveryId}`;

    return `
Wallet Recovery Request - Action Required

Dear ${guardian.full_name},

A wallet recovery has been initiated for a Bitcoin wallet you are protecting as a guardian.

URGENT ACTION REQUIRED
This recovery request requires your immediate attention and signature.

What you need to do:
1. Review the recovery request details
2. Verify the recovery reason is legitimate
3. Provide your cryptographic signature if you approve

To review the recovery request, visit: ${recoveryUrl}

Time-sensitive: This recovery request expires in 72 hours. Please respond promptly.

If you have any concerns about this recovery request, please contact the other guardians immediately.

This is an automated message from the Bitcoin Social Recovery Inheritance Wallet system.
Recovery ID: ${recoveryId}
    `;
  }

  private generateRecoveryCompletedEmail(walletId: string): string {
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://bsriwallet.com';
    const walletUrl = `${frontendUrl}/wallet/${walletId}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bitcoin Wallet Recovery Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Wallet Recovery Completed</h1>
          </div>
          <div class="content">
            <h2>Recovery Successfully Completed</h2>
            <p>The Bitcoin wallet recovery process has been completed successfully.</p>
            
            <div class="success">
              <strong>Wallet Access Restored</strong><br>
              You now have full access to the recovered Bitcoin wallet.
            </div>
            
            <h3>Next Steps:</h3>
            <ul>
              <li>Access your recovered wallet</li>
              <li>Review your Bitcoin balance</li>
              <li>Set up new security measures</li>
              <li>Consider setting up new guardians</li>
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${walletUrl}" class="button">Access Your Wallet</a>
            </p>
            
            <p><strong>Security Note:</strong> For your security, we recommend changing your wallet password and reviewing your guardian setup.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Bitcoin Social Recovery Inheritance Wallet system.</p>
            <p>Wallet ID: ${walletId}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateRecoveryCompletedEmailText(walletId: string): string {
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://bsriwallet.com';
    const walletUrl = `${frontendUrl}/wallet/${walletId}`;

    return `
Bitcoin Wallet Recovery Completed

Recovery Successfully Completed

The Bitcoin wallet recovery process has been completed successfully.

Wallet Access Restored
You now have full access to the recovered Bitcoin wallet.

Next Steps:
- Access your recovered wallet
- Review your Bitcoin balance
- Set up new security measures
- Consider setting up new guardians

To access your wallet, visit: ${walletUrl}

Security Note: For your security, we recommend changing your wallet password and reviewing your guardian setup.

This is an automated message from the Bitcoin Social Recovery Inheritance Wallet system.
Wallet ID: ${walletId}
    `;
  }

  private generateProofOfLifeEmail(walletId: string): string {
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://bsriwallet.com';
    const proofUrl = `${frontendUrl}/wallet/${walletId}/proof-of-life`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Proof of Life Check Required</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ffc107; color: #333; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .reminder { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔍 Proof of Life Check</h1>
          </div>
          <div class="content">
            <h2>Time for Your Regular Check-in</h2>
            <p>This is a routine proof of life check for your Bitcoin inheritance wallet.</p>
            
            <div class="reminder">
              <strong>Routine Check</strong><br>
              Please confirm that you are still active and in control of your wallet.
            </div>
            
            <h3>Why is this important?</h3>
            <p>Regular proof of life checks help prevent unauthorized recovery attempts and ensure your wallet remains secure.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${proofUrl}" class="button">Complete Proof of Life Check</a>
            </p>
            
            <p>This check takes less than 2 minutes to complete and helps maintain the security of your Bitcoin wallet.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Bitcoin Social Recovery Inheritance Wallet system.</p>
            <p>Wallet ID: ${walletId}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateProofOfLifeEmailText(walletId: string): string {
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://bsriwallet.com';
    const proofUrl = `${frontendUrl}/wallet/${walletId}/proof-of-life`;

    return `
Proof of Life Check Required

Time for Your Regular Check-in

This is a routine proof of life check for your Bitcoin inheritance wallet.

Routine Check
Please confirm that you are still active and in control of your wallet.

Why is this important?
Regular proof of life checks help prevent unauthorized recovery attempts and ensure your wallet remains secure.

To complete your proof of life check, visit: ${proofUrl}

This check takes less than 2 minutes to complete and helps maintain the security of your Bitcoin wallet.

This is an automated message from the Bitcoin Social Recovery Inheritance Wallet system.
Wallet ID: ${walletId}
    `;
  }
}
