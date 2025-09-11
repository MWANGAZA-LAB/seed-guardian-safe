/**
 * Proof of Life Manager Component
 * 
 * This component provides the main UI for managing Proof of Life
 * enrollment, monitoring, and status.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Activity
} from 'lucide-react';
import { PoLManager, PoLManagerConfig, PoLManagerCallbacks } from '@/protocol/pol/manager';
import { PoLStatus, PoLProof, PoLError, PoLEnrollment, RecoveryTrigger } from '@/protocol/pol/types';
import { createClientStorage } from '@/protocol/pol/storage';
import { DEFAULT_POL_CONFIG, DEFAULT_HEARTBEAT_CONFIG, DEFAULT_VERIFICATION_CONFIG, DEFAULT_WEBAUTHN_CONFIG } from '@/protocol/pol/manager';

interface ProofOfLifeManagerProps {
  walletId: string;
  onStatusChange?: (status: PoLStatus) => void;
  onError?: (error: PoLError) => void;
}

export const ProofOfLifeManager: React.FC<ProofOfLifeManagerProps> = ({
  walletId,
  onStatusChange,
  onError,
}) => {
  const [manager, setManager] = useState<PoLManager | null>(null);
  const [status, setStatus] = useState<PoLStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastProof, setLastProof] = useState<PoLProof | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize PoL Manager
  useEffect(() => {
    const initializeManager = async () => {
      try {
        setIsLoading(true);
        
        const storage = createClientStorage();
        await storage.initialize();

        const config: PoLManagerConfig = {
          walletId,
          storage,
          serverAPI: createMockServerAPI(),
          webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
          polConfig: DEFAULT_POL_CONFIG,
          heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
          verificationConfig: DEFAULT_VERIFICATION_CONFIG,
        };

        const callbacks: PoLManagerCallbacks = {
          onCheckIn: (proof) => {
            setLastProof(proof);
            console.log('Proof of Life check-in successful:', proof);
          },
          onMissed: (walletId, missedCount) => {
            console.warn('Proof of Life missed:', { walletId, missedCount });
          },
          onEscalated: (walletId, escalationLevel) => {
            console.warn('Proof of Life escalated:', { walletId, escalationLevel });
          },
          onRecoveryTriggered: (walletId, reason) => {
            console.error('Recovery triggered:', { walletId, reason });
          },
          onError: (error) => {
            setError(error.message);
            if (onError) {
              onError(error);
            }
          },
          onStatusChange: (newStatus) => {
            setStatus(newStatus);
            if (onStatusChange) {
              onStatusChange(newStatus);
            }
          },
        };

        const polManager = new PoLManager(config, callbacks);
        await polManager.initialize();
        
        setManager(polManager);
        setIsEnrolled(true);
        
        // Get initial status
        const initialStatus = await polManager.getStatus();
        setStatus(initialStatus);
        
        // Get last proof
        const proofs = await polManager.getProofHistory(1);
        if (proofs.length > 0) {
          setLastProof(proofs[0]);
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Proof of Life';
        setError(errorMessage);
        if (onError) {
          onError(new PoLError(errorMessage, 'INITIALIZATION_FAILED'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeManager();
  }, [walletId, onStatusChange, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (manager) {
        manager.destroy();
      }
    };
  }, [manager]);

  const handleEnroll = useCallback(async () => {
    if (!manager) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await manager.enroll(
        `User ${walletId.slice(0, 8)}`,
        'Seed Guardian Safe User',
        true
      );
      
      setIsEnrolled(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Enrollment failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [manager, walletId]);

  const handleStartMonitoring = useCallback(async () => {
    if (!manager) return;

    try {
      await manager.startMonitoring();
      setIsMonitoring(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start monitoring';
      setError(errorMessage);
    }
  }, [manager]);

  const handleStopMonitoring = useCallback(() => {
    if (!manager) return;

    manager.stopMonitoring();
    setIsMonitoring(false);
  }, [manager]);

  const handleManualCheckIn = useCallback(async () => {
    if (!manager) return;

    try {
      setIsLoading(true);
      const proof = await manager.performCheckIn('manual');
      setLastProof(proof);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Manual check-in failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [manager]);

  const getStatusIcon = () => {
    if (!status) return <Clock className="h-5 w-5" />;
    
    switch (status.status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'missed':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'escalated':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'recovery_triggered':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = () => {
    if (!status) return 'secondary';
    
    switch (status.status) {
      case 'active':
        return 'default';
      case 'missed':
        return 'secondary';
      case 'escalated':
        return 'destructive';
      case 'recovery_triggered':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTimeUntilNextCheckIn = () => {
    if (!status) return 0;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, status.nextCheckIn - now);
  };

  if (isLoading && !manager) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Initializing Proof of Life...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Proof of Life Status
          </CardTitle>
          <CardDescription>
            Monitor your wallet's Proof of Life status and manage check-ins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-medium">Status:</span>
                  <Badge variant={getStatusColor() as any}>
                    {status.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Escalation Level: {status.escalationLevel}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Last Check-in:</span>
                  <div className="font-medium">
                    {lastProof ? formatTimestamp(lastProof.timestamp) : 'Never'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Missed Count:</span>
                  <div className="font-medium">{status.missedCount}</div>
                </div>
              </div>

              {status.status === 'active' && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Time until next check-in</span>
                    <span>{Math.floor(getTimeUntilNextCheckIn() / 3600)}h {Math.floor((getTimeUntilNextCheckIn() % 3600) / 60)}m</span>
                  </div>
                  <Progress 
                    value={(1 - getTimeUntilNextCheckIn() / (7 * 24 * 3600)) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {!isEnrolled ? (
              <Button onClick={handleEnroll} disabled={isLoading}>
                <Shield className="h-4 w-4 mr-2" />
                Enroll in Proof of Life
              </Button>
            ) : (
              <>
                {!isMonitoring ? (
                  <Button onClick={handleStartMonitoring} variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Start Monitoring
                  </Button>
                ) : (
                  <Button onClick={handleStopMonitoring} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Monitoring
                  </Button>
                )}
                
                <Button onClick={handleManualCheckIn} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Manual Check-in
                </Button>
                
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {lastProof && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Last Proof Type:</span>
                <Badge variant="outline">{lastProof.proofType}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Timestamp:</span>
                <span>{formatTimestamp(lastProof.timestamp)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Challenge:</span>
                <span className="font-mono text-xs">{lastProof.challenge.slice(0, 16)}...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Mock server API implementation
function createMockServerAPI() {
  return {
    submitProof: async (proof: PoLProof) => {
      console.log('Submitting proof:', proof);
      return { success: true, message: 'Proof submitted successfully' };
    },
    getStatus: async (walletId: string) => {
      return {
        walletId,
        lastProofTimestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        status: 'active' as const,
        nextCheckIn: Math.floor(Date.now() / 1000) + (7 * 24 * 3600), // 7 days from now
        missedCount: 0,
        escalationLevel: 0,
        guardianNotifications: [],
      };
    },
    getProofs: async (_walletId: string, _limit: number = 10) => {
      return [];
    },
    enrollWallet: async (enrollment: PoLEnrollment) => {
      console.log('Enrolling wallet:', enrollment);
      return { success: true, message: 'Wallet enrolled successfully' };
    },
    revokeEnrollment: async (walletId: string) => {
      console.log('Revoking enrollment for wallet:', walletId);
      return { success: true, message: 'Enrollment revoked successfully' };
    },
    triggerRecovery: async (trigger: RecoveryTrigger) => {
      console.log('Triggering recovery:', trigger);
      return { success: true, message: 'Recovery triggered successfully' };
    },
    verifyProof: async (proof: PoLProof) => {
      return {
        isValid: true,
        errors: [],
        proof,
        verificationDetails: {
          signatureValid: true,
          timestampValid: true,
          challengeValid: true,
          publicKeyValid: true,
        },
      };
    },
  };
}
