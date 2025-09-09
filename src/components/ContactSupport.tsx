import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Send, 
  Mail, 
  Phone, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface ContactSupportProps {
  onNavigate?: (component: string) => void;
}

interface SupportForm {
  name: string;
  email: string;
  subject: string;
  category: 'technical' | 'security' | 'billing' | 'general' | 'bug-report' | 'feature-request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  walletId?: string;
  includeLogs: boolean;
}

interface SupportTicket {
  id: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  lastUpdated: string;
  subject: string;
  category: string;
  priority: string;
}

export default function ContactSupport({ onNavigate }: ContactSupportProps) {
  useProtocol();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [form, setForm] = useState<SupportForm>({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
    walletId: '',
    includeLogs: false
  });

  const [errors, setErrors] = useState<Partial<SupportForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<SupportForm> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!form.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (form.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Submit support ticket
      const ticketId = await submitSupportTicket(form);
      
      setIsSubmitted(true);
      
      toast({
        title: "Support Ticket Submitted",
        description: `Your ticket #${ticketId} has been submitted successfully`,
      });

      // Reset form
      setForm({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        priority: 'medium',
        message: '',
        walletId: '',
        includeLogs: false
      });

    } catch (err) {
      logger.error('Failed to submit support ticket', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSupportTicket = async (_formData: SupportForm): Promise<string> => {
    // Mock implementation - would integrate with support system
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `SUP-${Date.now()}`;
  };


  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Support Ticket Submitted</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for contacting us. We'll get back to you within 24 hours.
          </p>
          <div className="space-y-2">
            <Button onClick={() => setIsSubmitted(false)}>
              Submit Another Ticket
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('HelpDocumentation')}>
              View Help Documentation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Contact Support
          </h2>
          <p className="text-muted-foreground">
            Get help from our support team
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">support@seedguardian.safe</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium">Response Time</p>
                <p className="text-sm text-muted-foreground">Within 24 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Support Ticket</CardTitle>
          <CardDescription>
            Please provide as much detail as possible to help us assist you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter your email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Brief description of your issue"
              className={errors.subject ? 'border-red-500' : ''}
            />
            {errors.subject && <p className="text-sm text-red-500 mt-1">{errors.subject}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as 'technical' | 'security' | 'billing' | 'general' | 'bug-report' | 'feature-request' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Issue</option>
                <option value="security">Security Concern</option>
                <option value="billing">Billing Question</option>
                <option value="bug-report">Bug Report</option>
                <option value="feature-request">Feature Request</option>
              </select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="walletId">Wallet ID (Optional)</Label>
            <Input
              id="walletId"
              value={form.walletId}
              onChange={(e) => setForm({ ...form, walletId: e.target.value })}
              placeholder="Enter wallet ID if relevant to your issue"
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Please describe your issue in detail..."
              rows={6}
              className={errors.message ? 'border-red-500' : ''}
            />
            {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeLogs"
              checked={form.includeLogs}
              onChange={(e) => setForm({ ...form, includeLogs: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="includeLogs" className="text-sm">
              Include diagnostic logs (recommended for technical issues)
            </Label>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Before You Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Check our <Button variant="link" className="p-0 h-auto" onClick={() => onNavigate?.('HelpDocumentation')}>Help Documentation</Button></li>
              <li>• Search for similar issues in our knowledge base</li>
              <li>• Try refreshing the page or clearing your browser cache</li>
              <li>• Ensure you're using a supported browser</li>
              <li>• Check your internet connection</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Additional Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Community Forum
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Video Tutorials
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Security Best Practices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contact */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Security Emergency</h4>
              <p className="text-sm text-red-700 mt-1">
                If you suspect unauthorized access to your wallet or have a security concern, 
                contact us immediately at security@seedguardian.safe or call our emergency line.
              </p>
              <div className="flex gap-2 mt-3">
                <Button variant="destructive" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency Line
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Security Email
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
