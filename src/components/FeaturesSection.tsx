import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Key, 
  Zap, 
  FileText, 
  Eye,
  Lock,
  Smartphone,
  Globe
} from "lucide-react";
import guardiansImage from "@/assets/guardians-icon.jpg";
import securityImage from "@/assets/security-crypto.jpg";

const FeaturesSection = () => {
  const features = [
    {
      icon: Users,
      title: "Guardian Network",
      description: "Invite trusted family and friends to be your wallet guardians. They receive encrypted shares of your master key.",
      image: guardiansImage,
      badge: "Social Recovery"
    },
    {
      icon: Key,
      title: "Shamir's Secret Sharing",
      description: "Your private key is split into encrypted shares. Only a threshold of guardians can reconstruct your wallet.",
      image: securityImage,
      badge: "Cryptographic"
    },
    {
      icon: Shield,
      title: "Multi-Layer Security",
      description: "Device encryption, user passwords, and AWS KMS create an impenetrable security fortress for your Bitcoin.",
      badge: "Military Grade"
    },
    {
      icon: Eye,
      title: "Proof of Life",
      description: "Biometric, location, and manual check-ins prevent unauthorized recovery attempts and ensure wallet safety.",
      badge: "AI Monitoring"
    },
    {
      icon: Zap,
      title: "Lightning Integration",
      description: "Full Lightning Network support for instant payments while maintaining the same inheritance protection.",
      badge: "Instant Payments"
    },
    {
      icon: FileText,
      title: "Legal Integration",
      description: "Generate legal documents and integrate with estate planning services for complete inheritance protection.",
      badge: "Legal Compliance"
    }
  ];

  const technicalFeatures = [
    { icon: Lock, title: "HD Wallet (BIP44)", description: "Hierarchical deterministic wallet structure" },
    { icon: Smartphone, title: "Mobile First", description: "Native iOS and Android applications" },
    { icon: Globe, title: "Multi-Platform", description: "Web, mobile, and guardian portals" }
  ];

  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-bitcoin/10 text-bitcoin border-bitcoin/20">
            Advanced Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Revolutionary Bitcoin Protection
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Combining cutting-edge cryptography with social networks to create the most secure
            and recoverable Bitcoin wallet ever built.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gradient-card border-primary/10 p-8 hover:border-primary/20 transition-smooth">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center shadow-glow">
                    <feature.icon className="w-8 h-8 text-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  {feature.image && (
                    <div className="rounded-lg overflow-hidden border border-border/50">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-32 object-cover opacity-80"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Technical Features */}
        <div className="bg-gradient-card border border-primary/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">Technical Excellence</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {technicalFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-bitcoin/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-bitcoin" />
                </div>
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;