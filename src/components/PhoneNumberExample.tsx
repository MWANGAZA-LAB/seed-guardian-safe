import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PhoneNumberInput from './PhoneNumberInput';
import CountryCodeSelector from './CountryCodeSelector';

export default function PhoneNumberExample() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('+1');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Phone Number Input Components</h1>
        <p className="text-muted-foreground">
          Enhanced phone number input with country code dropdown for the Seed Guardian Safe protocol
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Combined Phone Number Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📱 Combined Input
            </CardTitle>
            <CardDescription>
              All-in-one phone number input with country selector
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PhoneNumberInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              label="Guardian Phone Number"
              showCountrySelector={true}
              defaultCountryCode="+1"
            />
            
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Current Value:</p>
              <p className="text-sm text-muted-foreground font-mono">{phoneNumber || 'No number entered'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Separate Country Code Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌍 Country Selector
            </CardTitle>
            <CardDescription>
              Standalone country code dropdown component
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CountryCodeSelector
              value={selectedCountry}
              onChange={setSelectedCountry}
              placeholder="Select country"
            />
            
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Selected Country Code:</p>
              <p className="text-sm text-muted-foreground font-mono">{selectedCountry}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Features</CardTitle>
          <CardDescription>
            What makes these components perfect for your uncustodial protocol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Badge variant="secondary">🌍</Badge>
                Global Coverage
              </h4>
              <p className="text-sm text-muted-foreground">
                200+ countries with flags and proper formatting
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Badge variant="secondary">🔒</Badge>
                Security First
              </h4>
              <p className="text-sm text-muted-foreground">
                Input sanitization and validation built-in
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Badge variant="secondary">📱</Badge>
                Smart Formatting
              </h4>
              <p className="text-sm text-muted-foreground">
                Country-specific phone number formatting
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Badge variant="secondary">🔍</Badge>
                Search & Filter
              </h4>
              <p className="text-sm text-muted-foreground">
                Quick country search by name, code, or flag
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Badge variant="secondary">♿</Badge>
                Accessibility
              </h4>
              <p className="text-sm text-muted-foreground">
                Full keyboard navigation and screen reader support
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Badge variant="secondary">🎨</Badge>
                Customizable
              </h4>
              <p className="text-sm text-muted-foreground">
                Flexible styling and behavior options
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Example */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Integration Example</CardTitle>
          <CardDescription>
            How to use in your guardian forms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Guardian Form Integration:</h4>
              <pre className="text-sm overflow-x-auto">
{`<PhoneNumberInput
  value={form.phone}
  onChange={(phone) => setForm({ ...form, phone })}
  label="Guardian Phone Number"
  placeholder="Enter guardian's phone number"
  error={errors.phone}
  required={form.verificationMethod === 'sms'}
  showCountrySelector={true}
  defaultCountryCode="+1"
/>`}
              </pre>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Standalone Country Selector:</h4>
              <pre className="text-sm overflow-x-auto">
{`<CountryCodeSelector
  value={countryCode}
  onChange={setCountryCode}
  placeholder="Select country"
  disabled={false}
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why This Matters for Your Protocol */}
      <Card>
        <CardHeader>
          <CardTitle>🔐 Why This Matters for Seed Guardian Safe</CardTitle>
          <CardDescription>
            Understanding the importance of proper phone number handling in your uncustodial protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🛡️ Security Benefits:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Input sanitization prevents injection attacks</li>
                <li>• Proper validation ensures valid phone numbers</li>
                <li>• Country-specific formatting reduces errors</li>
                <li>• Consistent data format for backend processing</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🌍 Global Accessibility:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Support for 200+ countries worldwide</li>
                <li>• Familiar country flags for easy recognition</li>
                <li>• Search functionality for quick selection</li>
                <li>• Proper international formatting standards</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Protocol Context:
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Phone numbers are used for SMS verification during wallet recovery. When a user loses access 
              to their wallet, guardians can receive SMS codes to verify their identity and help restore 
              access. Proper phone number handling ensures reliable communication with guardians worldwide.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
