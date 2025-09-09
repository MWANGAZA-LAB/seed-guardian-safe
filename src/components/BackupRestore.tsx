import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Download, 
  Upload, 
  Shield, 
  FileText, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Archive,
  HardDrive
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface BackupRestoreProps {
  walletId?: string;
  onNavigate?: (component: string) => void;
}

interface BackupFile {
  id: string;
  name: string;
  type: 'full' | 'wallet' | 'guardians' | 'audit';
  size: number;
  createdAt: string;
  encrypted: boolean;
  checksum: string;
  description: string;
}

interface RestoreProgress {
  step: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message: string;
}

export default function BackupRestore({ walletId }: BackupRestoreProps) {
  const { loading, error } = useProtocol();
  const [isLoading, setIsLoading] = useState(true);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null);
  
  // Backup form
  const [backupForm, setBackupForm] = useState({
    name: '',
    description: '',
    includeGuardians: true,
    includeAuditLogs: true,
    password: '',
    confirmPassword: ''
  });
  
  // Restore form
  const [restoreForm, setRestoreForm] = useState({
    file: null as File | null,
    password: '',
    verifyChecksum: true
  });
  
  // State
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRestorePassword, setShowRestorePassword] = useState(false);

  useEffect(() => {
    loadBackupFiles();
  }, []);

  const loadBackupFiles = async () => {
    try {
      setIsLoading(true);
      
      // Load backup files from localStorage or protocol client
      const files = await loadStoredBackups();
      setBackupFiles(files);
    } catch (err) {
      logger.error('Failed to load backup files', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load backup files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoredBackups = async (): Promise<BackupFile[]> => {
    // Mock data - would typically load from protocol client or localStorage
    return [
      {
        id: 'backup-1',
        name: 'Full Wallet Backup',
        type: 'full',
        size: 2048576, // 2MB
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        encrypted: true,
        checksum: 'a1b2c3d4e5f6789012345678901234567890abcdef',
        description: 'Complete wallet backup including all guardians and audit logs'
      },
      {
        id: 'backup-2',
        name: 'Guardians Only',
        type: 'guardians',
        size: 512000, // 512KB
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        encrypted: true,
        checksum: 'b2c3d4e5f6789012345678901234567890abcdef12',
        description: 'Guardian information and encrypted shares only'
      },
      {
        id: 'backup-3',
        name: 'Audit Logs',
        type: 'audit',
        size: 1024000, // 1MB
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        encrypted: false,
        checksum: 'c3d4e5f6789012345678901234567890abcdef1234',
        description: 'Complete audit log history for verification'
      }
    ];
  };

  const handleCreateBackup = async () => {
    try {
      // Validate form
      if (!backupForm.name || !backupForm.password || !backupForm.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Name and password are required",
          variant: "destructive",
        });
        return;
      }

      if (backupForm.password !== backupForm.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }

      if (backupForm.password.length < 8) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 8 characters long",
          variant: "destructive",
        });
        return;
      }

      // Create backup
      const backupData = await createBackupData();
      const encryptedBackup = await encryptBackup(backupData, backupForm.password);
      const checksum = await calculateChecksum(encryptedBackup);
      
      const backupFile: BackupFile = {
        id: `backup-${Date.now()}`,
        name: backupForm.name,
        type: 'full',
        size: encryptedBackup.length,
        createdAt: new Date().toISOString(),
        encrypted: true,
        checksum,
        description: backupForm.description
      };

      // Save backup
      await saveBackup(backupFile, encryptedBackup);
      
      // Reset form
      setBackupForm({
        name: '',
        description: '',
        includeGuardians: true,
        includeAuditLogs: true,
        password: '',
        confirmPassword: ''
      });
      setShowPasswordDialog(false);
      
      // Reload backup files
      await loadBackupFiles();
      
      toast({
        title: "Backup Created",
        description: "Your wallet backup has been created successfully",
      });
    } catch (err) {
      logger.error('Failed to create backup', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreForm.file) {
      toast({
        title: "Validation Error",
        description: "Please select a backup file",
        variant: "destructive",
      });
      return;
    }

    try {
      setRestoreProgress({
        step: 'Reading file',
        progress: 10,
        status: 'in-progress',
        message: 'Reading backup file...'
      });

      // Read file
      const fileContent = await readFile(restoreForm.file);
      
      setRestoreProgress({
        step: 'Verifying checksum',
        progress: 30,
        status: 'in-progress',
        message: 'Verifying file integrity...'
      });

      // Verify checksum if enabled
      if (restoreForm.verifyChecksum) {
        await calculateChecksum(fileContent);
        // Would verify against stored checksum
      }

      setRestoreProgress({
        step: 'Decrypting',
        progress: 50,
        status: 'in-progress',
        message: 'Decrypting backup data...'
      });

      // Decrypt backup
      const decryptedData = await decryptBackup(fileContent, restoreForm.password);
      
      setRestoreProgress({
        step: 'Validating',
        progress: 70,
        status: 'in-progress',
        message: 'Validating backup data...'
      });

      // Validate backup data
      await validateBackupData(decryptedData);
      
      setRestoreProgress({
        step: 'Restoring',
        progress: 90,
        status: 'in-progress',
        message: 'Restoring wallet data...'
      });

      // Restore wallet
      await restoreWalletData(decryptedData);
      
      setRestoreProgress({
        step: 'Complete',
        progress: 100,
        status: 'completed',
        message: 'Backup restored successfully!'
      });

      // Reset form
      setRestoreForm({
        file: null,
        password: '',
        verifyChecksum: true
      });
      setShowRestoreDialog(false);
      
      toast({
        title: "Backup Restored",
        description: "Your wallet has been restored from backup",
      });
    } catch (err) {
      setRestoreProgress({
        step: 'Error',
        progress: 0,
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
      
      logger.error('Failed to restore backup', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to restore backup",
        variant: "destructive",
      });
    }
  };

  const handleDownloadBackup = async (backup: BackupFile) => {
    try {
      // Load backup data
      const backupData = await loadBackupData(backup.id);
      
      // Create download
      const blob = new Blob([backupData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.name}.backup`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: "Backup file downloaded successfully",
      });
    } catch (err) {
      logger.error('Failed to download backup', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to download backup",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await deleteBackup(backupId);
      await loadBackupFiles();
      
      toast({
        title: "Deleted",
        description: "Backup file deleted successfully",
      });
    } catch (err) {
      logger.error('Failed to delete backup', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to delete backup",
        variant: "destructive",
      });
    }
  };

  // Mock implementation functions
  const createBackupData = async (): Promise<string> => {
    // Mock backup data
    return JSON.stringify({
      walletId,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        wallet: { /* wallet data */ },
        guardians: { /* guardian data */ },
        auditLogs: { /* audit logs */ }
      }
    });
  };

  const encryptBackup = async (data: string, _password: string): Promise<string> => {
    // Mock encryption - would use AES-GCM
    return btoa(data); // Base64 encode for demo
  };

  const decryptBackup = async (encryptedData: string, _password: string): Promise<string> => {
    // Mock decryption - would use AES-GCM
    return atob(encryptedData); // Base64 decode for demo
  };

  const calculateChecksum = async (data: string): Promise<string> => {
    // Mock checksum calculation - would use SHA-256
    return 'mock-checksum-' + data.length;
  };

  const saveBackup = async (backup: BackupFile, data: string): Promise<void> => {
    // Mock save - would save to localStorage or protocol client
    localStorage.setItem(`backup-${backup.id}`, data);
  };

  const loadBackupData = async (backupId: string): Promise<string> => {
    // Mock load - would load from localStorage or protocol client
    return localStorage.getItem(`backup-${backupId}`) || '';
  };

  const deleteBackup = async (backupId: string): Promise<void> => {
    // Mock delete - would delete from localStorage or protocol client
    localStorage.removeItem(`backup-${backupId}`);
  };

  const readFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const validateBackupData = async (data: string): Promise<void> => {
    // Mock validation - would validate backup structure
    const parsed = JSON.parse(data);
    if (!parsed.walletId || !parsed.timestamp) {
      throw new Error('Invalid backup file format');
    }
  };

  const restoreWalletData = async (_data: string): Promise<void> => {
    // Mock restore - would restore wallet data
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <Archive className="h-5 w-5" />;
      case 'wallet':
        return <Shield className="h-5 w-5" />;
      case 'guardians':
        return <Key className="h-5 w-5" />;
      case 'audit':
        return <FileText className="h-5 w-5" />;
      default:
        return <HardDrive className="h-5 w-5" />;
    }
  };

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'full':
        return 'default';
      case 'wallet':
        return 'secondary';
      case 'guardians':
        return 'outline';
      case 'audit':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading backup files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Failed to load backup files: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="h-6 w-6" />
            Backup & Restore
          </h2>
          <p className="text-muted-foreground">
            Create encrypted backups and restore your wallet data
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Backup</DialogTitle>
                <DialogDescription>
                  Create an encrypted backup of your wallet data
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backupName">Backup Name</Label>
                  <Input
                    id="backupName"
                    value={backupForm.name}
                    onChange={(e) => setBackupForm({ ...backupForm, name: e.target.value })}
                    placeholder="Enter backup name"
                  />
                </div>
                <div>
                  <Label htmlFor="backupDescription">Description</Label>
                  <Textarea
                    id="backupDescription"
                    value={backupForm.description}
                    onChange={(e) => setBackupForm({ ...backupForm, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Include in Backup</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeGuardians"
                        checked={backupForm.includeGuardians}
                        onChange={(e) => setBackupForm({ ...backupForm, includeGuardians: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="includeGuardians">Guardian Information</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeAuditLogs"
                        checked={backupForm.includeAuditLogs}
                        onChange={(e) => setBackupForm({ ...backupForm, includeAuditLogs: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="includeAuditLogs">Audit Logs</Label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="backupPassword">Encryption Password</Label>
                  <div className="relative">
                    <Input
                      id="backupPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={backupForm.password}
                      onChange={(e) => setBackupForm({ ...backupForm, password: e.target.value })}
                      placeholder="Enter encryption password"
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
                </div>
                <div>
                  <Label htmlFor="confirmBackupPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmBackupPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={backupForm.confirmPassword}
                      onChange={(e) => setBackupForm({ ...backupForm, confirmPassword: e.target.value })}
                      placeholder="Confirm encryption password"
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
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBackup}>
                  Create Backup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Restore Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restore from Backup</DialogTitle>
                <DialogDescription>
                  Restore your wallet from an encrypted backup file
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backupFile">Backup File</Label>
                  <Input
                    id="backupFile"
                    type="file"
                    accept=".backup"
                    onChange={(e) => setRestoreForm({ ...restoreForm, file: e.target.files?.[0] || null })}
                  />
                </div>
                <div>
                  <Label htmlFor="restorePassword">Decryption Password</Label>
                  <div className="relative">
                    <Input
                      id="restorePassword"
                      type={showRestorePassword ? 'text' : 'password'}
                      value={restoreForm.password}
                      onChange={(e) => setRestoreForm({ ...restoreForm, password: e.target.value })}
                      placeholder="Enter decryption password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowRestorePassword(!showRestorePassword)}
                    >
                      {showRestorePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="verifyChecksum"
                    checked={restoreForm.verifyChecksum}
                    onChange={(e) => setRestoreForm({ ...restoreForm, verifyChecksum: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="verifyChecksum">Verify file integrity</Label>
                </div>
                
                {restoreProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{restoreProgress.step}</span>
                      <span className="text-sm text-muted-foreground">{restoreProgress.progress}%</span>
                    </div>
                    <Progress value={restoreProgress.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">{restoreProgress.message}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRestoreBackup} disabled={!restoreForm.file || !restoreForm.password}>
                  Restore Backup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Backup Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Files</CardTitle>
          <CardDescription>
            Manage your encrypted wallet backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupFiles.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Backups Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first backup to secure your wallet data
              </p>
              <Button onClick={() => setShowPasswordDialog(true)}>
                <Download className="h-4 w-4 mr-2" />
                Create First Backup
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {backupFiles.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getBackupTypeIcon(backup.type)}
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {backup.description} • {formatFileSize(backup.size)} • 
                        Created {new Date(backup.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getBackupTypeColor(backup.type) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                      {backup.type}
                    </Badge>
                    {backup.encrypted && (
                      <Badge variant="outline">
                        <Shield className="h-3 w-3 mr-1" />
                        Encrypted
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadBackup(backup)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBackup(backup.id)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
