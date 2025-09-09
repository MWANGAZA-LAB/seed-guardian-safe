import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  ChevronDown,
  ExternalLink,
  Shield,
  Key,
  Users,
  Wallet,
  AlertTriangle,
  Info
} from 'lucide-react';

interface HelpDocumentationProps {
  onNavigate?: (component: string) => void;
}

interface DocumentationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  subsections?: DocumentationSection[];
}

export default function HelpDocumentation({ onNavigate }: HelpDocumentationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));
  const [filteredSections, setFilteredSections] = useState<DocumentationSection[]>([]);

  const documentationSections: DocumentationSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <BookOpen className="h-5 w-5" />,
      content: `# Getting Started with Seed Guardian Safe

Welcome to Seed Guardian Safe, the most secure Bitcoin inheritance and social recovery platform. This guide will help you understand the core concepts and get started with your first wallet.

## What is Seed Guardian Safe?

Seed Guardian Safe is a **trust-first, protocol-style architecture** that provides Bitcoin inheritance and social recovery through:

- **Client-side cryptography** - All sensitive operations happen in your browser
- **Shamir's Secret Sharing** - Your seed is split into multiple shares
- **Guardian-based recovery** - Trusted individuals help you recover access
- **Signed audit logs** - Every action is cryptographically signed and verifiable

## Key Concepts

### Wallets
Your Bitcoin wallet is secured using advanced cryptography and split into multiple shares that are distributed to your guardians.

### Guardians
Trusted individuals who hold encrypted shares of your wallet. They can help you recover access if needed.

### Recovery Process
A secure process that requires approval from a threshold number of guardians to restore wallet access.

### Audit Logs
Cryptographically signed records of all wallet activities, ensuring transparency and security.`,
      subsections: [
        {
          id: 'creating-wallet',
          title: 'Creating Your First Wallet',
          icon: <Wallet className="h-4 w-4" />,
          content: `## Creating Your First Wallet

1. **Click "Create Wallet"** from the main dashboard
2. **Choose a strong password** - This encrypts your wallet data
3. **Set recovery threshold** - How many guardians needed for recovery
4. **Add guardians** - Invite trusted individuals
5. **Verify setup** - Test the recovery process

### Best Practices
- Use a password manager for your master password
- Choose guardians from different life contexts
- Test recovery process before storing significant funds
- Keep guardian contact information updated`
        },
        {
          id: 'guardian-setup',
          title: 'Setting Up Guardians',
          icon: <Users className="h-4 w-4" />,
          content: `## Setting Up Guardians

Guardians are trusted individuals who help secure your Bitcoin inheritance.

### Choosing Guardians
- **Family members** - Spouse, children, siblings
- **Close friends** - Long-term, trustworthy relationships
- **Professional contacts** - Lawyers, accountants, advisors
- **Geographic diversity** - Different locations for redundancy

### Guardian Requirements
- Must have email address and phone number
- Should understand basic technology
- Must be willing to participate in recovery process
- Should be reliable and reachable

### Guardian Responsibilities
- Keep their guardian share secure
- Respond to recovery requests promptly
- Verify their identity during recovery
- Update contact information when needed`
        }
      ]
    },
    {
      id: 'security',
      title: 'Security Features',
      icon: <Shield className="h-5 w-5" />,
      content: `# Security Features

Seed Guardian Safe implements multiple layers of security to protect your Bitcoin inheritance.

## Client-Side Cryptography

All cryptographic operations happen in your browser, ensuring your private keys never leave your device.

### Shamir's Secret Sharing
Your master seed is split into multiple shares using Shamir's Secret Sharing algorithm:
- **Threshold-based recovery** - Only need a subset of shares to recover
- **Information-theoretic security** - Mathematically proven secure
- **No single point of failure** - No single guardian can access your funds

### Encryption Standards
- **AES-256-GCM** - Industry-standard encryption for data at rest
- **RSA-OAEP** - Public key encryption for guardian shares
- **PBKDF2** - Key derivation from passwords
- **SHA-256** - Cryptographic hashing for integrity

## Audit Logging

Every action in your wallet generates a cryptographically signed audit log entry:

### What's Logged
- Wallet creation and modifications
- Guardian additions and removals
- Recovery process initiation and completion
- Transaction creation and signing
- Security setting changes

### Verification
- **Digital signatures** - Each log entry is signed
- **Merkle trees** - Tamper-proof log structure
- **Hash chains** - Sequential integrity verification
- **Public verification** - Anyone can verify log authenticity`,
      subsections: [
        {
          id: 'password-security',
          title: 'Password Security',
          icon: <Key className="h-4 w-4" />,
          content: `## Password Security

Your master password is the foundation of your wallet's security.

### Password Requirements
- **Minimum 8 characters** - Longer is better
- **Mix of character types** - Uppercase, lowercase, numbers, symbols
- **Avoid common patterns** - Don't use dictionary words or personal info
- **Unique password** - Don't reuse passwords from other services

### Password Management
- **Use a password manager** - Generate and store strong passwords
- **Enable two-factor authentication** - Additional security layer
- **Regular updates** - Change passwords periodically
- **Secure storage** - Never write passwords down in plain text

### Recovery Considerations
- **Share with trusted person** - In case of emergency
- **Use secure communication** - Encrypted channels only
- **Document recovery process** - For your beneficiaries`
        }
      ]
    },
    {
      id: 'recovery-process',
      title: 'Recovery Process',
      icon: <Users className="h-5 w-5" />,
      content: `# Recovery Process

The recovery process allows you to regain access to your wallet with the help of your guardians.

## When Recovery is Needed

### Common Scenarios
- **Lost password** - Can't remember master password
- **Device failure** - Computer or phone is damaged/lost
- **Emergency access** - Need immediate access to funds
- **Inheritance** - Beneficiaries need access after your passing

### Recovery Requirements
- **Threshold guardians** - Minimum number of guardian approvals
- **Identity verification** - Guardians must prove their identity
- **Time delays** - Optional waiting periods for security
- **Audit logging** - All recovery attempts are logged

## Recovery Steps

### 1. Initiate Recovery
- **Contact guardians** - Notify them of recovery request
- **Provide reason** - Explain why recovery is needed
- **Set urgency level** - How quickly access is needed

### 2. Guardian Verification
- **Identity confirmation** - Guardians verify their identity
- **Share decryption** - Guardians decrypt their shares
- **Approval process** - Guardians approve the recovery

### 3. Seed Reconstruction
- **Share combination** - Combine guardian shares
- **Master seed recovery** - Reconstruct original seed
- **Wallet restoration** - Restore full wallet access

### 4. Security Measures
- **New password** - Set new master password
- **Guardian review** - Verify guardian list is current
- **Audit verification** - Check for unauthorized access attempts`
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <AlertTriangle className="h-5 w-5" />,
      content: `# Troubleshooting

Common issues and solutions for Seed Guardian Safe.

## Common Problems

### Can't Access Wallet
**Problem**: Forgot password or lost device
**Solution**: 
1. Initiate recovery process
2. Contact your guardians
3. Follow recovery verification steps

### Guardian Not Responding
**Problem**: Guardian doesn't respond to recovery request
**Solution**:
1. Try alternative contact methods
2. Wait for response (check spam folder)
3. Contact other guardians if threshold allows
4. Consider updating guardian list

### Technical Issues
**Problem**: App not working properly
**Solution**:
1. Refresh the page
2. Clear browser cache
3. Try different browser
4. Check internet connection
5. Contact support if problem persists

### Security Concerns
**Problem**: Suspect unauthorized access
**Solution**:
1. Check audit logs immediately
2. Change master password
3. Review guardian list
4. Contact support for investigation
5. Consider creating new wallet if compromised

## Getting Help

### Support Channels
- **Documentation** - Check this help section first
- **Community Forum** - Ask questions to other users
- **Email Support** - Direct contact with support team
- **Emergency Contact** - For urgent security issues

### Before Contacting Support
1. **Check documentation** - Your question might be answered here
2. **Gather information** - Error messages, steps to reproduce
3. **Screenshot issues** - Visual evidence of problems
4. **Check audit logs** - Recent activity that might be relevant`
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      icon: <Info className="h-5 w-5" />,
      content: `# Frequently Asked Questions

## General Questions

### Q: Is Seed Guardian Safe secure?
**A**: Yes, Seed Guardian Safe uses industry-standard cryptography and client-side processing to ensure maximum security. Your private keys never leave your device.

### Q: What happens if I lose my password?
**A**: You can recover access through the guardian recovery process. Your guardians will help you regain access to your wallet.

### Q: Can guardians access my funds?
**A**: No, individual guardians cannot access your funds. They only hold encrypted shares that require the threshold number of guardians to reconstruct your wallet.

### Q: How many guardians do I need?
**A**: We recommend 3-5 guardians with a threshold of 2-3. This provides good security while maintaining accessibility.

## Technical Questions

### Q: What cryptocurrencies are supported?
**A**: Currently, Seed Guardian Safe supports Bitcoin only.

### Q: Can I use this on mobile?
**A**: Yes, Seed Guardian Safe works on mobile browsers. A dedicated mobile app may be released in the future.

### Q: Is my data stored on servers?
**A**: Only encrypted metadata is stored on servers. Your private keys and sensitive data remain on your device.

### Q: Can I export my wallet?
**A**: Yes, you can export encrypted backups of your wallet data for additional security.

## Recovery Questions

### Q: How long does recovery take?
**A**: Recovery typically takes 1-3 days depending on guardian response times and verification requirements.

### Q: What if a guardian is unavailable?
**A**: If you have enough other guardians to meet the threshold, you can proceed with recovery. Consider updating your guardian list.

### Q: Can I change my guardians?
**A**: Yes, you can add or remove guardians at any time. Changes are logged in the audit trail.

### Q: What if I suspect unauthorized access?
**A**: Contact support immediately and check your audit logs. Consider changing your password and reviewing your guardian list.`
    }
  ];

  useEffect(() => {
    filterSections();
  }, [searchTerm]);

  const filterSections = () => {
    if (!searchTerm.trim()) {
      setFilteredSections(documentationSections);
      return;
    }

    const filtered = documentationSections.filter(section => 
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.subsections?.some(sub => 
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    setFilteredSections(filtered);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering - in production, use a proper markdown library
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/^(?!<[h|l])/gim, '<p class="mb-4">')
      .replace(/(<li.*<\/li>)/gim, '<ul class="list-disc ml-6 mb-4">$1</ul>');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Help Documentation
          </h2>
          <p className="text-muted-foreground">
            Comprehensive guide to using Seed Guardian Safe
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documentation Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-3">
                  {section.icon}
                  <CardTitle>{section.title}</CardTitle>
                </div>
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            
            {expandedSections.has(section.id) && (
              <CardContent className="space-y-4">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
                />
                
                {section.subsections && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Subsections</h4>
                    {section.subsections.map((subsection) => (
                      <div key={subsection.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {subsection.icon}
                          <h5 className="font-medium">{subsection.title}</h5>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(subsection.content) }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>
            Common tasks and important information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Video Tutorials
            </Button>
            <Button variant="outline" className="justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Security Best Practices
            </Button>
            <Button variant="outline" className="justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Community Forum
            </Button>
            <Button variant="outline" className="justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              API Documentation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Need More Help?</h4>
              <p className="text-sm text-blue-700 mt-1">
                If you can't find what you're looking for, our support team is here to help.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => onNavigate?.('ContactSupport')}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
