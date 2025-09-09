import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface SettingsPanelProps {
  walletId?: string;
  onNavigate?: (component: string) => void;
}

interface UserSettings {
  // User preferences
  username: string;
  email: string;
  avatar: string;
  
  // Notification settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  recoveryAlerts: boolean;
  transactionAlerts: boolean;
  
  // Security settings
  guardianThreshold: number;
  sessionTimeout: number;
  requirePasswordForTransactions: boolean;
  enableBiometricAuth: boolean;
  
  // Appearance settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  
  // Network settings
  network: 'mainnet' | 'testnet' | 'regtest';
  customRpcUrl: string;
  feeRate: number;
}

export default function SettingsPanel({ walletId, onNavigate }: SettingsPanelProps) {
  const { loading, error } = useProtocol();
  const [settings, setSettings] = useState<UserSettings>({
    username: '',
    email: '',
    avatar: '',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    recoveryAlerts: true,
    transactionAlerts: true,
    guardianThreshold: 3,
    sessionTimeout: 30,
    requirePasswordForTransactions: true,
    enableBiometricAuth: false,
    theme: 'system',
    language: 'en',
    currency: 'BTC',
    network: 'mainnet',
    customRpcUrl: '',
    feeRate: 10
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Check if settings have changed
    if (originalSettings) {
      setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
    }
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load settings from localStorage or protocol client
      const savedSettings = localStorage.getItem('seed-guardian-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setOriginalSettings(parsed);
      } else {
        // Default settings
        const defaultSettings: UserSettings = {
          username: 'User',
          email: '',
          avatar: '',
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          recoveryAlerts: true,
          transactionAlerts: true,
          guardianThreshold: 3,
          sessionTimeout: 30,
          requirePasswordForTransactions: true,
          enableBiometricAuth: false,
          theme: 'system',
          language: 'en',
          currency: 'BTC',
          network: 'mainnet',
          customRpcUrl: '',
          feeRate: 10
        };
        setSettings(defaultSettings);
        setOriginalSettings(defaultSettings);
      }
    } catch (err) {
      logger.error('Failed to load settings', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Save to localStorage
      localStorage.setItem('seed-guardian-settings', JSON.stringify(settings));
      
      // Apply theme
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      setOriginalSettings(settings);
      setHasChanges(false);
      
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated",
      });
    } catch (err) {
      logger.error('Failed to save settings', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Failed to load settings: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your preferences and security settings
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleResetSettings}>
              Reset
            </Button>
          )}
          <Button onClick={handleSaveSettings} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={settings.username}
                onChange={(e) => updateSetting('username', e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => updateSetting('email', e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Recovery Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified about recovery attempts</p>
            </div>
            <Switch
              checked={settings.recoveryAlerts}
              onCheckedChange={(checked) => updateSetting('recoveryAlerts', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Transaction Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified about transactions</p>
            </div>
            <Switch
              checked={settings.transactionAlerts}
              onCheckedChange={(checked) => updateSetting('transactionAlerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security preferences and guardian policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Guardian Threshold: {settings.guardianThreshold}</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Number of guardians required for recovery
            </p>
            <Slider
              value={[settings.guardianThreshold]}
              onValueChange={(value) => updateSetting('guardianThreshold', value[0])}
              max={10}
              min={2}
              step={1}
              className="w-full"
            />
          </div>
          
          <div>
            <Label>Session Timeout: {settings.sessionTimeout} minutes</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Automatically log out after inactivity
            </p>
            <Slider
              value={[settings.sessionTimeout]}
              onValueChange={(value) => updateSetting('sessionTimeout', value[0])}
              max={120}
              min={5}
              step={5}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Password for Transactions</Label>
              <p className="text-sm text-muted-foreground">Always require password confirmation</p>
            </div>
            <Switch
              checked={settings.requirePasswordForTransactions}
              onCheckedChange={(checked) => updateSetting('requirePasswordForTransactions', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Biometric Authentication</Label>
              <p className="text-sm text-muted-foreground">Use fingerprint or face recognition</p>
            </div>
            <Switch
              checked={settings.enableBiometricAuth}
              onCheckedChange={(checked) => updateSetting('enableBiometricAuth', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Theme</Label>
            <Select value={settings.theme} onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Network Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Network Settings
          </CardTitle>
          <CardDescription>
            Configure Bitcoin network and connection settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Network</Label>
            <Select value={settings.network} onValueChange={(value: 'mainnet' | 'testnet' | 'regtest') => updateSetting('network', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mainnet">Mainnet</SelectItem>
                <SelectItem value="testnet">Testnet</SelectItem>
                <SelectItem value="regtest">Regtest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="customRpcUrl">Custom RPC URL</Label>
            <Input
              id="customRpcUrl"
              value={settings.customRpcUrl}
              onChange={(e) => updateSetting('customRpcUrl', e.target.value)}
              placeholder="http://localhost:8332"
            />
          </div>
          
          <div>
            <Label>Default Fee Rate: {settings.feeRate} sat/vB</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Default fee rate for transactions
            </p>
            <Slider
              value={[settings.feeRate]}
              onValueChange={(value) => updateSetting('feeRate', value[0])}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Status */}
      {hasChanges && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">You have unsaved changes</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Don't forget to save your settings to apply the changes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
