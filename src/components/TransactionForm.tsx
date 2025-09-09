import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface TransactionFormProps {
  walletId?: string;
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
}

interface TransactionFormData {
  toAddress: string;
  amount: string;
  fee: string;
  feeRate: string; // sat/vB
  memo: string;
  password: string;
  priority: 'low' | 'medium' | 'high';
  replaceByFee: boolean;
  useCustomFee: boolean;
}

interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

interface FeeEstimate {
  low: number;
  medium: number;
  high: number;
  custom: number;
}

export default function TransactionForm({ 
  walletId, 
  onSuccess, 
  onCancel 
}: TransactionFormProps) {
  useProtocol();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState<TransactionFormData>({
    toAddress: '',
    amount: '',
    fee: '0.00001',
    feeRate: '10',
    memo: '',
    password: '',
    priority: 'medium',
    replaceByFee: false,
    useCustomFee: false
  });

  const [errors, setErrors] = useState<Partial<TransactionFormData>>({});
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    confirmed: 0,
    unconfirmed: 0,
    total: 0
  });
  const [feeEstimates, setFeeEstimates] = useState<FeeEstimate>({
    low: 0.000005,
    medium: 0.00001,
    high: 0.00002,
    custom: 0.00001
  });
  const [addressValid, setAddressValid] = useState<boolean | null>(null);

  useEffect(() => {
    loadWalletData();
  }, [walletId]);

  useEffect(() => {
    if (form.toAddress) {
      validateAddress();
    }
  }, [form.toAddress]);

  const loadWalletData = async () => {
    try {
      // Load wallet balance and fee estimates from Supabase
      const [balance, fees] = await Promise.all([
        loadWalletBalanceFromSupabase(),
        loadFeeEstimatesFromSupabase()
      ]);
      
      setWalletBalance(balance);
      setFeeEstimates(fees);
      
      // Set default fee based on priority
      updateFeeFromPriority();
    } catch (err) {
      logger.error('Failed to load wallet data', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const loadWalletBalanceFromSupabase = async (): Promise<WalletBalance> => {
    // Mock implementation - would integrate with Supabase
    return {
      confirmed: 0.5,
      unconfirmed: 0.001,
      total: 0.501
    };
  };

  const loadFeeEstimatesFromSupabase = async (): Promise<FeeEstimate> => {
    // Mock implementation - would integrate with Supabase
    return {
      low: 0.000005,
      medium: 0.00001,
      high: 0.00002,
      custom: 0.00001
    };
  };

  const validateAddress = async () => {
    // Simple Bitcoin address validation
    const isValid = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(form.toAddress) ||
                   /^bc1[a-z0-9]{39,59}$/.test(form.toAddress) ||
                   /^bc1p[a-z0-9]{58}$/.test(form.toAddress);
    setAddressValid(isValid);
  };

  const updateFeeFromPriority = () => {
    if (!form.useCustomFee) {
      const fee = feeEstimates[form.priority];
      setForm(prev => ({ ...prev, fee: fee.toString() }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<TransactionFormData> = {};

    if (step === 1) {
      if (!form.toAddress.trim()) {
        newErrors.toAddress = 'Recipient address is required';
      } else if (addressValid === false) {
        newErrors.toAddress = 'Please enter a valid Bitcoin address';
      }
      
      if (!form.amount.trim()) {
        newErrors.amount = 'Amount is required';
      } else {
        const amount = parseFloat(form.amount);
        if (isNaN(amount) || amount <= 0) {
          newErrors.amount = 'Please enter a valid amount';
        } else if (amount > walletBalance.confirmed) {
          newErrors.amount = 'Amount exceeds available balance';
        }
      }
      
      if (!form.fee.trim()) {
        newErrors.fee = 'Fee is required';
      } else {
        const fee = parseFloat(form.fee);
        if (isNaN(fee) || fee < 0) {
          newErrors.fee = 'Please enter a valid fee';
        }
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
      setIsSubmitting(true);

      // Create transaction via Supabase function
      const transactionId = await createTransactionViaSupabase(form);
      
      toast({
        title: "Transaction Created",
        description: "Transaction has been created and will be broadcast to the network",
      });

      onSuccess?.(transactionId);
      
    } catch (err) {
      logger.error('Failed to create transaction', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createTransactionViaSupabase = async (_transactionData: TransactionFormData): Promise<string> => {
    // Mock implementation - would call Supabase function
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

  const getRemainingBalance = () => {
    return walletBalance.confirmed - getTotalAmount();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Wallet Balance */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Available Balance</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {walletBalance.confirmed.toFixed(8)} BTC
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadWalletData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {walletBalance.unconfirmed > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    +{walletBalance.unconfirmed.toFixed(8)} BTC unconfirmed
                  </p>
                )}
              </CardContent>
            </Card>

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
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {addressValid === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {addressValid === false && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
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
                <Label htmlFor="priority">Transaction Priority</Label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(e) => {
                    setForm({ ...form, priority: e.target.value as 'low' | 'medium' | 'high' });
                    setTimeout(updateFeeFromPriority, 0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low - Slower, Lower Fee</option>
                  <option value="medium">Medium - Balanced</option>
                  <option value="high">High - Faster, Higher Fee</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCustomFee"
                checked={form.useCustomFee}
                onChange={(e) => setForm({ ...form, useCustomFee: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="useCustomFee" className="text-sm">
                Use custom fee
              </Label>
            </div>

            {form.useCustomFee && (
              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <Label htmlFor="feeRate">Fee Rate (sat/vB)</Label>
                  <Input
                    id="feeRate"
                    type="number"
                    value={form.feeRate}
                    onChange={(e) => setForm({ ...form, feeRate: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>
            )}

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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="replaceByFee"
                checked={form.replaceByFee}
                onChange={(e) => setForm({ ...form, replaceByFee: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="replaceByFee" className="text-sm">
                Enable Replace-by-Fee (RBF)
              </Label>
            </div>

            {/* Transaction Summary */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700">Amount:</span>
                    <span className="font-medium text-green-900">{form.amount || '0'} BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Fee:</span>
                    <span className="font-medium text-green-900">{form.fee} BTC</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium text-green-700">Total:</span>
                    <span className="font-bold text-green-900">{getTotalAmount().toFixed(8)} BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Remaining:</span>
                    <span className="font-medium text-green-900">{getRemainingBalance().toFixed(8)} BTC</span>
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

            {/* Transaction Review */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
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
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
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
                      {form.replaceByFee && <p>Replace-by-Fee: Enabled</p>}
                    </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Send className="h-6 w-6" />
            Send Bitcoin
          </h2>
          <p className="text-muted-foreground">
            Step {currentStep} of 2: {currentStep === 1 ? 'Transaction Details' : 'Confirm & Send'}
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
                  Send Transaction
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
