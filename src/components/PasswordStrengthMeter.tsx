import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Key
} from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  showDetails?: boolean;
  showToggle?: boolean;
  onStrengthChange?: (strength: PasswordStrength) => void;
}

interface PasswordStrength {
  score: number; // 0-100
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  color: string;
  label: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    common: boolean;
    repeated: boolean;
  };
  suggestions: string[];
}

export default function PasswordStrengthMeter({ 
  password, 
  showDetails = true, 
  showToggle = false,
  onStrengthChange 
}: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    level: 'very-weak',
    color: 'bg-red-500',
    label: 'Very Weak',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
      common: false,
      repeated: false
    },
    suggestions: []
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const newStrength = calculatePasswordStrength(password);
    setStrength(newStrength);
    onStrengthChange?.(newStrength);
  }, [password, onStrengthChange]);

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /[0-9]/.test(pwd),
      symbols: /[^A-Za-z0-9]/.test(pwd),
      common: !isCommonPassword(pwd),
      repeated: !hasRepeatedCharacters(pwd)
    };

    let score = 0;
    const suggestions: string[] = [];

    // Length scoring
    if (pwd.length >= 8) score += 20;
    else if (pwd.length >= 6) score += 10;
    else suggestions.push('Use at least 8 characters');

    if (pwd.length >= 12) score += 10;
    else if (pwd.length >= 8) suggestions.push('Consider using 12+ characters for better security');

    // Character type scoring
    if (requirements.uppercase) score += 15;
    else suggestions.push('Add uppercase letters (A-Z)');

    if (requirements.lowercase) score += 15;
    else suggestions.push('Add lowercase letters (a-z)');

    if (requirements.numbers) score += 15;
    else suggestions.push('Add numbers (0-9)');

    if (requirements.symbols) score += 15;
    else suggestions.push('Add special characters (!@#$%^&*)');

    // Quality scoring
    if (requirements.common) score += 10;
    else {
      score -= 20;
      suggestions.push('Avoid common passwords');
    }

    if (requirements.repeated) score += 10;
    else {
      score -= 10;
      suggestions.push('Avoid repeated characters');
    }

    // Bonus for length
    if (pwd.length >= 16) score += 10;
    if (pwd.length >= 20) score += 5;

    // Bonus for complexity
    const uniqueChars = new Set(pwd).size;
    if (uniqueChars >= 8) score += 5;
    if (uniqueChars >= 12) score += 5;

    // Cap score at 100
    score = Math.min(100, Math.max(0, score));

    // Determine level
    let level: PasswordStrength['level'];
    let color: string;
    let label: string;

    if (score >= 90) {
      level = 'very-strong';
      color = 'bg-green-600';
      label = 'Very Strong';
    } else if (score >= 75) {
      level = 'strong';
      color = 'bg-green-500';
      label = 'Strong';
    } else if (score >= 60) {
      level = 'good';
      color = 'bg-yellow-500';
      label = 'Good';
    } else if (score >= 40) {
      level = 'fair';
      color = 'bg-orange-500';
      label = 'Fair';
    } else if (score >= 20) {
      level = 'weak';
      color = 'bg-red-500';
      label = 'Weak';
    } else {
      level = 'very-weak';
      color = 'bg-red-600';
      label = 'Very Weak';
    }

    return {
      score,
      level,
      color,
      label,
      requirements,
      suggestions
    };
  };

  const isCommonPassword = (pwd: string): boolean => {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      '1234567890', 'password1', 'qwerty123', 'dragon', 'master'
    ];
    return commonPasswords.includes(pwd.toLowerCase());
  };

  const hasRepeatedCharacters = (pwd: string): boolean => {
    for (let i = 0; i < pwd.length - 2; i++) {
      if (pwd[i] === pwd[i + 1] && pwd[i + 1] === pwd[i + 2]) {
        return true;
      }
    }
    return false;
  };

  const getRequirementIcon = (met: boolean) => {
    return met ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStrengthIcon = () => {
    switch (strength.level) {
      case 'very-strong':
      case 'strong':
        return <Shield className="h-5 w-5 text-green-500" />;
      case 'good':
        return <CheckCircle className="h-5 w-5 text-yellow-500" />;
      case 'fair':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'weak':
      case 'very-weak':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Lock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Password Strength
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Password Display */}
        {showToggle && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="font-mono text-sm flex-1">
              {showPassword ? password : '•'.repeat(password.length || 8)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* Strength Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStrengthIcon()}
              <span className="font-medium">{strength.label}</span>
            </div>
            <Badge variant={strength.level === 'very-weak' || strength.level === 'weak' ? 'destructive' : 
                           strength.level === 'fair' ? 'secondary' : 'default'}>
              {strength.score}/100
            </Badge>
          </div>
          
          <Progress value={strength.score} className="h-2" />
        </div>

        {/* Requirements */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Requirements</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getRequirementIcon(strength.requirements.length)}
                <span className="text-sm">At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2">
                {getRequirementIcon(strength.requirements.uppercase)}
                <span className="text-sm">Uppercase letters (A-Z)</span>
              </div>
              <div className="flex items-center gap-2">
                {getRequirementIcon(strength.requirements.lowercase)}
                <span className="text-sm">Lowercase letters (a-z)</span>
              </div>
              <div className="flex items-center gap-2">
                {getRequirementIcon(strength.requirements.numbers)}
                <span className="text-sm">Numbers (0-9)</span>
              </div>
              <div className="flex items-center gap-2">
                {getRequirementIcon(strength.requirements.symbols)}
                <span className="text-sm">Special characters (!@#$%^&*)</span>
              </div>
              <div className="flex items-center gap-2">
                {getRequirementIcon(strength.requirements.common)}
                <span className="text-sm">Not a common password</span>
              </div>
              <div className="flex items-center gap-2">
                {getRequirementIcon(strength.requirements.repeated)}
                <span className="text-sm">No repeated characters</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {strength.suggestions.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Suggestions</p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  {strength.suggestions.map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Security Tips */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Security Tips</p>
              <ul className="text-sm text-green-700 mt-1 space-y-1">
                <li>• Use a unique password for each account</li>
                <li>• Consider using a password manager</li>
                <li>• Enable two-factor authentication when available</li>
                <li>• Regularly update your passwords</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
