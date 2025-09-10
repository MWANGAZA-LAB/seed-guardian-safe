import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Shield, 
  Key, 
  Smartphone, 
  Fingerprint, 
  Eye, 
  EyeOff,
  CheckCircle, 
  AlertTriangle, 
  Clock,
  RefreshCw,
  Trash2,
  Plus,
  QrCode
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface SecuritySettingsProps {
  walletId?: string;
  onNavigate?: (component: string) => void;
}

interface TwoFactorMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'hardware';
  name: string;
  enabled: boolean;
  lastUsed?: string;
  backupCodes?: string[];
}

interface DeviceFingerprint {
  id: string;
  name: string;
  type: 'browser' | 'mobile' | 'desktop';
  lastSeen: string;
  trusted: boolean;
  location?: string;
  userAgent: string;
}

interface SecurityAudit {
  id: string;
  event: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
}

export default function SecuritySettings({ walletId, onNavigate }: SecuritySettingsProps) {
  useProtocol();
  
  // Use the parameters to avoid unused destructuring warning
  console.log('SecuritySettings for wallet:', walletId);
  console.log('Navigation function available:', !!onNavigate);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 2FA setup form
  const [twoFactorForm, setTwoFactorForm] = useState({
    method: 'totp' as 'totp' | 'sms' | 'email',
    phoneNumber: '',
    email: '',
    secret: '',
    qrCode: ''
  });
  
  // State
  const [twoFactorMethods, setTwoFactorMethods] = useState<TwoFactorMethod[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<DeviceFingerprint[]>([]);
  const [securityAudits, setSecurityAudits] = useState<SecurityAudit[]>([]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      
      // Load 2FA methods
      const methods = await loadTwoFactorMethods();
      setTwoFactorMethods(methods);
      
      // Load trusted devices
      const devices = await loadTrustedDevices();
      setTrustedDevices(devices);
      
      // Load security audits
      const audits = await loadSecurityAudits();
      setSecurityAudits(audits);
    } catch (err) {
      logger.error('Failed to load security data', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load security settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTwoFactorMethods = async (): Promise<TwoFactorMethod[]> => {
    // Mock data - would typically load from protocol client
    return [
      {
        id: 'totp-1',
        type: 'totp',
        name: 'Authenticator App',
        enabled: true,
        lastUsed: new Date(Date.now() - 86400000).toISOString(),
        backupCodes: ['123456', '789012', '345678', '901234', '567890']
      },
      {
        id: 'sms-1',
        type: 'sms',
        name: 'SMS (+1 *** *** 1234)',
        enabled: false,
        lastUsed: new Date(Date.now() - 172800000).toISOString()
      }
    ];
  };

  const loadTrustedDevices = async (): Promise<DeviceFingerprint[]> => {
    // Mock data - would typically load from protocol client
    return [
      {
        id: 'device-1',
        name: 'Chrome on Windows',
        type: 'browser',
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
        trusted: true,
        location: 'New York, NY',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: 'device-2',
        name: 'iPhone 14 Pro',
        type: 'mobile',
        lastSeen: new Date(Date.now() - 7200000).toISOString(),
        trusted: true,
        location: 'San Francisco, CA',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
      }
    ];
  };

  const loadSecurityAudits = async (): Promise<SecurityAudit[]> => {
    // Mock data - would typically load from protocol client
    return [
      {
        id: 'audit-1',
        event: 'password_changed',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        severity: 'high',
        description: 'Password was successfully changed',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'New York, NY'
      },
      {
        id: 'audit-2',
        event: '2fa_enabled',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        severity: 'medium',
        description: 'Two-factor authentication was enabled',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'New York, NY'
      },
      {
        id: 'audit-3',
        event: 'login_attempt',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        severity: 'low',
        description: 'Successful login from trusted device',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'New York, NY'
      }
    ];
  };

  const handlePasswordChange = async () => {
    try {
      // Validate form
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "All password fields are required",
          variant: "destructive",
        });
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "New passwords do not match",
          variant: "destructive",
        });
        return;
      }

      if (passwordForm.newPassword.length < 8) {
        toast({
          title: "Validation Error",
          description: "New password must be at least 8 characters long",
          variant: "destructive",
        });
        return;
      }

      // Change password (mock implementation)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordDialog(false);
      
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated",
      });
    } catch (err) {
      logger.error('Failed to change password', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    }
  };

  const handleEnable2FA = async () => {
    try {
      // Generate TOTP secret and QR code
      const secret = generateTOTPSecret();
      const qrCode = generateQRCode(secret);
      
      setTwoFactorForm({
        ...twoFactorForm,
        secret,
        qrCode
      });
      
      setShow2FADialog(true);
    } catch (err) {
      logger.error('Failed to enable 2FA', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to enable two-factor authentication",
        variant: "destructive",
      });
    }
  };

  const handleDisable2FA = async (methodId: string) => {
    try {
      // Disable 2FA method
      setTwoFactorMethods(prev => 
        prev.map(method => 
          method.id === methodId 
            ? { ...method, enabled: false }
            : method
        )
      );
      
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      });
    } catch (err) {
      logger.error('Failed to disable 2FA', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to disable two-factor authentication",
        variant: "destructive",
      });
    }
  };

  const handleTrustDevice = async (deviceId: string) => {
    try {
      setTrustedDevices(prev => 
        prev.map(device => 
          device.id === deviceId 
            ? { ...device, trusted: true }
            : device
        )
      );
      
      toast({
        title: "Device Trusted",
        description: "Device has been marked as trusted",
      });
    } catch (err) {
      logger.error('Failed to trust device', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to trust device",
        variant: "destructive",
      });
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      setTrustedDevices(prev => prev.filter(device => device.id !== deviceId));
      
      toast({
        title: "Device Revoked",
        description: "Device access has been revoked",
      });
    } catch (err) {
      logger.error('Failed to revoke device', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to revoke device",
        variant: "destructive",
      });
    }
  };

  const generateTOTPSecret = (): string => {
    // Generate a random 32-character base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const generateQRCode = (secret: string): string => {
    // Generate QR code URL for TOTP setup
    const issuer = 'Seed Guardian Safe';
    const account = 'user@example.com';
    return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading security settings...</span>
      </div>
    );
  }

  // Error handling would go here if we had error state
  // if (error) {
  //   return (
  //     <div className="flex items-center justify-center p-8">
  //       <AlertTriangle className="h-8 w-8 text-destructive" />
  //       <span className="ml-2">Failed to load security settings: {error.message}</span>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your account security and authentication methods
          </p>
        </div>
      </div>

      {/* Password Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Security
          </CardTitle>
          <CardDescription>
            Change your password and manage password policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Last changed 30 days ago
              </p>
            </div>
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Progress value={(passwordForm.newPassword.length / 12) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Password strength: {passwordForm.newPassword.length < 8 ? 'Weak' : 
                         passwordForm.newPassword.length < 12 ? 'Medium' : 'Strong'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
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
                  <Button onClick={handlePasswordChange}>
                    Change Password
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {method.type === 'totp' && <Smartphone className="h-5 w-5" />}
                {method.type === 'sms' && <Smartphone className="h-5 w-5" />}
                {method.type === 'email' && <Smartphone className="h-5 w-5" />}
                {method.type === 'hardware' && <Fingerprint className="h-5 w-5" />}
                <div>
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {method.enabled ? 'Enabled' : 'Disabled'} • 
                    Last used: {method.lastUsed ? new Date(method.lastUsed).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={method.enabled ? 'default' : 'secondary'}>
                  {method.enabled ? 'Active' : 'Inactive'}
                </Badge>
                {method.enabled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisable2FA(method.id)}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnable2FA}
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add 2FA Method
          </Button>
        </CardContent>
      </Card>

      {/* Trusted Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Trusted Devices
          </CardTitle>
          <CardDescription>
            Manage devices that can access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trustedDevices.map((device) => (
            <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {device.type === 'browser' && <Smartphone className="h-5 w-5" />}
                  {device.type === 'mobile' && <Smartphone className="h-5 w-5" />}
                  {device.type === 'desktop' && <Smartphone className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {device.location} • Last seen: {new Date(device.lastSeen).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={device.trusted ? 'default' : 'secondary'}>
                  {device.trusted ? 'Trusted' : 'Untrusted'}
                </Badge>
                {!device.trusted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTrustDevice(device.id)}
                  >
                    Trust
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRevokeDevice(device.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit Log
          </CardTitle>
          <CardDescription>
            Recent security events and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityAudits.map((audit) => (
              <div key={audit.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {getSeverityIcon(audit.severity)}
                <div className="flex-1">
                  <p className="font-medium">{audit.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(audit.timestamp).toLocaleString()} • {audit.location}
                  </p>
                </div>
                <Badge variant={getSeverityColor(audit.severity) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                  {audit.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Scan this QR code with your authenticator app
              </p>
            </div>
            
            <div>
              <Label>Secret Key</Label>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                {twoFactorForm.secret}
              </div>
            </div>
            
            <div>
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                placeholder="Enter 6-digit code from your app"
                maxLength={6}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShow2FADialog(false)}>
              Complete Setup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
