import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Settings, Shield, Users, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import WalletDashboard from '@/components/WalletDashboard';
import { useWalletData } from '@/hooks/useWalletData';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const { wallets, isLoading, getWalletStats } = useWalletData();
  const stats = getWalletStats();

  const handleCreateWallet = () => {
    navigate('/create-wallet');
  };

  const handleWalletSelect = (walletId: string) => {
    setActiveWallet(walletId);
    toast({
      title: "Wallet Selected",
      description: `Now viewing wallet ${walletId}`,
      variant: "default",
    });
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold">Wallet Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSettings}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={handleCreateWallet}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {activeWallet ? (
          <WalletDashboard walletId={activeWallet} />
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-6">
                <Shield className="w-4 h-4 text-bitcoin" />
                <span className="text-sm font-medium text-muted-foreground">Secure Bitcoin Management</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Welcome to Your Bitcoin Inheritance Platform
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Manage your Bitcoin wallets with military-grade security and social recovery protection.
              </p>
            </div>

            {/* Statistics */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <Card className="bg-gradient-card border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                      <p className="text-2xl font-bold">{(stats.totalBalance / 100000000).toFixed(4)} BTC</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-bitcoin" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Wallets</p>
                      <p className="text-2xl font-bold">{stats.activeWallets}</p>
                    </div>
                    <Wallet className="h-8 w-8 text-bitcoin" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Guardians</p>
                      <p className="text-2xl font-bold">{stats.totalGuardians}</p>
                    </div>
                    <Users className="h-8 w-8 text-bitcoin" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Recoveries</p>
                      <p className="text-2xl font-bold">{stats.pendingRecoveries}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-gradient-card border-primary/10 hover:border-primary/20 transition-smooth cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Wallet className="w-12 h-12 text-bitcoin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Create New Wallet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Set up a new Bitcoin inheritance wallet with social recovery
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleCreateWallet}>
                    Create Wallet
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-primary/10 hover:border-primary/20 transition-smooth cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-bitcoin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Manage Guardians</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Add, remove, or update your trusted guardian network
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-primary/10 hover:border-primary/20 transition-smooth cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-bitcoin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Security Settings</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Configure security preferences and recovery options
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleSettings}>
                    Open Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Wallet List */}
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Your Wallets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading wallets...</p>
                  </div>
                ) : wallets.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      You don't have any wallets yet. Create your first wallet to get started.
                    </p>
                    <Button
                      variant="hero"
                      onClick={handleCreateWallet}
                      className="px-8"
                    >
                      Create Your First Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wallets.map((wallet) => (
                      <div
                        key={wallet.id}
                        className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/20 transition-colors cursor-pointer"
                        onClick={() => handleWalletSelect(wallet.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-bitcoin/10 rounded-full flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-bitcoin" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{wallet.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {(wallet.balance / 100000000).toFixed(4)} BTC
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={wallet.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {wallet.status}
                          </Badge>
                          {wallet.recoveryRequests.length > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {wallet.recoveryRequests.length} Recovery
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
