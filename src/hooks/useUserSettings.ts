import { useState, useEffect } from 'react';
import { useProtocol } from './useProtocol';
import { logger } from '@/lib/logger';

export interface UserSettings {
  id: string;
  displayName: string;
  email: string;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
  notifications: {
    email: boolean;
    guardianAlerts: boolean;
    securityAlerts: boolean;
    recoveryRequests: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    backupCodesGenerated: boolean;
    lastPasswordChange: string;
    loginNotifications: boolean;
    deviceTrust: boolean;
  };
  advanced: {
    experimentalFeatures: boolean;
    debugMode: boolean;
    auditLogRetention: number; // days
    autoBackup: boolean;
    encryptionLevel: 'standard' | 'enhanced' | 'maximum';
  };
}

const defaultSettings: UserSettings = {
  id: 'user-1',
  displayName: 'Bitcoin Holder',
  email: 'user@example.com',
  theme: 'dark',
  language: 'en',
  notifications: {
    email: true,
    guardianAlerts: true,
    securityAlerts: true,
    recoveryRequests: true,
  },
  security: {
    twoFactorEnabled: false,
    backupCodesGenerated: false,
    lastPasswordChange: '2024-01-15T10:30:00Z',
    loginNotifications: true,
    deviceTrust: false,
  },
  advanced: {
    experimentalFeatures: false,
    debugMode: false,
    auditLogRetention: 365,
    autoBackup: true,
    encryptionLevel: 'enhanced',
  },
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const protocol = useProtocol();

  // Load user settings
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would fetch from the backend
      // For now, we'll use localStorage to persist settings
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } else {
        setSettings(defaultSettings);
      }
      
      logger.info('User settings loaded successfully');
    } catch (error) {
      logger.error('Failed to load user settings:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  // Save user settings
  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      setIsSaving(true);
      const updatedSettings = { ...settings, ...newSettings };
      
      // In a real app, this would save to the backend
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
      
      // Log the settings update
      await protocol.protocolClient?.createAuditLog({
        action: 'settings_updated',
        details: {
          updatedFields: Object.keys(newSettings),
          timestamp: new Date().toISOString(),
        },
      });
      
      logger.info('User settings saved successfully');
      return true;
    } catch (error) {
      logger.error('Failed to save user settings:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Update specific setting
  const updateSetting = async (key: keyof UserSettings, value: any) => {
    return await saveSettings({ [key]: value });
  };

  // Update nested setting
  const updateNestedSetting = async (
    category: keyof UserSettings,
    key: string,
    value: any
  ) => {
    const updatedSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };
    return await saveSettings(updatedSettings);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    isSaving,
    loadSettings,
    saveSettings,
    updateSetting,
    updateNestedSetting,
  };
}
