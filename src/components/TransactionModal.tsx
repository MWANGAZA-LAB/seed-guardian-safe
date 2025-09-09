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
  Send, 
  Wallet, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (transactionId: string) => void;
  walletId?: string;
}

interface TransactionForm {
  toAddress: string;
  amount: string;
  fee: string;
  memo: string;
  password: string;
  priority: 'low' | 'medium' | 'high';
}

export default function TransactionModal({ isOpen, onClose, onSuccess }: TransactionModalProps) {
  useProtocol();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState<TransactionForm>({
    toAddress: '',
    amount: '',
    fee: '0.00001',
    memo: '',
    password: '',
    priority: 'medium'
  });

  const [errors, setErrors] = useState<Partial<TransactionForm>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<TransactionForm> = {};

    if (step === 1) {
      if (!form.toAddress.trim()) {
        newErrors.toAddress = 'Recipient address is required';
      } else if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(form.toAddress)) {
        newErrors.toAddress = 'Please enter a valid Bitcoin address';
      }
      if (!form.amount.trim()) {
        newErrors.amount = 'Amount is required';
      } else if (isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      }
      if (!form.fee.trim()) {
        newErrors.fee = 'Fee is required';
      } else if (isNaN(parseFloat(form.fee)) || parseFloat(form.fee) < 0) {
        newErrors.fee = 'Please enter a valid fee';
      }
    }

    if (step === 2) {
      if (!form.password.trim()) {
        newErrors.password = 'Password is required';
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

      // Create transaction using protocol client
      const transactionData = {
        toAddress: form.toAddress,
        amount: parseFloat(form.amount),
        fee: parseFloat(form.fee),
        memo: form.memo,
        priority: form.priority
      };

      // Mock transaction creation - would use protocol client
      const transactionId = await createTransaction(transactionData, form.password);
      
      toast({
        title: "Transaction Created",
        description: "Transaction has been created and will be broadcast to the network",
      });

      onSuccess?.(transactionId);
      handleClose();
    } catch (err) {
      logger.error('Failed to create transaction', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setForm({
      toAddress: '',
      amount: '',
      fee: '0.00001',
      memo: '',
      password: '',
      priority: 'medium'
    });
    setErrors({});
    onClose();
  };

  const createTransaction = async (_transactionData: Record<string, unknown>, _password: string): Promise<string> => {
    // Mock implementation - would use protocol client
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `tx-${Date.now()}`;
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(form.toAddress);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const getTotalAmount = () => {
    const amount = parseFloat(form.amount) || 0;
    const fee = parseFloat(form.fee) || 0;
    return amount + fee;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="toAddress">Recipient Address</Label>
              <div className="relative">
                <Input
                  id="toAddress"
                  value={form.toAddress}
                  onChange={(e) => setForm({ ...form, toAddress: e.target.value })}
                  placeholder="Enter Bitcoin address"
                  className={errors.toAddress ? 'border-red-500' : ''}
                />
                {form.toAddress && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={handleCopyAddress}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.toAddress && <p className="text-sm text-red-500 mt-1">{errors.toAddress}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (BTC)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00000000"
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
              </div>

              <div>
                <Label htmlFor="fee">Fee (BTC)</Label>
                <Input
                  id="fee"
                  type="number"
                  step="0.00000001"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: e.target.value })}
                  placeholder="0.00000000"
                  className={errors.fee ? 'border-red-500' : ''}
                />
                {errors.fee && <p className="text-sm text-red-500 mt-1">{errors.fee}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Transaction Priority</Label>
              <select
                id="priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low - Slower, Lower Fee</option>
                <option value="medium">Medium - Balanced</option>
                <option value="high">High - Faster, Higher Fee</option>
              </select>
            </div>

            <div>
              <Label htmlFor="memo">Memo (Optional)</Label>
              <Textarea
                id="memo"
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="Add a note to this transaction"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Transaction Summary</h4>
                  <div className="text-sm text-blue-700 mt-1 space-y-1">
                    <p>Amount: {form.amount || '0'} BTC</p>
                    <p>Fee: {form.fee || '0'} BTC</p>
                    <p className="font-medium">Total: {getTotalAmount().toFixed(8)} BTC</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Wallet Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter wallet password"
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
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Transaction Review</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please review your transaction details carefully. Once confirmed, 
                    the transaction will be broadcast to the Bitcoin network and cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Transaction Details</h4>
                  <div className="text-sm text-green-700 mt-1 space-y-1">
                    <p>To: {form.toAddress}</p>
                    <p>Amount: {form.amount} BTC</p>
                    <p>Fee: {form.fee} BTC</p>
                    <p>Total: {getTotalAmount().toFixed(8)} BTC</p>
                    <p>Priority: {form.priority}</p>
                    {form.memo && <p>Memo: {form.memo}</p>}
                  </div>
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
            <Send className="h-5 w-5" />
            Send Bitcoin
          </DialogTitle>
          <DialogDescription>
            Step {currentStep} of 2: {currentStep === 1 ? 'Transaction Details' : 'Confirm & Send'}
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
                    Sending...
                  </>
                ) : (
                  'Send Transaction'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
