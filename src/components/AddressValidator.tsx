import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface AddressValidatorProps {
  address?: string;
  onValidationChange?: (isValid: boolean, address: string) => void;
  showDetails?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  type: 'legacy' | 'segwit' | 'bech32' | 'taproot' | 'unknown';
  network: 'mainnet' | 'testnet' | 'regtest' | 'unknown';
  checksum: boolean;
  length: number;
  format: string;
  confidence: number; // 0-100
  warnings: string[];
  errors: string[];
}

export default function AddressValidator({ 
  address = '', 
  onValidationChange,
  showDetails = true 
}: AddressValidatorProps) {
  const [inputAddress, setInputAddress] = useState(address);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  useEffect(() => {
    if (inputAddress) {
      validateAddress();
    } else {
      setValidationResult(null);
    }
  }, [inputAddress]);

  useEffect(() => {
    if (validationResult) {
      onValidationChange?.(validationResult.isValid, inputAddress);
    }
  }, [validationResult, inputAddress, onValidationChange]);

  const validateAddress = async () => {
    if (!inputAddress.trim()) {
      setValidationResult(null);
      return;
    }

    try {
      setIsValidating(true);
      
      // Mock validation - would use a real Bitcoin address validation library
      const result = await performValidation(inputAddress.trim());
      setValidationResult(result);
      
    } catch (err) {
      logger.error('Failed to validate address', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to validate address",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const performValidation = async (addr: string): Promise<ValidationResult> => {
    // Mock implementation - would use a real Bitcoin address validation library
    const result: ValidationResult = {
      isValid: false,
      type: 'unknown',
      network: 'unknown',
      checksum: false,
      length: addr.length,
      format: 'unknown',
      confidence: 0,
      warnings: [],
      errors: []
    };

    // Basic length checks
    if (addr.length < 26 || addr.length > 62) {
      result.errors.push('Invalid address length');
      return result;
    }

    // Legacy P2PKH (starts with 1)
    if (addr.startsWith('1') && addr.length >= 26 && addr.length <= 35) {
      result.type = 'legacy';
      result.network = 'mainnet';
      result.format = 'P2PKH (Pay to Public Key Hash)';
      result.isValid = true;
      result.confidence = 85;
    }
    // Legacy P2SH (starts with 3)
    else if (addr.startsWith('3') && addr.length >= 26 && addr.length <= 35) {
      result.type = 'legacy';
      result.network = 'mainnet';
      result.format = 'P2SH (Pay to Script Hash)';
      result.isValid = true;
      result.confidence = 85;
    }
    // Bech32 (starts with bc1)
    else if (addr.startsWith('bc1') && addr.length >= 42 && addr.length <= 62) {
      result.type = 'bech32';
      result.network = 'mainnet';
      result.format = 'Bech32 (Native SegWit)';
      result.isValid = true;
      result.confidence = 90;
    }
    // Taproot (starts with bc1p)
    else if (addr.startsWith('bc1p') && addr.length === 62) {
      result.type = 'taproot';
      result.network = 'mainnet';
      result.format = 'Taproot (P2TR)';
      result.isValid = true;
      result.confidence = 95;
    }
    // Testnet addresses
    else if (addr.startsWith('tb1') || addr.startsWith('2') || addr.startsWith('m') || addr.startsWith('n')) {
      result.network = 'testnet';
      if (addr.startsWith('tb1')) {
        result.type = 'bech32';
        result.format = 'Bech32 Testnet';
      } else {
        result.type = 'legacy';
        result.format = 'Legacy Testnet';
      }
      result.isValid = true;
      result.confidence = 80;
      result.warnings.push('This is a testnet address');
    }
    // Regtest addresses
    else if (addr.startsWith('bcrt1') || addr.startsWith('2') || addr.startsWith('m') || addr.startsWith('n')) {
      result.network = 'regtest';
      result.type = 'legacy';
      result.format = 'Regtest';
      result.isValid = true;
      result.confidence = 70;
      result.warnings.push('This is a regtest address');
    }
    else {
      result.errors.push('Unknown address format');
      result.confidence = 0;
    }

    // Additional validation checks
    if (result.isValid) {
      // Check for valid characters
      const validChars = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz]+$/;
      if (!validChars.test(addr)) {
        result.errors.push('Contains invalid characters');
        result.isValid = false;
        result.confidence = 0;
      }

      // Check for mixed case (should be consistent)
      if (addr !== addr.toLowerCase() && addr !== addr.toUpperCase()) {
        result.warnings.push('Mixed case detected - ensure proper capitalization');
      }

      // Check for common typos
      if (addr.includes('0') || addr.includes('O') || addr.includes('I') || addr.includes('l')) {
        result.warnings.push('Contains characters that could be confused (0/O, I/l)');
      }
    }

    return result;
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(inputAddress);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const handleViewOnExplorer = () => {
    if (!validationResult?.isValid) return;
    
    const explorerUrl = validationResult.network === 'mainnet' 
      ? `https://blockstream.info/address/${inputAddress}`
      : `https://blockstream.info/testnet/address/${inputAddress}`;
    
    window.open(explorerUrl, '_blank');
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500 animate-pulse" />;
    }
    
    if (!validationResult) {
      return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
    
    if (validationResult.isValid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getValidationColor = () => {
    if (isValidating) return 'yellow';
    if (!validationResult) return 'gray';
    if (validationResult.isValid) return 'green';
    return 'red';
  };


  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Bitcoin Address Validator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Input */}
        <div>
          <Label htmlFor="address">Bitcoin Address</Label>
          <div className="relative">
            <Input
              id="address"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="Enter Bitcoin address to validate"
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddress(!showAddress)}
                className="h-6 w-6 p-0"
              >
                {showAddress ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-6 w-6 p-0"
                disabled={!inputAddress}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getValidationIcon()}
                <div>
                  <p className="font-medium">
                    {validationResult.isValid ? 'Valid Address' : 'Invalid Address'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.format}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getValidationColor() as 'default' | 'secondary' | 'destructive' | 'outline'}>
                  {validationResult.isValid ? 'Valid' : 'Invalid'}
                </Badge>
                <Badge variant="outline">
                  {validationResult.confidence}% confidence
                </Badge>
              </div>
            </div>

            {/* Details */}
            {showDetails && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="font-medium">{validationResult.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Network</p>
                  <p className="font-medium">{validationResult.network}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Length</p>
                  <p className="font-medium">{validationResult.length} characters</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Format</p>
                  <p className="font-medium">{validationResult.format}</p>
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Warnings</p>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Errors</p>
                    <ul className="text-sm text-red-700 mt-1 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {validationResult.isValid && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewOnExplorer}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAddress}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Address Types</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• <strong>Legacy (1...):</strong> Original Bitcoin address format</li>
                <li>• <strong>P2SH (3...):</strong> Script hash addresses</li>
                <li>• <strong>Bech32 (bc1...):</strong> Native SegWit addresses</li>
                <li>• <strong>Taproot (bc1p...):</strong> Latest address format</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
