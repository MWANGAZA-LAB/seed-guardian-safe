import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Settings
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { ClientWallet, Guardian } from '@/protocol';
import { formatCurrency, formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface WalletDashboardProps {
  walletId?: string;
  onNavigate?: (component: string) => void;
}

export default function WalletDashboard({ walletId, onNavigate }: WalletDashboardProps) {
  const { protocolClient, loading, error } = useProtocol();
  const [wallet, setWallet] = useState<ClientWallet | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [showSeed, setShowSeed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (protocolClient && walletId) {
      loadWalletData();
    }
  }, [protocolClient, walletId]);

  const loadWalletData = async () => {
    if (!protocolClient || !walletId) return;

    try {
      setIsLoading(true);
      
      // Load wallet
      const walletData = await protocolClient.loadWallet(walletId, 'current-user');
      if (walletData) {
        setWallet(walletData);
        
        // Load guardians
        const guardianData = await protocolClient.getWalletGuardians(walletId);
        setGuardians(guardianData);
        
        // Load balance (mock for now - would integrate with Bitcoin RPC)
        setBalance(0.00123456); // Mock balance
      }
    } catch (err) {
      logger.error('Failed to load wallet data', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = () => {
    onNavigate?.('CreateWalletModal');
  };

  const handleAddGuardian = () => {
    onNavigate?.('AddGuardianModal');
  };

  const handleViewGuardians = () => {
    onNavigate?.('GuardianManagement');
  };

  const handleViewTransactions = () => {
    onNavigate?.('TransactionHistory');
  };

  const handleViewAuditLogs = () => {
    onNavigate?.('AuditLogs');
  };

  const handleExportBackup = () => {
    onNavigate?.('BackupRestore');
  };

  const getSeedStatus = () => {
    if (!wallet) return { status: 'unknown', color: 'secondary' };
    
    const activeGuardians = guardians.filter(g => g.status === 'active').length;
    const requiredThreshold = wallet.policy.threshold;
    
    if (activeGuardians >= requiredThreshold) {
      return { status: 'secure', color: 'default' };
    } else if (activeGuardians > 0) {
      return { status: 'partial', color: 'destructive' };
    } else {
      return { status: 'insecure', color: 'destructive' };
    }
  };

  const getGuardianStatus = () => {
    const active = guardians.filter(g => g.status === 'active').length;
    const total = guardians.length;
    const required = wallet?.policy.threshold || 0;
    
    return { active, total, required };
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading wallet data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Failed to load wallet: {error.message}</span>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              No Wallet Found
            </CardTitle>
            <CardDescription>
              Create your first Bitcoin inheritance wallet to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateWallet} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const seedStatus = getSeedStatus();
  const guardianStatus = getGuardianStatus();

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {wallet.name}
            </div>
            <Badge variant={seedStatus.color as 'default' | 'secondary' | 'destructive' | 'outline'}>
              {seedStatus.status === 'secure' && <CheckCircle className="h-3 w-3 mr-1" />}
              {seedStatus.status === 'partial' && <Clock className="h-3 w-3 mr-1" />}
              {seedStatus.status === 'insecure' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {seedStatus.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Created {formatDate(wallet.createdAt)} • Last accessed {formatDate(wallet.lastAccessed)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Balance</span>
            <span className="text-2xl font-bold">
              {formatCurrency(balance)} BTC
            </span>
          </div>

          {/* Seed Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Seed Security</span>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm">
                  {guardianStatus.active}/{guardianStatus.total} guardians active
                </span>
              </div>
            </div>
            <Progress 
              value={(guardianStatus.active / guardianStatus.required) * 100} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {guardianStatus.required} guardians required for recovery
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleAddGuardian}>
              <Users className="h-4 w-4 mr-2" />
              Add Guardian
            </Button>
            <Button variant="outline" size="sm" onClick={handleViewGuardians}>
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guardian Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Guardian Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {guardians.map((guardian) => (
              <div key={guardian.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {guardian.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{guardian.fullName}</p>
                    <p className="text-xs text-muted-foreground">{guardian.email}</p>
                  </div>
                </div>
                <Badge variant={guardian.status === 'active' ? 'default' : 'secondary'}>
                  {guardian.status}
                </Badge>
              </div>
            ))}
            
            {guardians.length === 0 && (
              <div className="text-center py-4">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No guardians added yet</p>
                <Button variant="outline" size="sm" onClick={handleAddGuardian} className="mt-2">
                  Add First Guardian
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleViewTransactions}>
              <Wallet className="h-4 w-4 mr-2" />
              Transactions
            </Button>
            <Button variant="outline" onClick={handleViewAuditLogs}>
              <Shield className="h-4 w-4 mr-2" />
              Audit Logs
            </Button>
            <Button variant="outline" onClick={handleExportBackup}>
              <Download className="h-4 w-4 mr-2" />
              Backup
            </Button>
            <Button variant="outline" onClick={() => setShowSeed(!showSeed)}>
              {showSeed ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showSeed ? 'Hide' : 'Show'} Seed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seed Display (when shown) */}
      {showSeed && wallet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Master Seed
            </CardTitle>
            <CardDescription>
              Keep this seed phrase secure and never share it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              {wallet.masterSeed}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ This seed is only shown once. Make sure to back it up securely.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
