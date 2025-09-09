import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Settings as SettingsIcon, Shield, Users, Bell, Globe, Save, Loader2 } from 'lucide-react';
import AdvancedSettings from '@/components/AdvancedSettings';
import SecuritySettings from '@/components/SecuritySettings';
import { useUserSettings } from '@/hooks/useUserSettings';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'advanced'>('general');
  const { settings, isLoading, isSaving, updateSetting, updateNestedSetting } = useUserSettings();

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="border-b border-border/50 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'general' | 'security' | 'advanced')}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-bitcoin text-bitcoin'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card className="bg-gradient-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Your display name"
                        value={settings.displayName}
                        onChange={(e) => updateSetting('displayName', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={settings.email}
                        onChange={(e) => updateSetting('email', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value: 'en' | 'es' | 'fr' | 'de') => updateSetting('language', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="hero" 
                    className="w-full"
                    onClick={async () => {
                      const success = await updateSetting('displayName', settings.displayName);
                      if (success) {
                        toast({
                          title: "Settings Saved",
                          description: "Your general settings have been updated successfully.",
                        });
                      }
                    }}
                    disabled={isSaving || isLoading}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save General Settings
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">Receive important updates via email</div>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => updateNestedSetting('notifications', 'email', checked)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Guardian Alerts</div>
                      <div className="text-sm text-muted-foreground">Notifications about guardian activities</div>
                    </div>
                    <Switch
                      checked={settings.notifications.guardianAlerts}
                      onCheckedChange={(checked) => updateNestedSetting('notifications', 'guardianAlerts', checked)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Security Alerts</div>
                      <div className="text-sm text-muted-foreground">Critical security notifications</div>
                    </div>
                    <Switch
                      checked={settings.notifications.securityAlerts}
                      onCheckedChange={(checked) => updateNestedSetting('notifications', 'securityAlerts', checked)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Recovery Requests</div>
                      <div className="text-sm text-muted-foreground">Notifications for recovery processes</div>
                    </div>
                    <Switch
                      checked={settings.notifications.recoveryRequests}
                      onCheckedChange={(checked) => updateNestedSetting('notifications', 'recoveryRequests', checked)}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <SecuritySettings />
          )}

          {activeTab === 'advanced' && (
            <AdvancedSettings walletId="default" onNavigate={(path) => navigate(path)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
