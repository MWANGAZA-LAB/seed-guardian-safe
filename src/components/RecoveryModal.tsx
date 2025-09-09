import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (recoveryId: string) => void;
  walletId?: string;
}

interface RecoveryForm {
  reason: string;
  newOwnerEmail: string;
  newOwnerName: string;
  emergencyContact: string;
  notes: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export default function RecoveryModal({ isOpen, onClose, onSuccess }: RecoveryModalProps) {
  useProtocol();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [form, setForm] = useState<RecoveryForm>({
    reason: '',
    newOwnerEmail: '',
    newOwnerName: '',
    emergencyContact: '',
    notes: '',
    urgency: 'medium'
  });

  const [errors, setErrors] = useState<Partial<RecoveryForm>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<RecoveryForm> = {};

    if (step === 1) {
      if (!form.reason.trim()) {
        newErrors.reason = 'Recovery reason is required';
      }
      if (!form.newOwnerEmail.trim()) {
        newErrors.newOwnerEmail = 'New owner email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.newOwnerEmail)) {
        newErrors.newOwnerEmail = 'Please enter a valid email address';
      }
      if (!form.newOwnerName.trim()) {
        newErrors.newOwnerName = 'New owner name is required';
      }
    }

    if (step === 2) {
      if (!form.emergencyContact.trim()) {
        newErrors.emergencyContact = 'Emergency contact is required';
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
      setIsLoading(true);

      // Initiate recovery using protocol client
      const recoveryData = {
        reason: form.reason,
        newOwnerEmail: form.newOwnerEmail,
        newOwnerName: form.newOwnerName,
        emergencyContact: form.emergencyContact,
        notes: form.notes,
        urgency: form.urgency
      };

      // Mock recovery initiation - would use protocol client
      const recoveryId = await initiateRecovery(recoveryData);
      
      toast({
        title: "Recovery Initiated",
        description: "Recovery process has been started. Guardians will be notified.",
      });

      onSuccess?.(recoveryId);
      handleClose();
    } catch (err) {
      logger.error('Failed to initiate recovery', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to initiate recovery",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setForm({
      reason: '',
      newOwnerEmail: '',
      newOwnerName: '',
      emergencyContact: '',
      notes: '',
      urgency: 'medium'
    });
    setErrors({});
    onClose();
  };

  const initiateRecovery = async (_recoveryData: Record<string, unknown>): Promise<string> => {
    // Mock implementation - would use protocol client
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `recovery-${Date.now()}`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Recovery Reason</Label>
              <select
                id="reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason</option>
                <option value="owner_unavailable">Owner is unavailable</option>
                <option value="owner_deceased">Owner has passed away</option>
                <option value="owner_incapacitated">Owner is incapacitated</option>
                <option value="emergency_access">Emergency access needed</option>
                <option value="wallet_lost">Wallet access lost</option>
                <option value="other">Other</option>
              </select>
              {errors.reason && <p className="text-sm text-red-500 mt-1">{errors.reason}</p>}
            </div>

            <div>
              <Label htmlFor="newOwnerEmail">New Owner Email</Label>
              <Input
                id="newOwnerEmail"
                type="email"
                value={form.newOwnerEmail}
                onChange={(e) => setForm({ ...form, newOwnerEmail: e.target.value })}
                placeholder="Enter new owner's email address"
                className={errors.newOwnerEmail ? 'border-red-500' : ''}
              />
              {errors.newOwnerEmail && <p className="text-sm text-red-500 mt-1">{errors.newOwnerEmail}</p>}
            </div>

            <div>
              <Label htmlFor="newOwnerName">New Owner Name</Label>
              <Input
                id="newOwnerName"
                value={form.newOwnerName}
                onChange={(e) => setForm({ ...form, newOwnerName: e.target.value })}
                placeholder="Enter new owner's full name"
                className={errors.newOwnerName ? 'border-red-500' : ''}
              />
              {errors.newOwnerName && <p className="text-sm text-red-500 mt-1">{errors.newOwnerName}</p>}
            </div>

            <div>
              <Label htmlFor="urgency">Urgency Level</Label>
              <select
                id="urgency"
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low - Can wait</option>
                <option value="medium">Medium - Within 24 hours</option>
                <option value="high">High - Within 4 hours</option>
                <option value="critical">Critical - Immediate</option>
              </select>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Recovery Process</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This will initiate a recovery process that requires approval from 
                    your guardians. The new owner will receive access to the wallet 
                    once the required number of guardians approve.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                placeholder="Enter emergency contact information"
                className={errors.emergencyContact ? 'border-red-500' : ''}
              />
              {errors.emergencyContact && <p className="text-sm text-red-500 mt-1">{errors.emergencyContact}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Phone number or email for emergency contact
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional information for guardians"
                rows={4}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Guardian Notification</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your guardians will be notified via email and SMS (if configured) 
                    about this recovery request. They will need to verify their identity 
                    and approve the recovery.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Recovery Summary</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Recovery will be initiated with the following details:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Reason: {form.reason}</li>
                    <li>• New Owner: {form.newOwnerName} ({form.newOwnerEmail})</li>
                    <li>• Urgency: <span className={getUrgencyColor(form.urgency)}>{form.urgency}</span></li>
                    <li>• Emergency Contact: {form.emergencyContact}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Initiate Recovery
          </DialogTitle>
          <DialogDescription>
            Step {currentStep} of 2: {currentStep === 1 ? 'Recovery Details' : 'Contact Information'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Step Content */}
          {renderStep()}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {currentStep < 2 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  'Initiate Recovery'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
