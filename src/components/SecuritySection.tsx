import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Lock, 
  Eye, 
  Server, 
  Smartphone, 
  Globe,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

const SecuritySection = () => {
  const securityLayers = [
    {
      title: "Device Encryption",
      description: "Your private keys never leave your device unencrypted",
      icon: Smartphone,
      strength: 95
    },
    {
      title: "Password Protection", 
      description: "User password adds an additional encryption layer",
      icon: Lock,
      strength: 90
    },
    {
      title: "AWS KMS Integration",
      description: "Hardware Security Modules protect server-side components",
      icon: Server,
      strength: 98
    },
    {
      title: "Network Security",
      description: "End-to-end encryption for all guardian communications",
      icon: Globe,
      strength: 92
    }
  ];

  const securityFeatures = [
    {
      icon: Shield,
      title: "Zero Knowledge Architecture",
      description: "We never have access to your private keys or Bitcoin. Your funds remain under your complete control.",
      status: "Implemented"
    },
    {
      icon: Eye,
      title: "Proof of Life Monitoring", 
      description: "Biometric and behavioral monitoring prevents unauthorized access while you're active.",
      status: "Active"
    },
    {
      icon: Lock,
      title: "Shamir's Secret Sharing",
      description: "Military-grade cryptographic protocol splits your key across multiple trusted guardians.",
      status: "Verified"
    },
    {
      icon: CheckCircle,
      title: "Audit Trail",
      description: "Complete transparency with immutable logs of all wallet and guardian activities.",
      status: "Compliant"
    }
  ];

  const threatProtection = [
    { threat: "Single Point of Failure", protection: "Distributed guardian network", level: "High" },
    { threat: "Unauthorized Access", protection: "Multi-factor authentication", level: "High" },
    { threat: "Key Compromise", protection: "Threshold cryptography", level: "High" },
    { threat: "Social Engineering", protection: "Guardian verification", level: "Medium" },
    { threat: "Physical Device Loss", protection: "Remote recovery capability", level: "High" }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-bitcoin/10 text-bitcoin border-bitcoin/20">
            Security Architecture
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Military-Grade Protection
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your Bitcoin is protected by multiple layers of encryption, cryptographic protocols,
            and advanced security monitoring systems.
          </p>
        </div>

        {/* Security Layers */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-12">Multi-Layer Security Stack</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityLayers.map((layer, index) => (
              <Card key={index} className="bg-gradient-card border-primary/10 p-6 text-center">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <layer.icon className="w-8 h-8 text-foreground" />
                </div>
                <h4 className="font-semibold mb-2">{layer.title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{layer.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Security Strength</span>
                    <span className="text-bitcoin">{layer.strength}%</span>
                  </div>
                  <Progress value={layer.strength} className="h-2" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="bg-gradient-card border-primary/10 p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-bitcoin/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-8 h-8 text-bitcoin" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-xl font-semibold">{feature.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {feature.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Threat Protection Matrix */}
        <Card className="bg-gradient-card border-primary/10 p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">Threat Protection Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 font-semibold">Security Threat</th>
                  <th className="text-left py-3 px-4 font-semibold">Protection Method</th>
                  <th className="text-left py-3 px-4 font-semibold">Protection Level</th>
                </tr>
              </thead>
              <tbody>
                {threatProtection.map((item, index) => (
                  <tr key={index} className="border-b border-border/30">
                    <td className="py-4 px-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      {item.threat}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{item.protection}</td>
                    <td className="py-4 px-4">
                      <Badge 
                        variant={item.level === 'High' ? 'default' : 'secondary'}
                        className={item.level === 'High' ? 'bg-bitcoin text-foreground' : ''}
                      >
                        {item.level}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-background/50 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-bitcoin" />
              <span className="font-semibold">Security Guarantee</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Our security architecture has been audited by leading cybersecurity firms and 
              follows industry best practices for cryptocurrency wallet protection.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default SecuritySection;