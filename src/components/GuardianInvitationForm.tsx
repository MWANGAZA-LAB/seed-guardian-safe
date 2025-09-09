import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  UserPlus,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface GuardianInvitationFormProps {
  walletId?: string;
  onSuccess?: (invitationId: string) => void;
  onCancel?: () => void;
}

interface GuardianInvitation {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  notes: string;
  verificationMethod: 'email' | 'sms' | 'both';
  priority: 'high' | 'medium' | 'low';
  customMessage: string;
}

interface InvitationStatus {
  id: string;
  guardianName: string;
  email: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'accepted' | 'declined' | 'expired';
  sentAt: string;
  expiresAt: string;
  reminderCount: number;
}

export default function GuardianInvitationForm({ 
  walletId, 
  onSuccess, 
  onCancel 
}: GuardianInvitationFormProps) {
  useProtocol();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [form, setForm] = useState<GuardianInvitation>({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    notes: '',
    verificationMethod: 'email',
    priority: 'medium',
    customMessage: ''
  });

  const [errors, setErrors] = useState<Partial<GuardianInvitation>>({});
  const [invitations, setInvitations] = useState<InvitationStatus[]>([]);

  useEffect(() => {
    loadPendingInvitations();
  }, [walletId]);

  const loadPendingInvitations = async () => {
    try {
      // Load pending invitations from Supabase
      const pendingInvitations = await loadInvitationsFromSupabase();
      setInvitations(pendingInvitations);
    } catch (err) {
      logger.error('Failed to load pending invitations', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const loadInvitationsFromSupabase = async (): Promise<InvitationStatus[]> => {
    // Mock implementation - would integrate with Supabase
    return [
      {
        id: 'inv-1',
        guardianName: 'John Doe',
        email: 'john@example.com',
        status: 'sent',
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 604800000).toISOString(),
        reminderCount: 0
      },
      {
        id: 'inv-2',
        guardianName: 'Jane Smith',
        email: 'jane@example.com',
        status: 'opened',
        sentAt: new Date(Date.now() - 172800000).toISOString(),
        expiresAt: new Date(Date.now() + 432000000).toISOString(),
        reminderCount: 1
      }
    ];
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<GuardianInvitation> = {};

    if (step === 1) {
      if (!form.name.trim()) {
        newErrors.name = 'Guardian name is required';
      }
      if (!form.email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!form.relationship.trim()) {
        newErrors.relationship = 'Relationship is required';
      }
    }

    if (step === 2) {
      if (form.verificationMethod === 'sms' || form.verificationMethod === 'both') {
        if (!form.phone.trim()) {
          newErrors.phone = 'Phone number is required for SMS verification';
        } else if (!/^\+?[\d\s\-()]+$/.test(form.phone)) {
          newErrors.phone = 'Please enter a valid phone number';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Send invitation via Supabase function
      const invitationId = await sendGuardianInvitation(form);
      
      toast({
        title: "Invitation Sent",
        description: `Guardian invitation has been sent to ${form.name}`,
      });

      onSuccess?.(invitationId);
      
      // Reload invitations
      await loadPendingInvitations();
      
    } catch (err) {
      logger.error('Failed to send guardian invitation', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to send guardian invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendGuardianInvitation = async (_invitationData: GuardianInvitation): Promise<string> => {
    // Mock implementation - would call Supabase function
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `inv-${Date.now()}`;
  };

  const handleResendInvitation = async (_invitationId: string) => {
    try {
      // Resend invitation via Supabase function
      await resendInvitationViaSupabase(_invitationId);
      
      toast({
        title: "Invitation Resent",
        description: "Guardian invitation has been resent",
      });
      
      await loadPendingInvitations();
    } catch (err) {
      logger.error('Failed to resend invitation', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    }
  };

  const resendInvitationViaSupabase = async (invitationId: string): Promise<void> => {
    // Mock implementation - would call Supabase function
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'delivered':
        return 'secondary';
      case 'opened':
        return 'outline';
      case 'accepted':
        return 'default';
      case 'declined':
        return 'destructive';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'opened':
        return <CheckCircle className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'declined':
        return <AlertTriangle className="h-4 w-4" />;
      case 'expired':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input
                id="guardianName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter guardian's full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="guardianEmail">Email Address</Label>
              <Input
                id="guardianEmail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter guardian's email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="relationship">Relationship</Label>
              <Input
                id="relationship"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                placeholder="e.g., Spouse, Child, Sibling, Friend"
                className={errors.relationship ? 'border-red-500' : ''}
              />
              {errors.relationship && <p className="text-sm text-red-500 mt-1">{errors.relationship}</p>}
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional information about this guardian"
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="verificationMethod">Verification Method</Label>
              <select
                id="verificationMethod"
                value={form.verificationMethod}
                onChange={(e) => setForm({ ...form, verificationMethod: e.target.value as 'email' | 'sms' | 'both' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="email">Email Only</option>
                <option value="sms">SMS Only</option>
                <option value="both">Email + SMS</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                How should this guardian verify their identity during recovery?
              </p>
            </div>

            {(form.verificationMethod === 'sms' || form.verificationMethod === 'both') && (
              <div>
                <Label htmlFor="guardianPhone">Phone Number</Label>
                <Input
                  id="guardianPhone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter guardian's phone number"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Include country code (e.g., +1 for US)
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <select
                id="priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as 'high' | 'medium' | 'low' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                High priority guardians will be contacted first during recovery
              </p>
            </div>

            <div>
              <Label htmlFor="customMessage">Custom Message (Optional)</Label>
              <Textarea
                id="customMessage"
                value={form.customMessage}
                onChange={(e) => setForm({ ...form, customMessage: e.target.value })}
                placeholder="Personal message to include in the invitation"
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Invite Guardian
          </h2>
          <p className="text-muted-foreground">
            Step {currentStep} of 2: {currentStep === 1 ? 'Guardian Information' : 'Verification Setup'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round((currentStep / 2) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {currentStep < 2 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
              <Button variant="outline" size="sm" onClick={loadPendingInvitations}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Track the status of your guardian invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(invitation.status)}
                    <div>
                      <p className="font-medium">{invitation.guardianName}</p>
                      <p className="text-sm text-muted-foreground">{invitation.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(invitation.status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                      {invitation.status}
                    </Badge>
                    {(invitation.status === 'sent' || invitation.status === 'delivered') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(invitation.id)}
                      >
                        Resend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
