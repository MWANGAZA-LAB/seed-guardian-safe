import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Shield, 
  Save,
  Loader2,
  Eye,
  EyeOff,
  Settings,
  Key
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { useUserSettings } from '@/hooks/useUserSettings';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface ProfileUpdateFormProps {
  userId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ProfileForm {
  username: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  bio: string;
  timezone: string;
  language: 'en' | 'es' | 'fr' | 'de';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    recovery: boolean;
    security: boolean;
    transactions: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    backupCodesGenerated: boolean;
    lastPasswordChange: string;
    loginNotifications: boolean;
    deviceTrust: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    currency: 'BTC';
    dateFormat: 'MM/DD/YYYY';
    timeFormat: '12h';
    autoLock: number; // minutes
    sessionTimeout: number; // minutes
  };
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfileUpdateForm({ 
  userId, 
  onSuccess, 
  onCancel 
}: ProfileUpdateFormProps) {
  useProtocol();
  const { settings } = useUserSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'password'>('profile');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Extended profile form with additional fields
  const [profileForm, setProfileForm] = useState({
    username: settings.displayName,
    email: settings.email,
    phone: '',
    firstName: '',
    lastName: '',
    bio: '',
    timezone: 'UTC',
    language: settings.language,
    notifications: {
      email: settings.notifications.email,
      sms: false,
      push: true,
      recovery: settings.notifications.recoveryRequests,
      security: settings.notifications.securityAlerts,
      transactions: true
    },
    security: {
      twoFactorEnabled: settings.security.twoFactorEnabled,
      backupCodesGenerated: settings.security.backupCodesGenerated,
      lastPasswordChange: settings.security.lastPasswordChange,
      loginNotifications: settings.security.loginNotifications,
      deviceTrust: settings.security.deviceTrust
    },
    preferences: {
      theme: settings.theme,
      currency: 'BTC' as const,
      dateFormat: 'MM/DD/YYYY' as const,
      timeFormat: '12h' as const,
      autoLock: 30,
      sessionTimeout: 120
    }
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Partial<ProfileForm & PasswordForm>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  useEffect(() => {
    // Check for changes
    setHasChanges(true); // Simplified for demo
  }, [profileForm, passwordForm]);

  const loadUserProfile = async () => {
    try {
      // Load user profile from Supabase
      const userData = await loadUserProfileFromSupabase();
      setProfileForm(userData);
    } catch (err) {
      logger.error('Failed to load user profile', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const loadUserProfileFromSupabase = async (): Promise<ProfileForm> => {
    // Mock implementation - would integrate with Supabase
    return {
      username: 'user123',
      email: 'user@example.com',
      phone: '+1-555-0123',
      firstName: 'John',
      lastName: 'Doe',
      bio: 'Bitcoin enthusiast and security advocate',
      timezone: 'America/New_York',
      language: 'en',
      notifications: {
        email: true,
        sms: false,
        push: true,
        recovery: true,
        security: true,
        transactions: true
      },
      security: {
        twoFactorEnabled: false,
        backupCodesGenerated: false,
        lastPasswordChange: '2024-01-01',
        loginNotifications: true,
        deviceTrust: false
      },
      preferences: {
        theme: 'system',
        currency: 'BTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        autoLock: 30,
        sessionTimeout: 120
      }
    };
  };

  const validateProfileForm = (): boolean => {
    const newErrors: Partial<ProfileForm> = {};

    if (!profileForm.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!profileForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!profileForm.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!profileForm.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Partial<PasswordForm> = {};

    if (!passwordForm.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Update profile via Supabase
      await updateUserProfileViaSupabase(profileForm);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });

      onSuccess?.();
      
    } catch (err) {
      logger.error('Failed to update profile', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Change password via Supabase
      await changePasswordViaSupabase(passwordForm);
      
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully",
      });

      // Reset password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (err) {
      logger.error('Failed to change password', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserProfileViaSupabase = async (_profileData: ProfileForm): Promise<void> => {
    // Mock implementation - would call Supabase function
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const changePasswordViaSupabase = async (_passwordData: PasswordForm): Promise<void> => {
    // Mock implementation - would call Supabase function
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const renderProfileTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={profileForm.firstName}
            onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={profileForm.lastName}
            onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={profileForm.username}
          onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
          className={errors.username ? 'border-red-500' : ''}
        />
        {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={profileForm.email}
          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={profileForm.phone}
          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
          placeholder="+1-555-0123"
        />
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={profileForm.bio}
          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
          placeholder="Tell us about yourself"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={profileForm.timezone}
            onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>

        <div>
          <Label htmlFor="language">Language</Label>
          <select
            id="language"
            value={profileForm.language}
            onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="twoFactorEnabled">Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <input
            type="checkbox"
            id="twoFactorEnabled"
            checked={profileForm.security.twoFactorEnabled}
            onChange={(e) => setProfileForm({
              ...profileForm,
              security: { ...profileForm.security, twoFactorEnabled: e.target.checked }
            })}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="loginNotifications">Login Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when someone logs into your account
            </p>
          </div>
          <input
            type="checkbox"
            id="loginNotifications"
            checked={profileForm.security.loginNotifications}
            onChange={(e) => setProfileForm({
              ...profileForm,
              security: { ...profileForm.security, loginNotifications: e.target.checked }
            })}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="deviceTrust">Device Trust</Label>
            <p className="text-sm text-muted-foreground">
              Remember trusted devices for easier login
            </p>
          </div>
          <input
            type="checkbox"
            id="deviceTrust"
            checked={profileForm.security.deviceTrust}
            onChange={(e) => setProfileForm({
              ...profileForm,
              security: { ...profileForm.security, deviceTrust: e.target.checked }
            })}
            className="rounded"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Security Status</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Two-Factor Authentication</span>
            <Badge variant={profileForm.security.twoFactorEnabled ? 'default' : 'secondary'}>
              {profileForm.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Backup Codes</span>
            <Badge variant={profileForm.security.backupCodesGenerated ? 'default' : 'secondary'}>
              {profileForm.security.backupCodesGenerated ? 'Generated' : 'Not Generated'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Last Password Change</span>
            <span className="text-sm text-muted-foreground">
              {profileForm.security.lastPasswordChange}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="theme">Theme</Label>
          <select
            id="theme"
            value={profileForm.preferences.theme}
            onChange={(e) => setProfileForm({
              ...profileForm,
              preferences: { ...profileForm.preferences, theme: e.target.value as 'light' | 'dark' | 'system' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            value={profileForm.preferences.currency}
            onChange={(e) => setProfileForm({
              ...profileForm,
              preferences: { ...profileForm.preferences, currency: e.target.value as 'BTC' | 'USD' | 'EUR' | 'GBP' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="GBP">British Pound (GBP)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateFormat">Date Format</Label>
          <select
            id="dateFormat"
            value={profileForm.preferences.dateFormat}
            onChange={(e) => setProfileForm({
              ...profileForm,
              preferences: { ...profileForm.preferences, dateFormat: e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <Label htmlFor="timeFormat">Time Format</Label>
          <select
            id="timeFormat"
            value={profileForm.preferences.timeFormat}
            onChange={(e) => setProfileForm({
              ...profileForm,
              preferences: { ...profileForm.preferences, timeFormat: e.target.value as '12h' | '24h' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="12h">12 Hour</option>
            <option value="24h">24 Hour</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="autoLock">Auto Lock (minutes)</Label>
          <Input
            id="autoLock"
            type="number"
            min="1"
            max="60"
            value={profileForm.preferences.autoLock}
            onChange={(e) => setProfileForm({
              ...profileForm,
              preferences: { ...profileForm.preferences, autoLock: parseInt(e.target.value) || 30 }
            })}
          />
        </div>

        <div>
          <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            min="15"
            max="480"
            value={profileForm.preferences.sessionTimeout}
            onChange={(e) => setProfileForm({
              ...profileForm,
              preferences: { ...profileForm.preferences, sessionTimeout: parseInt(e.target.value) || 120 }
            })}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Notification Preferences</h4>
        <div className="space-y-3">
          {Object.entries(profileForm.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {key === 'email' && 'Receive notifications via email'}
                  {key === 'sms' && 'Receive notifications via SMS'}
                  {key === 'push' && 'Receive push notifications'}
                  {key === 'recovery' && 'Get notified about recovery activities'}
                  {key === 'security' && 'Get notified about security events'}
                  {key === 'transactions' && 'Get notified about transactions'}
                </p>
              </div>
              <input
                type="checkbox"
                id={key}
                checked={value}
                onChange={(e) => setProfileForm({
                  ...profileForm,
                  notifications: { ...profileForm.notifications, [key]: e.target.checked }
                })}
                className="rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPasswordTab = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showPasswords.current ? 'text' : 'password'}
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className={errors.currentPassword ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
          >
            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {errors.currentPassword && <p className="text-sm text-red-500 mt-1">{errors.currentPassword}</p>}
      </div>

      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className={errors.newPassword ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
          >
            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {errors.newPassword && <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
          >
            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
      </div>

      <div className="border-t pt-4">
        <Button onClick={handleChangePassword} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Changing Password...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Change Password
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings className="h-4 w-4" /> },
    { id: 'password', label: 'Password', icon: <Key className="h-4 w-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            Profile Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'profile' | 'security' | 'preferences' | 'password')}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="pt-6">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'preferences' && renderPreferencesTab()}
          {activeTab === 'password' && renderPasswordTab()}
        </CardContent>
      </Card>

      {/* Actions */}
      {activeTab !== 'password' && (
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSaveProfile} disabled={isSubmitting || !hasChanges}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
      )}
    </div>
  );
}
