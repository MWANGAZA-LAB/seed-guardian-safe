import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Send,
  Loader2
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface RecoveryInitiationFormProps {
  walletId?: string;
  onSuccess?: (recoveryId: string) => void;
  onCancel?: () => void;
}

interface RecoveryForm {
  reason: string;
  newOwnerEmail: string;
  newOwnerName: string;
  emergencyContact: string;
  notes: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  timeDelay: number; // in hours
  requireAllGuardians: boolean;
}

interface GuardianInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  priority: 'high' | 'medium' | 'low';
  responseTime: number; // in hours
  reliability: number; // 0-100
  status: 'active' | 'inactive' | 'pending';
}

// interface RecoveryStatus {
//   id: string;
//   status: 'initiated' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
//   guardiansNotified: number;
//   guardiansResponded: number;
//   requiredResponses: number;
//   estimatedCompletion: string;
//   createdAt: string;
// }

export default function RecoveryInitiationForm({ 
  walletId, 
  onSuccess, 
  onCancel 
}: RecoveryInitiationFormProps) {
  useProtocol();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [form, setForm] = useState<RecoveryForm>({
    reason: '',
    newOwnerEmail: '',
    newOwnerName: '',
    emergencyContact: '',
    notes: '',
    urgency: 'medium',
    threshold: 3,
    timeDelay: 0,
    requireAllGuardians: false
  });

  const [errors, setErrors] = useState<Partial<RecoveryForm>>({});
  const [guardians, setGuardians] = useState<GuardianInfo[]>([]);

  useEffect(() => {
    loadGuardianData();
  }, [walletId]);

  const loadGuardianData = async () => {
    try {
      // Load guardians from Supabase
      const guardianData = await loadGuardiansFromSupabase();
      setGuardians(guardianData);
      
      // Set default threshold based on available guardians
      if (guardianData.length > 0) {
        const activeGuardians = guardianData.filter(g => g.status === 'active');
        setForm(prev => ({
          ...prev,
          threshold: Math.min(3, Math.max(2, Math.ceil(activeGuardians.length / 2)))
        }));
      }
    } catch (err) {
      logger.error('Failed to load guardian data', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const loadGuardiansFromSupabase = async (): Promise<GuardianInfo[]> => {
    // Mock implementation - would integrate with Supabase
    return [
      {
        id: 'guardian-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        priority: 'high',
        responseTime: 2,
        reliability: 95,
        status: 'active'
      },
      {
        id: 'guardian-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-0124',
        priority: 'high',
        responseTime: 4,
        reliability: 88,
        status: 'active'
      },
      {
        id: 'guardian-3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1-555-0125',
        priority: 'medium',
        responseTime: 24,
        reliability: 72,
        status: 'active'
      },
      {
        id: 'guardian-4',
        name: 'Alice Brown',
        email: 'alice@example.com',
        phone: '+1-555-0126',
        priority: 'low',
        responseTime: 48,
        reliability: 0,
        status: 'pending'
      }
    ];
  };

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
      if (Number(form.threshold) < 2) {
        newErrors.threshold = 'Threshold must be at least 2';
      }
      const activeGuardians = guardians.filter(g => g.status === 'active');
      if (Number(form.threshold) > activeGuardians.length) {
        newErrors.threshold = `Threshold cannot exceed number of active guardians (${activeGuardians.length})`;
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

      // Initiate recovery via Supabase function
      const recoveryId = await initiateRecoveryViaSupabase(form);
      
      toast({
        title: "Recovery Initiated",
        description: "Recovery process has been started. Guardians will be notified.",
      });

      onSuccess?.(recoveryId);
      
    } catch (err) {
      logger.error('Failed to initiate recovery', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to initiate recovery",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateRecoveryViaSupabase = async (_recoveryData: RecoveryForm): Promise<string> => {
    // Mock implementation - would call Supabase function
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `recovery-${Date.now()}`;
  };


  const getGuardianStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="threshold">Recovery Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="2"
                  max={guardians.filter(g => g.status === 'active').length}
                  value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: parseInt(e.target.value) || 2 })}
                  className={errors.threshold ? 'border-red-500' : ''}
                />
                {errors.threshold && <p className="text-sm text-red-500 mt-1">{errors.threshold}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum guardians needed for recovery
                </p>
              </div>

              <div>
                <Label htmlFor="timeDelay">Time Delay (hours)</Label>
                <Input
                  id="timeDelay"
                  type="number"
                  min="0"
                  max="168"
                  value={form.timeDelay}
                  onChange={(e) => setForm({ ...form, timeDelay: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional delay before recovery can proceed
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireAllGuardians"
                checked={form.requireAllGuardians}
                onChange={(e) => setForm({ ...form, requireAllGuardians: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="requireAllGuardians" className="text-sm">
                Require all active guardians to approve
              </Label>
            </div>

            {/* Guardian Status */}
            <div>
              <Label>Guardian Status</Label>
              <div className="mt-2 space-y-2">
                {guardians.map((guardian) => (
                  <div key={guardian.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{guardian.name}</p>
                        <p className="text-sm text-muted-foreground">{guardian.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getGuardianStatusColor(guardian.status) as 'default' | 'secondary' | 'outline'}>
                        {guardian.status}
                      </Badge>
                      <Badge variant="outline">
                        {guardian.reliability}% reliable
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
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
            <Shield className="h-6 w-6" />
            Initiate Recovery
          </h2>
          <p className="text-muted-foreground">
            Step {currentStep} of 2: {currentStep === 1 ? 'Recovery Details' : 'Guardian Configuration'}
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
                  Initiating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Initiate Recovery
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Warning */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Important Security Notice</h4>
              <p className="text-sm text-red-700 mt-1">
                Recovery initiation is a critical security action. This process will:
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• Notify all guardians of the recovery request</li>
                <li>• Require verification from the specified number of guardians</li>
                <li>• Generate audit logs for all recovery activities</li>
                <li>• Potentially transfer wallet ownership to the new owner</li>
              </ul>
              <p className="text-sm text-red-700 mt-2">
                Only initiate recovery if you are certain it is necessary and authorized.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
