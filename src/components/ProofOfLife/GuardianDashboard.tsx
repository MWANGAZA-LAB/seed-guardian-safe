/**
 * Guardian Dashboard Component
 * 
 * This component provides the UI for guardians to monitor
 * Proof of Life status and manage recovery processes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  FileText,
  Settings
} from 'lucide-react';
import { PoLStatus, GuardianNotification, RecoveryTrigger, PoLProof } from '@/protocol/pol/types';

interface GuardianDashboardProps {
  guardianId: string;
  walletId: string;
  onStatusChange?: (status: PoLStatus) => void;
  onRecoveryTriggered?: (trigger: RecoveryTrigger) => void;
}

export const GuardianDashboard: React.FC<GuardianDashboardProps> = ({
  guardianId,
  walletId,
  onStatusChange,
  onRecoveryTriggered,
}) => {
  const [status, setStatus] = useState<PoLStatus | null>(null);
  const [notifications, setNotifications] = useState<GuardianNotification[]>([]);
  const [recoveryTriggers, setRecoveryTriggers] = useState<RecoveryTrigger[]>([]);
  const [recentProofs, setRecentProofs] = useState<PoLProof[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, [walletId, guardianId]);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load status
      const statusData = await loadWalletStatus();
      setStatus(statusData);

      // Load notifications
      const notificationsData = await loadNotifications();
      setNotifications(notificationsData);

      // Load recovery triggers
      const triggersData = await loadRecoveryTriggers();
      setRecoveryTriggers(triggersData);

      // Load recent proofs
      const proofsData = await loadRecentProofs();
      setRecentProofs(proofsData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [walletId, guardianId]);

  const loadWalletStatus = async (): Promise<PoLStatus> => {
    // Mock implementation - replace with real API call
    return {
      walletId,
      lastProofTimestamp: Math.floor(Date.now() / 1000) - 3600,
      status: 'active',
      nextCheckIn: Math.floor(Date.now() / 1000) + (7 * 24 * 3600),
      missedCount: 0,
      escalationLevel: 0,
      guardianNotifications: [],
    };
  };

  const loadNotifications = async (): Promise<GuardianNotification[]> => {
    // Mock implementation - replace with real API call
    return [
      {
        id: 'notif_1',
        guardianId,
        notificationType: 'pol_missed',
        timestamp: Math.floor(Date.now() / 1000) - 1800,
        message: 'Proof of Life missed for wallet. Missed count: 1',
        acknowledged: false,
      },
    ];
  };

  const loadRecoveryTriggers = async (): Promise<RecoveryTrigger[]> => {
    // Mock implementation - replace with real API call
    return [];
  };

  const loadRecentProofs = async (): Promise<PoLProof[]> => {
    // Mock implementation - replace with real API call
    return [];
  };

  const handleAcknowledgeNotification = useCallback(async (notificationId: string) => {
    try {
      // Mock implementation - replace with real API call
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, acknowledged: true, acknowledgedAt: Math.floor(Date.now() / 1000) }
            : notif
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge notification';
      setError(errorMessage);
    }
  }, []);

  const handleSignRecovery = useCallback(async (triggerId: string) => {
    try {
      // Mock implementation - replace with real API call
      console.log('Signing recovery for trigger:', triggerId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign recovery';
      setError(errorMessage);
    }
  }, []);

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pol_missed':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pol_escalated':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'recovery_triggered':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading Guardian Dashboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Guardian Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor Proof of Life status for wallet {walletId.slice(0, 8)}...
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="proofs">Proof History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Proof of Life Status
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                        {status.lastProofTimestamp > 0 
                          ? formatTimestamp(status.lastProofTimestamp) 
                          : 'Never'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Missed Count:</span>
                      <div className="font-medium">{status.missedCount}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next Check-in:</span>
                      <div className="font-medium">
                        {formatTimestamp(status.nextCheckIn)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Guardian ID:</span>
                      <div className="font-medium font-mono text-xs">
                        {guardianId.slice(0, 16)}...
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{notifications.length}</div>
                    <div className="text-sm text-muted-foreground">Notifications</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{recentProofs.length}</div>
                    <div className="text-sm text-muted-foreground">Recent Proofs</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{recoveryTriggers.length}</div>
                    <div className="text-sm text-muted-foreground">Recovery Triggers</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guardian Notifications</CardTitle>
              <CardDescription>
                Manage notifications and alerts for this wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.acknowledged 
                          ? 'bg-muted/50 border-muted' 
                          : 'bg-background border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.notificationType)}
                          <div className="flex-1">
                            <div className="font-medium">
                              {notification.notificationType.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              {formatTimestamp(notification.timestamp)}
                            </div>
                          </div>
                        </div>
                        {!notification.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledgeNotification(notification.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Tab */}
        <TabsContent value="recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Management</CardTitle>
              <CardDescription>
                Manage recovery triggers and sign recovery requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recoveryTriggers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active recovery triggers
                </div>
              ) : (
                <div className="space-y-3">
                  {recoveryTriggers.map((trigger) => (
                    <div key={trigger.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            Recovery Trigger - {trigger.reason.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Triggered: {formatTimestamp(trigger.triggeredAt)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Signatures: {trigger.receivedSignatures}/{trigger.requiredSignatures}
                          </div>
                          <div className="mt-2">
                            <Badge variant={trigger.status === 'pending' ? 'secondary' : 'default'}>
                              {trigger.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        {trigger.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleSignRecovery(trigger.id)}
                          >
                            Sign Recovery
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proof History Tab */}
        <TabsContent value="proofs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proof History</CardTitle>
              <CardDescription>
                View recent Proof of Life submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProofs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No proof history available
                </div>
              ) : (
                <div className="space-y-3">
                  {recentProofs.map((proof) => (
                    <div key={proof.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            {proof.proofType.toUpperCase()} Proof
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Timestamp: {formatTimestamp(proof.timestamp)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Challenge: {proof.challenge.slice(0, 16)}...
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
