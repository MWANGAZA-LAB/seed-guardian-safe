import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PhoneNumberInput from './PhoneNumberInput';
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
  AlertTriangle,
  CheckCircle,
  Loader2,
  UserPlus
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface AddGuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (guardianId: string) => void;
  walletId?: string;
}

interface GuardianForm {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  notes: string;
  verificationMethod: 'email' | 'sms' | 'both';
  priority: 'high' | 'medium' | 'low';
}

export default function AddGuardianModal({ isOpen, onClose, onSuccess }: AddGuardianModalProps) {
  useProtocol();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [form, setForm] = useState<GuardianForm>({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    notes: '',
    verificationMethod: 'email',
    priority: 'medium'
  });

  const [errors, setErrors] = useState<Partial<GuardianForm>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<GuardianForm> = {};

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
      setIsLoading(true);

      // Add guardian using protocol client
      const guardianData = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        relationship: form.relationship,
        notes: form.notes,
        verificationMethod: form.verificationMethod,
        priority: form.priority
      };

      // Mock guardian addition - would use protocol client
      const guardianId = await addGuardian(guardianData);
      
      toast({
        title: "Guardian Added",
        description: `${form.name} has been added as a guardian`,
      });

      onSuccess?.(guardianId);
      handleClose();
    } catch (err) {
      logger.error('Failed to add guardian', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to add guardian",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setForm({
      name: '',
      email: '',
      phone: '',
      relationship: '',
      notes: '',
      verificationMethod: 'email',
      priority: 'medium'
    });
    setErrors({});
    onClose();
  };

  const addGuardian = async (_guardianData: Record<string, unknown>): Promise<string> => {
    // Mock implementation - would use protocol client
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `guardian-${Date.now()}`;
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
                placeholder="Enter guardian's email"
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

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Guardian Role</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This person will receive an encrypted share of your wallet and 
                    can help with recovery if needed. They will be notified when 
                    recovery is initiated.
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
              <PhoneNumberInput
                value={form.phone}
                onChange={(phone) => setForm({ ...form, phone })}
                label="Phone Number"
                placeholder="Enter guardian's phone number"
                error={errors.phone}
                required={form.verificationMethod === 'sms' || form.verificationMethod === 'both'}
                showCountrySelector={true}
                defaultCountryCode="+1"
              />
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

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Important</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Make sure the guardian's contact information is correct and up-to-date. 
                    They will need to verify their identity during recovery.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Ready to Add</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Guardian will be added with the following settings:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Name: {form.name}</li>
                    <li>• Email: {form.email}</li>
                    <li>• Verification: {form.verificationMethod}</li>
                    <li>• Priority: {form.priority}</li>
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
            <UserPlus className="h-5 w-5" />
            Add Guardian
          </DialogTitle>
          <DialogDescription>
            Step {currentStep} of 2: {currentStep === 1 ? 'Guardian Information' : 'Verification Setup'}
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
                    Adding...
                  </>
                ) : (
                  'Add Guardian'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
