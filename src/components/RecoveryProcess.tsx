import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { RecoveryAttempt, GuardianSignature, Guardian } from '@/protocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface RecoveryProcessProps {
  walletId?: string;
  onNavigate?: (component: string) => void;
}

interface RecoveryStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export default function RecoveryProcess({ walletId, onNavigate }: RecoveryProcessProps) {
  // Use the parameters to avoid unused destructuring warning
  console.log('RecoveryProcess for wallet:', walletId);
  console.log('Navigation function available:', !!onNavigate);
  const { protocolClient, loading, error } = useProtocol();
  const [currentStep, setCurrentStep] = useState(0);
  const [recoveryAttempt, setRecoveryAttempt] = useState<RecoveryAttempt | null>(null);
  const [guardianSignatures, setGuardianSignatures] = useState<GuardianSignature[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecoveredSeed, setShowRecoveredSeed] = useState(false);
  const [recoveredSeed, setRecoveredSeed] = useState<string>('');

  // Recovery form state
  const [recoveryForm, setRecoveryForm] = useState({
    reason: '',
    newOwnerEmail: '',
    description: ''
  });

  // Guardian signature form
  const [signatureForm, setSignatureForm] = useState({
    guardianId: '',
    verificationMethod: 'email',
    verificationCode: '',
    privateKey: ''
  });

  const steps: RecoveryStep[] = [
    {
      id: 'initiate',
      title: 'Initiate Recovery',
      description: 'Start the recovery process and notify guardians',
      completed: false,
      current: currentStep === 0
    },
    {
      id: 'collect-signatures',
      title: 'Collect Guardian Signatures',
      description: 'Wait for required guardian approvals',
      completed: false,
      current: currentStep === 1
    },
    {
      id: 'reconstruct',
      title: 'Reconstruct Seed',
      description: 'Combine guardian shares to recover the master seed',
      completed: false,
      current: currentStep === 2
    },
    {
      id: 'complete',
      title: 'Recovery Complete',
      description: 'Access your recovered wallet',
      completed: false,
      current: currentStep === 3
    }
  ];

  useEffect(() => {
    if (protocolClient && walletId) {
      loadRecoveryData();
    }
  }, [protocolClient, walletId]);

  const loadRecoveryData = async () => {
    if (!protocolClient || !walletId) return;

    try {
      setIsLoading(true);
      
      // Load guardians
      const guardianData = await protocolClient.getWalletGuardians(walletId);
      setGuardians(guardianData as Guardian[]);
      
      // Check for existing recovery attempts
      const recoveryAttempts = await protocolClient.getWalletRecoveryAttempts(walletId);
      if (recoveryAttempts.length > 0) {
        const latestAttempt = recoveryAttempts[0] as RecoveryAttempt;
        setRecoveryAttempt(latestAttempt);
        
        // Load signatures for this attempt
        const signatures = await loadGuardianSignatures(latestAttempt.id);
        setGuardianSignatures(signatures);
        
        // Determine current step
        if (signatures.length >= latestAttempt.requiredSignatures) {
          setCurrentStep(2); // Ready to reconstruct
        } else {
          setCurrentStep(1); // Collecting signatures
        }
      }
    } catch (err) {
      logger.error('Failed to load recovery data', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load recovery data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadGuardianSignatures = async (_recoveryId: string): Promise<GuardianSignature[]> => {
    // This would typically load from the protocol client
    // For now, return mock data
    return [];
  };

  const handleInitiateRecovery = async () => {
    if (!protocolClient || !walletId) return;

    try {
      // Validate form
      if (!recoveryForm.reason || !recoveryForm.newOwnerEmail) {
        toast({
          title: "Validation Error",
          description: "Reason and new owner email are required",
          variant: "destructive",
        });
        return;
      }

      // Initiate recovery
      const recovery = await protocolClient.initiateRecovery(
        walletId,
        'current-user', // guardianId
        recoveryForm.reason,
        recoveryForm.newOwnerEmail
      );

      setRecoveryAttempt(recovery);
      setCurrentStep(1);

      toast({
        title: "Recovery Initiated",
        description: "Guardians have been notified of the recovery request",
      });
    } catch (err) {
      logger.error('Failed to initiate recovery', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to initiate recovery",
        variant: "destructive",
      });
    }
  };

  const handleSignRecovery = async () => {
    if (!protocolClient || !recoveryAttempt) return;

    try {
      // Validate form
      if (!signatureForm.guardianId || !signatureForm.verificationCode) {
        toast({
          title: "Validation Error",
          description: "Guardian and verification code are required",
          variant: "destructive",
        });
        return;
      }

      // Sign recovery
      await protocolClient.signRecoveryAttempt(
        recoveryAttempt.id,
        signatureForm.guardianId,
        signatureForm.privateKey
      );

      // Reload data
      await loadRecoveryData();

      toast({
        title: "Recovery Signed",
        description: "Your signature has been recorded",
      });
    } catch (err) {
      logger.error('Failed to sign recovery', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to sign recovery",
        variant: "destructive",
      });
    }
  };

  const handleReconstructSeed = async () => {
    if (!protocolClient || !recoveryAttempt) return;

    try {
      // Get guardian shares
      const guardianShares = await Promise.all(
        guardianSignatures.map(async (signature) => {
          const share = await protocolClient.getGuardianShare(
            recoveryAttempt.walletId,
            signature.guardianId
          );
          const shareData = share as { shareIndex: number; encryptedShare: string } | null;
          return {
            shareIndex: shareData?.shareIndex || 0,
            shareValue: shareData?.encryptedShare || '',
            guardianPrivateKey: signatureForm.privateKey
          };
        })
      );

      // Reconstruct seed
      const seed = await protocolClient.reconstructSeed(
        recoveryAttempt.walletId,
        guardianShares
      );

      setRecoveredSeed(seed);
      setCurrentStep(3);

      toast({
        title: "Seed Recovered",
        description: "Your master seed has been successfully reconstructed",
      });
    } catch (err) {
      logger.error('Failed to reconstruct seed', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to reconstruct seed",
        variant: "destructive",
      });
    }
  };

  const getProgressPercentage = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };

  const getRequiredSignatures = () => {
    return recoveryAttempt?.requiredSignatures || 0;
  };

  const getCurrentSignatures = () => {
    return guardianSignatures.length;
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading recovery data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Failed to load recovery data: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Shield className="h-6 w-6" />
          Wallet Recovery Process
        </h2>
        <p className="text-muted-foreground mt-2">
          Follow these steps to recover your wallet with guardian assistance
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recovery Progress</span>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.id} className={step.current ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-500 text-white' :
                  step.current ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            {step.current && (
              <CardContent>
                {step.id === 'initiate' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reason">Recovery Reason</Label>
                      <Input
                        id="reason"
                        value={recoveryForm.reason}
                        onChange={(e) => setRecoveryForm({ ...recoveryForm, reason: e.target.value })}
                        placeholder="e.g., Lost access to original device"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newOwnerEmail">New Owner Email</Label>
                      <Input
                        id="newOwnerEmail"
                        type="email"
                        value={recoveryForm.newOwnerEmail}
                        onChange={(e) => setRecoveryForm({ ...recoveryForm, newOwnerEmail: e.target.value })}
                        placeholder="newowner@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Additional Details</Label>
                      <Textarea
                        id="description"
                        value={recoveryForm.description}
                        onChange={(e) => setRecoveryForm({ ...recoveryForm, description: e.target.value })}
                        placeholder="Provide any additional context..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleInitiateRecovery} className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Initiate Recovery
                    </Button>
                  </div>
                )}

                {step.id === 'collect-signatures' && recoveryAttempt && (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Recovery Request Details</h4>
                      <p><strong>Reason:</strong> {recoveryAttempt.reason}</p>
                      <p><strong>New Owner:</strong> {recoveryAttempt.newOwnerEmail}</p>
                      <p><strong>Required Signatures:</strong> {getRequiredSignatures()}</p>
                      <p><strong>Current Signatures:</strong> {getCurrentSignatures()}</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="guardianId">Select Guardian</Label>
                      <select
                        id="guardianId"
                        value={signatureForm.guardianId}
                        onChange={(e) => setSignatureForm({ ...signatureForm, guardianId: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Select a guardian</option>
                        {guardians.map((guardian) => (
                          <option key={guardian.id} value={guardian.id}>
                            {guardian.fullName} ({guardian.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="verificationCode">Verification Code</Label>
                      <Input
                        id="verificationCode"
                        value={signatureForm.verificationCode}
                        onChange={(e) => setSignatureForm({ ...signatureForm, verificationCode: e.target.value })}
                        placeholder="Enter verification code from email/SMS"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="privateKey">Guardian Private Key</Label>
                      <Textarea
                        id="privateKey"
                        value={signatureForm.privateKey}
                        onChange={(e) => setSignatureForm({ ...signatureForm, privateKey: e.target.value })}
                        placeholder="Enter your guardian private key"
                        rows={4}
                      />
                    </div>

                    <Button onClick={handleSignRecovery} className="w-full">
                      <Key className="h-4 w-4 mr-2" />
                      Sign Recovery Request
                    </Button>
                  </div>
                )}

                {step.id === 'reconstruct' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Sufficient signatures collected!
                        </span>
                      </div>
                      <p className="text-green-700 mt-1">
                        You can now reconstruct your master seed using the guardian shares.
                      </p>
                    </div>

                    <Button onClick={handleReconstructSeed} className="w-full">
                      <Key className="h-4 w-4 mr-2" />
                      Reconstruct Master Seed
                    </Button>
                  </div>
                )}

                {step.id === 'complete' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Recovery Complete!
                        </span>
                      </div>
                      <p className="text-green-700 mt-1">
                        Your wallet has been successfully recovered.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Recovered Master Seed</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRecoveredSeed(!showRecoveredSeed)}
                        >
                          {showRecoveredSeed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {showRecoveredSeed && (
                        <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                          {recoveredSeed}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Export Wallet
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Access Wallet
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
