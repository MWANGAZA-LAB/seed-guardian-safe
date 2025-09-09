import { lazy } from 'react';

// Lazy load main dashboard components
export const WalletDashboard = lazy(() => import('./WalletDashboard'));
export const GuardianManagement = lazy(() => import('./GuardianManagement'));
export const RecoveryProcess = lazy(() => import('./RecoveryProcess'));
export const TransactionHistory = lazy(() => import('./TransactionHistory'));

export const SettingsPanel = lazy(() => import('./SettingsPanel'));

export const SecuritySettings = lazy(() => import('./SecuritySettings'));
export const BackupRestore = lazy(() => import('./BackupRestore'));

export const AuditLogs = lazy(() => import('./AuditLogs'));

// Lazy load advanced components
export const AdvancedSettings = lazy(() => import('./AdvancedSettings'));
export const HelpDocumentation = lazy(() => import('./HelpDocumentation'));
export const ContactSupport = lazy(() => import('./ContactSupport'));

// Lazy load modal components
export const CreateWalletModal = lazy(() => import('./CreateWalletModal'));
export const AddGuardianModal = lazy(() => import('./AddGuardianModal'));
export const RecoveryModal = lazy(() => import('./RecoveryModal'));
export const TransactionModal = lazy(() => import('./TransactionModal'));
export const ConfirmationModal = lazy(() => import('./ConfirmationModal'));

// Lazy load chart components
export const BalanceChart = lazy(() => import('./BalanceChart'));
export const TransactionChart = lazy(() => import('./TransactionChart'));
export const GuardianStatusChart = lazy(() => import('./GuardianStatusChart'));

// Lazy load form components
export const WalletCreationForm = lazy(() => import('./WalletCreationForm'));

export const GuardianInvitationForm = lazy(() => import('./GuardianInvitationForm'));
export const RecoveryInitiationForm = lazy(() => import('./RecoveryInitiationForm'));
export const TransactionForm = lazy(() => import('./TransactionForm'));
export const ProfileUpdateForm = lazy(() => import('./ProfileUpdateForm'));

// Lazy load utility components
export const QRCodeGenerator = lazy(() => import('./QRCodeGenerator'));
export const AddressValidator = lazy(() => import('./AddressValidator'));
export const PasswordStrengthMeter = lazy(() => import('./PasswordStrengthMeter'));

export const SecurityAuditReport = lazy(() => import('./SecurityAuditReport'));
