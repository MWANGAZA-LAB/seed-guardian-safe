// Lazy-loaded components for better performance
import { lazy } from 'react';

// Lazy load heavy components
export const WalletDashboard = lazy(() => import('./WalletDashboard'));
export const GuardianManagement = lazy(() => import('./GuardianManagement'));
export const RecoveryProcess = lazy(() => import('./RecoveryProcess'));
export const TransactionHistory = lazy(() => import('./TransactionHistory'));
export const SettingsPanel = lazy(() => import('./SettingsPanel'));
export const SecuritySettings = lazy(() => import('./SecuritySettings'));
export const BackupRestore = lazy(() => import('./BackupRestore'));
export const AuditLogs = lazy(() => import('./AuditLogs'));

// Lazy load UI components that are not immediately needed
export const AdvancedSettings = lazy(() => import('./AdvancedSettings'));
export const HelpDocumentation = lazy(() => import('./HelpDocumentation'));
export const ContactSupport = lazy(() => import('./ContactSupport'));

// Lazy load modals and overlays
export const CreateWalletModal = lazy(() => import('./modals/CreateWalletModal'));
export const AddGuardianModal = lazy(() => import('./modals/AddGuardianModal'));
export const RecoveryModal = lazy(() => import('./modals/RecoveryModal'));
export const TransactionModal = lazy(() => import('./modals/TransactionModal'));
export const ConfirmationModal = lazy(() => import('./modals/ConfirmationModal'));

// Lazy load charts and visualizations
export const BalanceChart = lazy(() => import('./charts/BalanceChart'));
export const TransactionChart = lazy(() => import('./charts/TransactionChart'));
export const GuardianStatusChart = lazy(() => import('./charts/GuardianStatusChart'));

// Lazy load forms
export const WalletCreationForm = lazy(() => import('./forms/WalletCreationForm'));
export const GuardianInvitationForm = lazy(() => import('./forms/GuardianInvitationForm'));
export const RecoveryInitiationForm = lazy(() => import('./forms/RecoveryInitiationForm'));
export const TransactionForm = lazy(() => import('./forms/TransactionForm'));
export const ProfileUpdateForm = lazy(() => import('./forms/ProfileUpdateForm'));

// Lazy load utilities
export const QRCodeGenerator = lazy(() => import('./utilities/QRCodeGenerator'));
export const AddressValidator = lazy(() => import('./utilities/AddressValidator'));
export const PasswordStrengthMeter = lazy(() => import('./utilities/PasswordStrengthMeter'));
export const SecurityAuditReport = lazy(() => import('./utilities/SecurityAuditReport'));
