import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wallet, 
  Shield, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface WalletCreationFormProps {
  onSubmit?: (walletData: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface WalletFormData {
  name: string;
  description: string;
  threshold: number;
  totalGuardians: number;
  password: string;
  confirmPassword: string;
  recoveryEmail: string;
  recoveryPhone: string;
  termsAccepted: boolean;
}

export default function WalletCreationForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: WalletCreationFormProps) {
  useProtocol();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<WalletFormData>({
    name: '',
    description: '',
    threshold: 3,
    totalGuardians: 5,
    password: '',
    confirmPassword: '',
    recoveryEmail: '',
    recoveryPhone: '',
    termsAccepted: false
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WalletFormData, string>>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof WalletFormData, string>> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Wallet name is required';
      }
      if (formData.threshold < 2) {
        newErrors.threshold = 'Threshold must be at least 2';
      }
      if (formData.totalGuardians < formData.threshold) {
        newErrors.totalGuardians = 'Total guardians must be at least the threshold';
      }
      if (formData.totalGuardians > 10) {
        newErrors.totalGuardians = 'Maximum 10 guardians allowed';
      }
    }

    if (step === 2) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 3) {
      if (!formData.recoveryEmail) {
        newErrors.recoveryEmail = 'Recovery email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recoveryEmail)) {
        newErrors.recoveryEmail = 'Please enter a valid email address';
      }
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = 'You must accept the terms and conditions';
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
    if (!validateStep(3)) {
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(formData as unknown as Record<string, unknown>);
      } else {
        // Default submission logic
        await createWallet(formData);
      }
    } catch (err) {
      logger.error('Failed to create wallet', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to create wallet",
        variant: "destructive",
      });
    }
  };

  const createWallet = async (_data: WalletFormData): Promise<void> => {
    // Mock implementation - would use protocol client
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 2) return { score: 20, label: 'Weak', color: 'bg-red-500' };
    if (score < 4) return { score: 60, label: 'Medium', color: 'bg-yellow-500' };
    return { score: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="walletName">Wallet Name</Label>
              <Input
                id="walletName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter wallet name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this wallet's purpose"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="threshold">Recovery Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="2"
                  max="10"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 2 })}
                  className={errors.threshold ? 'border-red-500' : ''}
                />
                {errors.threshold && <p className="text-sm text-red-500 mt-1">{errors.threshold}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum guardians needed for recovery
                </p>
              </div>

              <div>
                <Label htmlFor="totalGuardians">Total Guardians</Label>
                <Input
                  id="totalGuardians"
                  type="number"
                  min="2"
                  max="10"
                  value={formData.totalGuardians}
                  onChange={(e) => setFormData({ ...formData, totalGuardians: parseInt(e.target.value) || 2 })}
                  className={errors.totalGuardians ? 'border-red-500' : ''}
                />
                {errors.totalGuardians && <p className="text-sm text-red-500 mt-1">{errors.totalGuardians}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Total number of guardians
                </p>
              </div>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Security Information</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your wallet will be secured using Shamir's Secret Sharing. 
                      The master seed will be split into {formData.totalGuardians} shares, 
                      and you'll need {formData.threshold} guardians to recover access.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Master Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter master password"
                  className={errors.password ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
              
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Password Strength</span>
                    <span className="text-xs font-medium">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm master password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Important</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This password will be used to encrypt your wallet data. 
                      Make sure to store it securely - it cannot be recovered if lost.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="recoveryEmail">Recovery Email</Label>
              <Input
                id="recoveryEmail"
                type="email"
                value={formData.recoveryEmail}
                onChange={(e) => setFormData({ ...formData, recoveryEmail: e.target.value })}
                placeholder="Enter recovery email address"
                className={errors.recoveryEmail ? 'border-red-500' : ''}
              />
              {errors.recoveryEmail && <p className="text-sm text-red-500 mt-1">{errors.recoveryEmail}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Used for recovery notifications and verification
              </p>
            </div>

            <div>
              <Label htmlFor="recoveryPhone">Recovery Phone (Optional)</Label>
              <Input
                id="recoveryPhone"
                type="tel"
                value={formData.recoveryPhone}
                onChange={(e) => setFormData({ ...formData, recoveryPhone: e.target.value })}
                placeholder="Enter recovery phone number"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Additional recovery method via SMS
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="termsAccepted"
                checked={formData.termsAccepted}
                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="termsAccepted" className="text-sm">
                I accept the{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </Label>
            </div>
            {errors.termsAccepted && <p className="text-sm text-red-500">{errors.termsAccepted}</p>}

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Ready to Create</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Your wallet will be created with the following settings:
                    </p>
                    <ul className="text-sm text-green-700 mt-2 space-y-1">
                      <li>• Name: {formData.name}</li>
                      <li>• Threshold: {formData.threshold} of {formData.totalGuardians} guardians</li>
                      <li>• Recovery email: {formData.recoveryEmail}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Wallet className="h-6 w-6" />
          Create Inheritance Wallet
        </h2>
        <p className="text-muted-foreground mt-2">
          Step {currentStep} of 3: {currentStep === 1 ? 'Basic Information' : 
                                   currentStep === 2 ? 'Security Setup' : 'Recovery Information'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round((currentStep / 3) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
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
          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Wallet'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
