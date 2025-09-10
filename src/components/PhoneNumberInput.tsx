import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CountryCodeSelector from './CountryCodeSelector';
import { InputSanitizer } from '@/lib/security';

interface PhoneNumberInputProps {
  value: string;
  onChange: (phoneNumber: string) => void;
  onCountryCodeChange?: (countryCode: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  showCountrySelector?: boolean;
  defaultCountryCode?: string;
}

export default function PhoneNumberInput({
  value,
  onChange,
  onCountryCodeChange,
  label = "Phone Number",
  placeholder = "Enter phone number",
  required = false,
  disabled = false,
  className = "",
  error,
  showCountrySelector = true,
  defaultCountryCode = "+1"
}: PhoneNumberInputProps) {
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [localNumber, setLocalNumber] = useState('');

  // Parse existing value on mount
  useEffect(() => {
    if (value) {
      // Check if value starts with a country code
      const countryCodeMatch = value.match(/^(\+\d{1,4})/);
      if (countryCodeMatch) {
        const detectedCode = countryCodeMatch[1];
        setCountryCode(detectedCode);
        setLocalNumber(value.substring(detectedCode.length));
      } else {
        setLocalNumber(value);
      }
    }
  }, [value]);

  // Update parent when values change
  useEffect(() => {
    const fullNumber = countryCode + localNumber;
    onChange(fullNumber);
  }, [countryCode, localNumber, onChange]);

  const handleCountryCodeChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    onCountryCodeChange?.(newCountryCode);
  };

  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Sanitize input - only allow digits, spaces, hyphens, and parentheses
    const sanitized = InputSanitizer.sanitizePhoneNumber(input);
    setLocalNumber(sanitized);
  };

  // Note: formatPhoneNumber function available for future use
  // const formatPhoneNumber = (number: string) => { ... }

  const getPlaceholder = () => {
    if (countryCode === '+1') return "(555) 123-4567";
    if (countryCode === '+44') return "20 7946 0958";
    if (countryCode === '+49') return "30 12345678";
    if (countryCode === '+33') return "1 23 45 67 89";
    return "1234567890";
  };

  const getMaxLength = () => {
    if (countryCode === '+1') return 14; // (XXX) XXX-XXXX
    if (countryCode === '+44') return 13; // XXXX XXX XXXX
    if (countryCode === '+49') return 12; // XXX XXXXXXX
    if (countryCode === '+33') return 14; // X XX XX XX XX
    return 15; // Default
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="phone-number" className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="flex gap-2">
        {showCountrySelector && (
          <div className="w-32">
            <CountryCodeSelector
              value={countryCode}
              onChange={handleCountryCodeChange}
              placeholder="Country"
              disabled={disabled}
            />
          </div>
        )}
        
        <div className="flex-1">
          <Input
            id="phone-number"
            type="tel"
            value={localNumber}
            onChange={handleLocalNumberChange}
            placeholder={getPlaceholder()}
            disabled={disabled}
            maxLength={getMaxLength()}
            className={`${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      <div className="text-xs text-muted-foreground">
        <p>Full number: {countryCode}{localNumber || '...'}</p>
        <p>This number will be used for SMS verification during wallet recovery.</p>
      </div>
    </div>
  );
}
