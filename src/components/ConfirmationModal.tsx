import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  Trash2,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  requiresPassword?: boolean;
  requiresConfirmation?: boolean;
  confirmationText?: string;
  icon?: React.ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  type = 'warning',
  requiresPassword = false,
  requiresConfirmation = false,
  confirmationText = '',
  icon
}: ConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmation?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { password?: string; confirmation?: string } = {};

    if (requiresPassword && !password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (requiresConfirmation && confirmation !== confirmationText) {
      newErrors.confirmation = 'Confirmation text does not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await onConfirm();
      handleClose();
    } catch (err) {
      logger.error('Confirmation action failed', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Action failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmation('');
    setErrors({});
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="h-6 w-6 text-red-600" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          buttonVariant: 'destructive' as const
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-900',
          buttonVariant: 'default' as const
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-900',
          buttonVariant: 'default' as const
        };
      case 'info':
      default:
        return {
          icon: <Shield className="h-6 w-6 text-blue-600" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          buttonVariant: 'default' as const
        };
    }
  };

  const styles = getTypeStyles();
  const displayIcon = icon || styles.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {displayIcon}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning/Info Box */}
          <div className={`p-4 rounded-lg border ${styles.bgColor} ${styles.borderColor}`}>
            <div className="flex items-start gap-3">
              {displayIcon}
              <div>
                <h4 className={`font-medium ${styles.textColor}`}>
                  {type === 'danger' && 'This action cannot be undone'}
                  {type === 'warning' && 'Please confirm this action'}
                  {type === 'success' && 'Action completed successfully'}
                  {type === 'info' && 'Additional information'}
                </h4>
                <p className={`text-sm ${styles.textColor} mt-1`}>
                  {type === 'danger' && 'This action is permanent and cannot be reversed.'}
                  {type === 'warning' && 'Please make sure you understand the consequences.'}
                  {type === 'success' && 'The action has been completed successfully.'}
                  {type === 'info' && 'Please review the details before proceeding.'}
                </p>
              </div>
            </div>
          </div>

          {/* Password Input */}
          {requiresPassword && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>
          )}

          {/* Confirmation Text Input */}
          {requiresConfirmation && (
            <div>
              <Label htmlFor="confirmation">
                Type "{confirmationText}" to confirm
              </Label>
              <Input
                id="confirmation"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={`Type "${confirmationText}" here`}
                className={errors.confirmation ? 'border-red-500' : ''}
              />
              {errors.confirmation && <p className="text-sm text-red-500 mt-1">{errors.confirmation}</p>}
            </div>
          )}

          {/* Additional Info for specific types */}
          {type === 'danger' && (
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Warning:</p>
                  <p>This action will permanently delete the selected item(s) and cannot be undone.</p>
                </div>
              </div>
            </div>
          )}

          {type === 'warning' && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Please review:</p>
                  <p>Make sure you understand the consequences of this action before proceeding.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            variant={styles.buttonVariant} 
            onClick={handleConfirm} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
