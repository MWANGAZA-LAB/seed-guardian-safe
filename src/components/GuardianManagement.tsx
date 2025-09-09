import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Trash2, 
  Download, 
  QrCode, 
  Mail, 
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Copy,
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { Guardian, ClientWallet } from '@/protocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface GuardianManagementProps {
  walletId?: string;
  onNavigate?: (component: string) => void;
}

interface GuardianShare {
  guardianId: string;
  shareIndex: number;
  encryptedShare: string;
  publicKey: string;
}

export default function GuardianManagement({ walletId, onNavigate }: GuardianManagementProps) {
  const { protocolClient, loading, error } = useProtocol();
  const [wallet, setWallet] = useState<ClientWallet | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [guardianShares, setGuardianShares] = useState<GuardianShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const [showEncryptedShare, setShowEncryptedShare] = useState<string | null>(null);

  // Form state for adding guardian
  const [newGuardian, setNewGuardian] = useState({
    email: '',
    fullName: '',
    publicKey: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (protocolClient && walletId) {
      loadGuardianData();
    }
  }, [protocolClient, walletId]);

  const loadGuardianData = async () => {
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
        
        // Load guardian shares
        const shares = await loadGuardianShares(walletId, guardianData);
        setGuardianShares(shares);
      }
    } catch (err) {
      logger.error('Failed to load guardian data', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load guardian data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadGuardianShares = async (walletId: string, guardians: Guardian[]): Promise<GuardianShare[]> => {
    const shares: GuardianShare[] = [];
    
    for (const guardian of guardians) {
      try {
        const share = await protocolClient?.getGuardianShare(walletId, guardian.id);
        if (share) {
          shares.push({
            guardianId: guardian.id,
            shareIndex: share.shareIndex,
            encryptedShare: share.encryptedShare,
            publicKey: guardian.publicKey || ''
          });
        }
      } catch (err) {
        logger.error(`Failed to load share for guardian ${guardian.id}`, err instanceof Error ? err : new Error(String(err)));
      }
    }
    
    return shares;
  };

  const handleAddGuardian = async () => {
    if (!protocolClient || !walletId) return;

    try {
      // Validate form
      if (!newGuardian.email || !newGuardian.fullName) {
        toast({
          title: "Validation Error",
          description: "Email and full name are required",
          variant: "destructive",
        });
        return;
      }

      // Add guardian
      await protocolClient.addGuardian(walletId, {
        email: newGuardian.email,
        fullName: newGuardian.fullName,
        publicKey: newGuardian.publicKey,
        phoneNumber: newGuardian.phoneNumber
      });

      // Reset form and reload data
      setNewGuardian({ email: '', fullName: '', publicKey: '', phoneNumber: '' });
      setShowAddDialog(false);
      await loadGuardianData();

      toast({
        title: "Success",
        description: "Guardian added successfully",
      });
    } catch (err) {
      logger.error('Failed to add guardian', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to add guardian",
        variant: "destructive",
      });
    }
  };

  const handleRemoveGuardian = async (guardianId: string) => {
    if (!protocolClient || !walletId) return;

    try {
      await protocolClient.removeGuardian(walletId, guardianId);
      await loadGuardianData();

      toast({
        title: "Success",
        description: "Guardian removed successfully",
      });
    } catch (err) {
      logger.error('Failed to remove guardian', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to remove guardian",
        variant: "destructive",
      });
    }
  };

  const handleExportShare = (guardian: Guardian) => {
    const share = guardianShares.find(s => s.guardianId === guardian.id);
    if (!share) return;

    setSelectedGuardian(guardian);
    setShowEncryptedShare(share.encryptedShare);
    setShowShareDialog(true);
  };

  const handleCopyShare = () => {
    if (showEncryptedShare) {
      navigator.clipboard.writeText(showEncryptedShare);
      toast({
        title: "Copied",
        description: "Encrypted share copied to clipboard",
      });
    }
  };

  const handleDownloadShare = () => {
    if (!selectedGuardian || !showEncryptedShare) return;

    const data = {
      guardianId: selectedGuardian.id,
      guardianName: selectedGuardian.fullName,
      guardianEmail: selectedGuardian.email,
      shareIndex: guardianShares.find(s => s.guardianId === selectedGuardian.id)?.shareIndex,
      encryptedShare: showEncryptedShare,
      publicKey: selectedGuardian.publicKey,
      timestamp: new Date().toISOString(),
      walletId: walletId
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guardian-share-${selectedGuardian.fullName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Guardian share file downloaded",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'inactive':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading guardians...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Failed to load guardians: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Guardian Management
          </h2>
          <p className="text-muted-foreground">
            Manage your trusted guardians and their encrypted shares
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Guardian
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Guardian</DialogTitle>
              <DialogDescription>
                Add a trusted person who can help recover your wallet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={newGuardian.fullName}
                  onChange={(e) => setNewGuardian({ ...newGuardian, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newGuardian.email}
                  onChange={(e) => setNewGuardian({ ...newGuardian, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  value={newGuardian.phoneNumber}
                  onChange={(e) => setNewGuardian({ ...newGuardian, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="publicKey">PGP Public Key (Optional)</Label>
                <Textarea
                  id="publicKey"
                  value={newGuardian.publicKey}
                  onChange={(e) => setNewGuardian({ ...newGuardian, publicKey: e.target.value })}
                  placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGuardian}>
                Add Guardian
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Guardian List */}
      <div className="grid gap-4">
        {guardians.map((guardian) => (
          <Card key={guardian.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-medium">
                      {guardian.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{guardian.fullName}</CardTitle>
                    <CardDescription>{guardian.email}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(guardian.status)}
                  <Badge variant={guardian.status === 'active' ? 'default' : 'secondary'}>
                    {guardian.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guardian.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{guardian.phoneNumber}</span>
                  </div>
                )}
                
                {guardian.publicKey && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">PGP Key Available</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportShare(guardian)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportShare(guardian)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveGuardian(guardian.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {guardians.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Guardians Added</h3>
              <p className="text-muted-foreground mb-4">
                Add trusted guardians to help secure your wallet
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Guardian
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Guardian Share</DialogTitle>
            <DialogDescription>
              Share this encrypted data with {selectedGuardian?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGuardian && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Guardian Information</span>
                  <Badge variant="outline">{selectedGuardian.status}</Badge>
                </div>
                <p className="text-sm"><strong>Name:</strong> {selectedGuardian.fullName}</p>
                <p className="text-sm"><strong>Email:</strong> {selectedGuardian.email}</p>
                <p className="text-sm"><strong>Share Index:</strong> {guardianShares.find(s => s.guardianId === selectedGuardian.id)?.shareIndex}</p>
              </div>

              <div className="space-y-2">
                <Label>Encrypted Share</Label>
                <div className="relative">
                  <Textarea
                    value={showEncryptedShare || ''}
                    readOnly
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleCopyShare}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Important Security Notice</p>
                    <p className="text-yellow-700 mt-1">
                      This encrypted share contains sensitive data. Only share it with the intended guardian
                      through a secure channel. The guardian should store this data securely and offline.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadShare}>
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
