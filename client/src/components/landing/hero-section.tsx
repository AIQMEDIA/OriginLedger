import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAuth } from "@/contexts/auth-context";
import originLedgerIcon from "@assets/OriginLedgerIcon_1755629837786.png";
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Users, 
  Globe,
  Package,
  Truck,
  CheckCircle,
  Star
} from "lucide-react";

export function HeroSection() {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Immutable records with cryptographic verification"
    },
    {
      icon: Zap,
      title: "Real-time Tracking",
      description: "Live updates across your entire supply chain"
    },
    {
      icon: Users,
      title: "Multi-stakeholder",
      description: "Seamless collaboration between all participants"
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "Enterprise-ready for worldwide operations"
    }
  ];

  const stats = [
    { label: "Assets Tracked", value: "10M+", icon: Package },
    { label: "Supply Chain Events", value: "50M+", icon: CheckCircle },
    { label: "Global Partners", value: "500+", icon: Users },
    { label: "Countries", value: "25+", icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            {/* Badge */}
            <Badge variant="secondary" className="w-fit bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
              <Star className="h-3 w-3 mr-1" />
              Enterprise Blockchain Platform
            </Badge>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Supply Chain
                <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Transparency
                </span>
                <span className="block text-white">Reimagined</span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                Track every asset, verify every transaction, and ensure complete transparency 
                across your global supply chain with enterprise-grade blockchain technology.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setShowAuthModal(true)}
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg"
                data-testid="button-start-trial"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                data-testid="button-learn-more"
                onClick={() => window.location.href = '/role-demo'}
              >
                See Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-4">Trusted by industry leaders worldwide</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Artwork & Features */}
          <div className="space-y-8">
            {/* Main Artwork */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl"></div>
              <Card className="relative bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="p-8">
                  <img 
                    src={originLedgerIcon} 
                    alt="OriginLedger Platform"
                    className="w-full h-auto max-w-md mx-auto"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="bg-slate-800/30 border-slate-700 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-slate-400">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise Features Section */}
        <div className="py-20">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-blue-500/10 text-blue-300 border-blue-500/20">
              Enterprise Grade
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Built for Global Supply Chains
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              From manufacturers to retailers, track every step of your products' journey 
              with complete transparency and blockchain-verified authenticity.
            </p>
          </div>

          {/* Process Flow */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Package,
                title: "Manufacture",
                description: "Create assets with unique blockchain identities and quality verification"
              },
              {
                icon: Truck,
                title: "Transport",
                description: "Track shipments in real-time with location and condition monitoring"
              },
              {
                icon: CheckCircle,
                title: "Verify",
                description: "Consumers verify authenticity and trace complete product history"
              }
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-cyan-500 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
}