import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Users, Key } from 'lucide-react';
import WalletCreationForm from '@/components/WalletCreationForm';
import { toast } from '@/hooks/use-toast';

const CreateWallet = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleWalletCreation = async (formData: Record<string, unknown>) => {
    setIsCreating(true);
    try {
      // Simulate wallet creation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Wallet Created Successfully!",
        description: "Your Bitcoin inheritance wallet is now protected with social recovery.",
        variant: "default",
      });
      
      // Navigate to wallet dashboard
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Wallet Creation Failed",
        description: "There was an error creating your wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

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
            <h1 className="text-xl font-semibold">Create Your Bitcoin Inheritance Wallet</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-bitcoin" />
              <span className="text-sm font-medium text-muted-foreground">Secure Social Recovery</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Protect Your Bitcoin Forever
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create a secure Bitcoin inheritance wallet with cryptographic social recovery. 
              Your Bitcoin will be protected even if you lose your keys.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-gradient-card border-primary/10">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-bitcoin mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Guardian Network</h3>
                <p className="text-muted-foreground text-sm">
                  Choose trusted family and friends to protect your wallet using Shamir's Secret Sharing
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-primary/10">
              <CardContent className="p-6 text-center">
                <Key className="w-12 h-12 text-bitcoin mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Social Recovery</h3>
                <p className="text-muted-foreground text-sm">
                  Recover your wallet through guardian consensus, no custodial services required
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-primary/10">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-bitcoin mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Military Grade Security</h3>
                <p className="text-muted-foreground text-sm">
                  Multi-layer encryption with HSM protection and proof-of-life monitoring
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Creation Form */}
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Create Your Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <WalletCreationForm
                onSubmit={handleWalletCreation}
                onCancel={handleCancel}
                isLoading={isCreating}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateWallet;
