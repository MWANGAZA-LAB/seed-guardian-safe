import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Code, Shield, Zap, ExternalLink } from 'lucide-react';
import HelpDocumentation from '@/components/HelpDocumentation';

const Documentation = () => {
  const navigate = useNavigate();

  const documentationSections = [
    {
      title: "Getting Started",
      description: "Learn the basics of Bitcoin inheritance and social recovery",
      icon: BookOpen,
      topics: [
        "What is Bitcoin Inheritance?",
        "Understanding Social Recovery",
        "Setting Up Your First Wallet",
        "Choosing Your Guardians"
      ]
    },
    {
      title: "Technical Documentation",
      description: "Deep dive into the cryptographic protocols and implementation",
      icon: Code,
      topics: [
        "Shamir's Secret Sharing",
        "RSA-OAEP Encryption",
        "AES-GCM Security",
        "Audit Log Protocol"
      ]
    },
    {
      title: "Security Guide",
      description: "Best practices for securing your Bitcoin inheritance",
      icon: Shield,
      topics: [
        "Guardian Selection",
        "Recovery Procedures",
        "Security Monitoring",
        "Emergency Protocols"
      ]
    },
    {
      title: "API Reference",
      description: "Complete API documentation for developers",
      icon: Zap,
      topics: [
        "Protocol Client API",
        "Storage Client API",
        "Authentication",
        "Error Handling"
      ]
    }
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
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold">Documentation</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Introduction */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-6">
              <BookOpen className="w-4 h-4 text-bitcoin" />
              <span className="text-sm font-medium text-muted-foreground">Complete Technical Documentation</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Seed Guardian Safe Documentation
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to understand, implement, and secure your Bitcoin inheritance 
              using our revolutionary social recovery protocol.
            </p>
          </div>

          {/* Documentation Sections */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {documentationSections.map((section, index) => (
              <Card key={index} className="bg-gradient-card border-primary/10 hover:border-primary/20 transition-smooth">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <section.icon className="w-6 h-6 text-bitcoin" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {section.description}
                  </p>
                  <div className="space-y-2">
                    {section.topics.map((topic, topicIndex) => (
                      <div key={topicIndex} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-bitcoin rounded-full" />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" disabled>
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Links */}
          <Card className="bg-gradient-card border-primary/20 mb-12">
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4" disabled>
                  <div className="text-left">
                    <div className="font-medium">GitHub Repository</div>
                    <div className="text-sm text-muted-foreground">View source code</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto" />
                </Button>
                
                <Button variant="outline" className="justify-start h-auto p-4" disabled>
                  <div className="text-left">
                    <div className="font-medium">API Documentation</div>
                    <div className="text-sm text-muted-foreground">Interactive API docs</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto" />
                </Button>
                
                <Button variant="outline" className="justify-start h-auto p-4" disabled>
                  <div className="text-left">
                    <div className="font-medium">Security Audit</div>
                    <div className="text-sm text-muted-foreground">Third-party audit report</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Documentation Component */}
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle>Interactive Help & FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <HelpDocumentation onNavigate={(path) => navigate(path)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
