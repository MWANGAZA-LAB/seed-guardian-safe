import { lazy } from 'react';

// Lazy load main dashboard components
// Note: These components will be created as part of the protocol implementation
export const WalletDashboard = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Wallet Dashboard - Coming Soon</div> 
}));

export const GuardianManagement = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Guardian Management - Coming Soon</div> 
}));

export const RecoveryProcess = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Recovery Process - Coming Soon</div> 
}));

export const TransactionHistory = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Transaction History - Coming Soon</div> 
}));

export const SettingsPanel = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Settings Panel - Coming Soon</div> 
}));

export const SecuritySettings = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Security Settings - Coming Soon</div> 
}));

export const BackupRestore = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Backup Restore - Coming Soon</div> 
}));

export const AuditLogs = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Audit Logs - Coming Soon</div> 
}));

// Lazy load advanced components
export const AdvancedSettings = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Advanced Settings - Coming Soon</div> 
}));

export const HelpDocumentation = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Help Documentation - Coming Soon</div> 
}));

export const ContactSupport = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Contact Support - Coming Soon</div> 
}));

// Lazy load modal components
export const CreateWalletModal = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Create Wallet Modal - Coming Soon</div> 
}));

export const AddGuardianModal = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Add Guardian Modal - Coming Soon</div> 
}));

export const RecoveryModal = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Recovery Modal - Coming Soon</div> 
}));

export const TransactionModal = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Transaction Modal - Coming Soon</div> 
}));

export const ConfirmationModal = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Confirmation Modal - Coming Soon</div> 
}));

// Lazy load chart components
export const BalanceChart = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Balance Chart - Coming Soon</div> 
}));

export const TransactionChart = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Transaction Chart - Coming Soon</div> 
}));

export const GuardianStatusChart = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Guardian Status Chart - Coming Soon</div> 
}));

// Lazy load form components
export const WalletCreationForm = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Wallet Creation Form - Coming Soon</div> 
}));

export const GuardianInvitationForm = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Guardian Invitation Form - Coming Soon</div> 
}));

export const RecoveryInitiationForm = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Recovery Initiation Form - Coming Soon</div> 
}));

export const TransactionForm = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Transaction Form - Coming Soon</div> 
}));

export const ProfileUpdateForm = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Profile Update Form - Coming Soon</div> 
}));

// Lazy load utility components
export const QRCodeGenerator = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">QR Code Generator - Coming Soon</div> 
}));

export const AddressValidator = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Address Validator - Coming Soon</div> 
}));

export const PasswordStrengthMeter = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Password Strength Meter - Coming Soon</div> 
}));

export const SecurityAuditReport = lazy(() => Promise.resolve({ 
  default: () => <div className="p-4">Security Audit Report - Coming Soon</div> 
}));
