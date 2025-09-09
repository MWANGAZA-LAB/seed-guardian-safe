import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Wallet, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (walletId: string) => void;
}

interface WalletForm {
  name: string;
  description: string;
  threshold: number;
  totalGuardians: number;
  password: string;
  confirmPassword: string;
  recoveryEmail: string;
  recoveryPhone: string;
}

export default function CreateWalletModal({ isOpen, onClose, onSuccess }: CreateWalletModalProps) {
  useProtocol();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [form, setForm] = useState<WalletForm>({
    name: '',
    description: '',
    threshold: 3,
    totalGuardians: 5,
    password: '',
    confirmPassword: '',
    recoveryEmail: '',
    recoveryPhone: ''
  });

  const [errors, setErrors] = useState<Partial<WalletForm>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<WalletForm> = {};

    if (step === 1) {
      if (!form.name.trim()) {
        newErrors.name = 'Wallet name is required';
      }
      if (form.threshold < 2) {
        newErrors.threshold = 'Threshold must be at least 2';
      }
      if (form.totalGuardians < form.threshold) {
        newErrors.totalGuardians = 'Total guardians must be at least the threshold';
      }
      if (form.totalGuardians > 10) {
        newErrors.totalGuardians = 'Maximum 10 guardians allowed';
      }
    }

    if (step === 2) {
      if (!form.password) {
        newErrors.password = 'Password is required';
      } else if (form.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (!form.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 3) {
      if (!form.recoveryEmail) {
        newErrors.recoveryEmail = 'Recovery email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recoveryEmail)) {
        newErrors.recoveryEmail = 'Please enter a valid email address';
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
      setIsLoading(true);

      // Create wallet using protocol client
      const walletData = {
        name: form.name,
        description: form.description,
        threshold: Number(form.threshold),
        totalGuardians: Number(form.totalGuardians),
        recoveryEmail: form.recoveryEmail,
        recoveryPhone: form.recoveryPhone
      };

      // Mock wallet creation - would use protocol client
      const walletId = await createWallet(walletData, form.password);
      
      toast({
        title: "Wallet Created",
        description: "Your inheritance wallet has been created successfully",
      });

      onSuccess?.(walletId);
      handleClose();
    } catch (err) {
      logger.error('Failed to create wallet', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to create wallet",
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
      description: '',
      threshold: 3,
      totalGuardians: 5,
      password: '',
      confirmPassword: '',
      recoveryEmail: '',
      recoveryPhone: ''
    });
    setErrors({});
    onClose();
  };

  const createWallet = async (_walletData: Record<string, unknown>, _password: string): Promise<string> => {
    // Mock implementation - would use protocol client
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `wallet-${Date.now()}`;
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

  const passwordStrength = getPasswordStrength(form.password);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="walletName">Wallet Name</Label>
              <Input
                id="walletName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter wallet name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                <Label htmlFor="totalGuardians">Total Guardians</Label>
                <Input
                  id="totalGuardians"
                  type="number"
                  min="2"
                  max="10"
                  value={form.totalGuardians}
                  onChange={(e) => setForm({ ...form, totalGuardians: parseInt(e.target.value) || 2 })}
                  className={errors.totalGuardians ? 'border-red-500' : ''}
                />
                {errors.totalGuardians && <p className="text-sm text-red-500 mt-1">{errors.totalGuardians}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Total number of guardians
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Security Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your wallet will be secured using Shamir's Secret Sharing. 
                    The master seed will be split into {form.totalGuardians} shares, 
                    and you'll need {form.threshold} guardians to recover access.
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
              <Label htmlFor="password">Master Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              
              {form.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Password Strength</span>
                    <span className="text-xs font-medium">{passwordStrength.label}</span>
                  </div>
                  <Progress value={passwordStrength.score} className="h-2" />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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

            <div className="bg-yellow-50 p-4 rounded-lg">
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
            </div>
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
                value={form.recoveryEmail}
                onChange={(e) => setForm({ ...form, recoveryEmail: e.target.value })}
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
                value={form.recoveryPhone}
                onChange={(e) => setForm({ ...form, recoveryPhone: e.target.value })}
                placeholder="Enter recovery phone number"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Additional recovery method via SMS
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Ready to Create</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your wallet will be created with the following settings:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Name: {form.name}</li>
                    <li>• Threshold: {form.threshold} of {form.totalGuardians} guardians</li>
                    <li>• Recovery email: {form.recoveryEmail}</li>
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
            <Wallet className="h-5 w-5" />
            Create Inheritance Wallet
          </DialogTitle>
          <DialogDescription>
            Step {currentStep} of 3: {currentStep === 1 ? 'Basic Information' : 
                                   currentStep === 2 ? 'Security Setup' : 'Recovery Information'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round((currentStep / 3) * 100)}%</span>
            </div>
            <Progress value={(currentStep / 3) * 100} className="h-2" />
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
