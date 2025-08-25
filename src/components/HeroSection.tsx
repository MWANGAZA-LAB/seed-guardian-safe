import { Button } from "@/components/ui/button";
import { Shield, Users, Key, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-bitcoin.jpg";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-subtle relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-bitcoin rounded-full animate-pulse" />
      <div className="absolute top-40 right-20 w-2 h-2 bg-bitcoin/60 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-20 w-4 h-4 bg-bitcoin/40 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-bitcoin" />
              <span className="text-sm font-medium text-muted-foreground">Secure Social Recovery Wallet</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
              Your Bitcoin.
              <br />
              <span className="bg-gradient-hero bg-clip-text text-transparent">Protected Forever.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
              The world's first Bitcoin inheritance wallet with cryptographic social recovery.
              <br />
              Never lose your Bitcoin again, even if you lose your keys.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-card border border-primary/10 rounded-2xl p-6 shadow-card hover:shadow-elegant transition-smooth">
              <Users className="w-12 h-12 text-bitcoin mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Guardian Network</h3>
              <p className="text-muted-foreground text-sm">Trusted family and friends protect your wallet with Shamir's Secret Sharing</p>
            </div>
            <div className="bg-gradient-card border border-primary/10 rounded-2xl p-6 shadow-card hover:shadow-elegant transition-smooth">
              <Key className="w-12 h-12 text-bitcoin mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Social Recovery</h3>
              <p className="text-muted-foreground text-sm">Recover your wallet through guardian consensus, not custodial services</p>
            </div>
            <div className="bg-gradient-card border border-primary/10 rounded-2xl p-6 shadow-card hover:shadow-elegant transition-smooth">
              <Shield className="w-12 h-12 text-bitcoin mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Military Grade Security</h3>
              <p className="text-muted-foreground text-sm">Multi-layer encryption with HSM protection and proof-of-life monitoring</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="lg" className="text-lg px-8 py-4">
              Start Your Wallet
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="premium" size="lg" className="text-lg px-8 py-4">
              View Technical Specs
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-border/50">
            <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-bitcoin" />
                <span className="text-sm font-medium">99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-bitcoin" />
                <span className="text-sm font-medium">Zero Custody</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-bitcoin" />
                <span className="text-sm font-medium">10,000+ Guardians</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;