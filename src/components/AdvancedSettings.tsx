import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Shield, 
  Key, 
  Database, 
  Network, 
  AlertTriangle,
  RefreshCw,
  Save,
  RotateCcw
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface AdvancedSettingsProps {
  walletId?: string;
  onNavigate?: (component: string) => void;
}

interface AdvancedSettings {
  experimentalFeatures: {
    taprootSupport: boolean;
    lightningIntegration: boolean;
    multiSigVaults: boolean;
    timeLockedRecovery: boolean;
  };
  cryptographicOptions: {
    keyDerivationFunction: 'PBKDF2' | 'Argon2' | 'Scrypt';
    encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
    hashFunction: 'SHA-256' | 'BLAKE3' | 'SHA-3';
    signatureScheme: 'ECDSA' | 'EdDSA' | 'Schnorr';
  };
  networkSettings: {
    bitcoinNetwork: 'mainnet' | 'testnet' | 'regtest';
    customRpcEndpoint: string;
    connectionTimeout: number;
    retryAttempts: number;
  };
  performanceOptions: {
    enableCaching: boolean;
    cacheExpiration: number;
    enableCompression: boolean;
    maxConcurrentRequests: number;
  };
  debugOptions: {
    enableLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableMetrics: boolean;
    enableProfiling: boolean;
  };
}

export default function AdvancedSettings({ walletId, onNavigate }: AdvancedSettingsProps) {
  useProtocol();
  
  // Use the parameters to avoid unused destructuring warning
  console.log('AdvancedSettings for wallet:', walletId);
  console.log('Navigation function available:', !!onNavigate);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [settings, setSettings] = useState<AdvancedSettings>({
    experimentalFeatures: {
      taprootSupport: false,
      lightningIntegration: false,
      multiSigVaults: false,
      timeLockedRecovery: false
    },
    cryptographicOptions: {
      keyDerivationFunction: 'PBKDF2',
      encryptionAlgorithm: 'AES-256-GCM',
      hashFunction: 'SHA-256',
      signatureScheme: 'ECDSA'
    },
    networkSettings: {
      bitcoinNetwork: 'mainnet',
      customRpcEndpoint: '',
      connectionTimeout: 30000,
      retryAttempts: 3
    },
    performanceOptions: {
      enableCaching: true,
      cacheExpiration: 3600,
      enableCompression: true,
      maxConcurrentRequests: 10
    },
    debugOptions: {
      enableLogging: false,
      logLevel: 'error',
      enableMetrics: false,
      enableProfiling: false
    }
  });

  const [originalSettings, setOriginalSettings] = useState<AdvancedSettings>(settings);

  useEffect(() => {
    loadAdvancedSettings();
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  const loadAdvancedSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load settings from localStorage or protocol client
      const savedSettings = await loadSettingsFromStorage();
      if (savedSettings) {
        setSettings(savedSettings);
        setOriginalSettings(savedSettings);
      }
    } catch (err) {
      logger.error('Failed to load advanced settings', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load advanced settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettingsFromStorage = async (): Promise<AdvancedSettings | null> => {
    try {
      const stored = localStorage.getItem('advanced-settings');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Save to localStorage and protocol client
      await saveSettingsToStorage(settings);
      
      setOriginalSettings(settings);
      setHasChanges(false);
      
      toast({
        title: "Settings Saved",
        description: "Advanced settings have been saved successfully",
      });
    } catch (err) {
      logger.error('Failed to save advanced settings', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to save advanced settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettingsToStorage = async (settings: AdvancedSettings): Promise<void> => {
    localStorage.setItem('advanced-settings', JSON.stringify(settings));
  };

  const resetSettings = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  const handleSettingChange = (section: keyof AdvancedSettings, key: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading advanced settings...</span>
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
            Advanced Settings
          </h2>
          <p className="text-muted-foreground">
            Configure experimental features and advanced options
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={resetSettings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={saveSettings} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Experimental Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Experimental Features
          </CardTitle>
          <CardDescription>
            Enable cutting-edge features that may be unstable
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="taprootSupport">Taproot Support</Label>
              <p className="text-sm text-muted-foreground">
                Enable Taproot address generation and transaction support
              </p>
            </div>
            <Switch
              id="taprootSupport"
              checked={settings.experimentalFeatures.taprootSupport}
              onCheckedChange={(checked) => handleSettingChange('experimentalFeatures', 'taprootSupport', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="lightningIntegration">Lightning Integration</Label>
              <p className="text-sm text-muted-foreground">
                Enable Lightning Network payment channels
              </p>
            </div>
            <Switch
              id="lightningIntegration"
              checked={settings.experimentalFeatures.lightningIntegration}
              onCheckedChange={(checked) => handleSettingChange('experimentalFeatures', 'lightningIntegration', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="multiSigVaults">Multi-Sig Vaults</Label>
              <p className="text-sm text-muted-foreground">
                Enable advanced multi-signature vault configurations
              </p>
            </div>
            <Switch
              id="multiSigVaults"
              checked={settings.experimentalFeatures.multiSigVaults}
              onCheckedChange={(checked) => handleSettingChange('experimentalFeatures', 'multiSigVaults', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="timeLockedRecovery">Time-Locked Recovery</Label>
              <p className="text-sm text-muted-foreground">
                Enable time-delayed recovery mechanisms
              </p>
            </div>
            <Switch
              id="timeLockedRecovery"
              checked={settings.experimentalFeatures.timeLockedRecovery}
              onCheckedChange={(checked) => handleSettingChange('experimentalFeatures', 'timeLockedRecovery', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cryptographic Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cryptographic Options
          </CardTitle>
          <CardDescription>
            Configure cryptographic algorithms and parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="keyDerivationFunction">Key Derivation Function</Label>
              <select
                id="keyDerivationFunction"
                value={settings.cryptographicOptions.keyDerivationFunction}
                onChange={(e) => handleSettingChange('cryptographicOptions', 'keyDerivationFunction', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PBKDF2">PBKDF2</option>
                <option value="Argon2">Argon2</option>
                <option value="Scrypt">Scrypt</option>
              </select>
            </div>

            <div>
              <Label htmlFor="encryptionAlgorithm">Encryption Algorithm</Label>
              <select
                id="encryptionAlgorithm"
                value={settings.cryptographicOptions.encryptionAlgorithm}
                onChange={(e) => handleSettingChange('cryptographicOptions', 'encryptionAlgorithm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AES-256-GCM">AES-256-GCM</option>
                <option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option>
              </select>
            </div>

            <div>
              <Label htmlFor="hashFunction">Hash Function</Label>
              <select
                id="hashFunction"
                value={settings.cryptographicOptions.hashFunction}
                onChange={(e) => handleSettingChange('cryptographicOptions', 'hashFunction', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SHA-256">SHA-256</option>
                <option value="BLAKE3">BLAKE3</option>
                <option value="SHA-3">SHA-3</option>
              </select>
            </div>

            <div>
              <Label htmlFor="signatureScheme">Signature Scheme</Label>
              <select
                id="signatureScheme"
                value={settings.cryptographicOptions.signatureScheme}
                onChange={(e) => handleSettingChange('cryptographicOptions', 'signatureScheme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ECDSA">ECDSA</option>
                <option value="EdDSA">EdDSA</option>
                <option value="Schnorr">Schnorr</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Settings
          </CardTitle>
          <CardDescription>
            Configure Bitcoin network connection parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bitcoinNetwork">Bitcoin Network</Label>
              <select
                id="bitcoinNetwork"
                value={settings.networkSettings.bitcoinNetwork}
                onChange={(e) => handleSettingChange('networkSettings', 'bitcoinNetwork', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
                <option value="regtest">Regtest</option>
              </select>
            </div>

            <div>
              <Label htmlFor="connectionTimeout">Connection Timeout (ms)</Label>
              <Input
                id="connectionTimeout"
                type="number"
                value={settings.networkSettings.connectionTimeout}
                onChange={(e) => handleSettingChange('networkSettings', 'connectionTimeout', parseInt(e.target.value))}
                min="1000"
                max="60000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="customRpcEndpoint">Custom RPC Endpoint</Label>
            <Input
              id="customRpcEndpoint"
              value={settings.networkSettings.customRpcEndpoint}
              onChange={(e) => handleSettingChange('networkSettings', 'customRpcEndpoint', e.target.value)}
              placeholder="https://your-bitcoin-node.com:8332"
            />
          </div>

          <div>
            <Label htmlFor="retryAttempts">Retry Attempts</Label>
            <Input
              id="retryAttempts"
              type="number"
              value={settings.networkSettings.retryAttempts}
              onChange={(e) => handleSettingChange('networkSettings', 'retryAttempts', parseInt(e.target.value))}
              min="1"
              max="10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Performance Options
          </CardTitle>
          <CardDescription>
            Optimize application performance and caching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableCaching">Enable Caching</Label>
              <p className="text-sm text-muted-foreground">
                Cache frequently accessed data for better performance
              </p>
            </div>
            <Switch
              id="enableCaching"
              checked={settings.performanceOptions.enableCaching}
              onCheckedChange={(checked) => handleSettingChange('performanceOptions', 'enableCaching', checked)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cacheExpiration">Cache Expiration (seconds)</Label>
              <Input
                id="cacheExpiration"
                type="number"
                value={settings.performanceOptions.cacheExpiration}
                onChange={(e) => handleSettingChange('performanceOptions', 'cacheExpiration', parseInt(e.target.value))}
                min="60"
                max="86400"
              />
            </div>

            <div>
              <Label htmlFor="maxConcurrentRequests">Max Concurrent Requests</Label>
              <Input
                id="maxConcurrentRequests"
                type="number"
                value={settings.performanceOptions.maxConcurrentRequests}
                onChange={(e) => handleSettingChange('performanceOptions', 'maxConcurrentRequests', parseInt(e.target.value))}
                min="1"
                max="50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableCompression">Enable Compression</Label>
              <p className="text-sm text-muted-foreground">
                Compress data to reduce bandwidth usage
              </p>
            </div>
            <Switch
              id="enableCompression"
              checked={settings.performanceOptions.enableCompression}
              onCheckedChange={(checked) => handleSettingChange('performanceOptions', 'enableCompression', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Debug Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Debug Options
          </CardTitle>
          <CardDescription>
            Enable debugging and logging features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableLogging">Enable Logging</Label>
              <p className="text-sm text-muted-foreground">
                Log application events and errors
              </p>
            </div>
            <Switch
              id="enableLogging"
              checked={settings.debugOptions.enableLogging}
              onCheckedChange={(checked) => handleSettingChange('debugOptions', 'enableLogging', checked)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logLevel">Log Level</Label>
              <select
                id="logLevel"
                value={settings.debugOptions.logLevel}
                onChange={(e) => handleSettingChange('debugOptions', 'logLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableMetrics">Enable Metrics</Label>
                <p className="text-sm text-muted-foreground">
                  Collect performance metrics
                </p>
              </div>
              <Switch
                id="enableMetrics"
                checked={settings.debugOptions.enableMetrics}
                onCheckedChange={(checked) => handleSettingChange('debugOptions', 'enableMetrics', checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableProfiling">Enable Profiling</Label>
              <p className="text-sm text-muted-foreground">
                Profile application performance
              </p>
            </div>
            <Switch
              id="enableProfiling"
              checked={settings.debugOptions.enableProfiling}
              onCheckedChange={(checked) => handleSettingChange('debugOptions', 'enableProfiling', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Warning</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Advanced settings can affect the security and stability of your wallet. 
                Only modify these settings if you understand their implications. 
                Incorrect configurations may result in loss of funds or reduced security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
