import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  UserPlus, 
  Key, 
  Shield, 
  Users, 
  CheckCircle,
  ArrowRight,
  Clock,
  Smartphone
} from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      step: "01",
      title: "Create Your Wallet",
      description: "Generate a secure HD wallet with military-grade encryption. Your master key is created and immediately protected.",
      icon: Smartphone,
      details: ["256-bit master seed generation", "BIP44 hierarchical structure", "Device-level encryption"]
    },
    {
      step: "02", 
      title: "Invite Guardians",
      description: "Choose trusted family and friends as guardians. They receive encrypted shares of your wallet recovery key.",
      icon: UserPlus,
      details: ["Shamir's Secret Sharing (3-of-5 threshold)", "Encrypted guardian shares", "Secure invitation system"]
    },
    {
      step: "03",
      title: "Set Recovery Rules", 
      description: "Configure your recovery threshold, proof-of-life settings, and emergency procedures tailored to your needs.",
      icon: Shield,
      details: ["Customizable recovery threshold", "Proof-of-life monitoring", "Grace period configuration"]
    },
    {
      step: "04",
      title: "Guardian Acceptance",
      description: "Guardians verify their identity and accept their role. The system validates all guardian signatures and shares.",
      icon: Users,
      details: ["Multi-factor guardian verification", "Identity document checking", "Secure communication channels"]
    }
  ];

  const recoveryFlow = [
    {
      title: "Recovery Initiated",
      description: "Guardian detects owner is unreachable and initiates recovery process",
      icon: Clock
    },
    {
      title: "Guardian Consensus",
      description: "Required threshold of guardians sign recovery transaction",
      icon: Users
    },
    {
      title: "Key Reconstruction",
      description: "Master key is reconstructed from guardian shares using cryptographic protocols",
      icon: Key
    },
    {
      title: "Wallet Restored",
      description: "New wallet instance created with full access to Bitcoin funds",
      icon: CheckCircle
    }
  ];

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-bitcoin/10 text-bitcoin border-bitcoin/20">
            How It Works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple Setup, Powerful Protection
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get started in minutes with our intuitive setup process. Your Bitcoin will be protected
            by cryptographic social recovery from day one.
          </p>
        </div>

        {/* Setup Steps */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-center mb-12">Wallet Setup Process</h3>
          <div className="grid lg:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="bg-gradient-card border-primary/10 p-8 relative overflow-hidden">
                {/* Step Number */}
                <div className="absolute top-6 right-6 text-6xl font-bold text-bitcoin/10">
                  {step.step}
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center shadow-glow flex-shrink-0">
                    <step.icon className="w-8 h-8 text-foreground" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold mb-3">{step.title}</h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-bitcoin flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recovery Flow */}
        <div className="bg-gradient-card border border-primary/10 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-center mb-12">Recovery Process</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {recoveryFlow.map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-bitcoin/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-bitcoin" />
                </div>
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                
                {/* Arrow between steps */}
                {index < recoveryFlow.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-3 w-6 h-6 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-background/50 rounded-xl border border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              <strong className="text-bitcoin">Security Note:</strong> Recovery requires cryptographic proof from multiple guardians. 
              No single party can access your Bitcoin without consensus.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;