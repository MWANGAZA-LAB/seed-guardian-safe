import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Shield, Users, Zap, Github, FileText, Mail } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        {/* Main CTA */}
        <Card className="bg-gradient-card border-primary/20 p-12 text-center mb-16 shadow-elegant">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Secure Your Bitcoin?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of Bitcoin holders who have already protected their digital wealth 
            with our revolutionary social recovery system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button variant="hero" size="lg" className="text-lg px-10 py-6">
              Create Your Wallet
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-10 py-6">
              Schedule Demo
            </Button>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-bitcoin" />
              <span>No Custody Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-bitcoin" />
              <span>Guardian Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-bitcoin" />
              <span>Lightning Ready</span>
            </div>
          </div>
        </Card>

        {/* Developer Resources */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gradient-card border-primary/10 p-8 text-center hover:border-primary/20 transition-smooth">
            <Github className="w-12 h-12 text-bitcoin mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Open Source</h3>
            <p className="text-muted-foreground mb-6">
              Review our code, contribute to development, and build on our platform.
            </p>
            <Button variant="outline" className="w-full">
              View Repository
            </Button>
          </Card>

          <Card className="bg-gradient-card border-primary/10 p-8 text-center hover:border-primary/20 transition-smooth">
            <FileText className="w-12 h-12 text-bitcoin mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Documentation</h3>
            <p className="text-muted-foreground mb-6">
              Complete technical docs, API references, and integration guides.
            </p>
            <Button variant="outline" className="w-full">
              Read Docs
            </Button>
          </Card>

          <Card className="bg-gradient-card border-primary/10 p-8 text-center hover:border-primary/20 transition-smooth">
            <Mail className="w-12 h-12 text-bitcoin mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Enterprise</h3>
            <p className="text-muted-foreground mb-6">
              Custom solutions for institutions and high-net-worth individuals.
            </p>
            <Button variant="outline" className="w-full">
              Contact Sales
            </Button>
          </Card>
        </div>

        {/* Footer Stats */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-bitcoin mb-2">10,000+</div>
              <div className="text-sm text-muted-foreground">Protected Wallets</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-bitcoin mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-bitcoin mb-2">0</div>
              <div className="text-sm text-muted-foreground">Security Breaches</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-bitcoin mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Guardian Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;