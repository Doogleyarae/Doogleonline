import { ArrowRight, CheckCircle, CreditCard, Globe, Shield, Clock, Users, DollarSign, Smartphone, Banknote, Bitcoin, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Services() {
  const mainServices = [
    {
      title: "Currency Exchange",
      description: "Exchange between multiple currencies with competitive rates and low fees.",
      icon: DollarSign,
      features: [
        "Real-time exchange rates",
        "11+ payment methods",
        "Competitive fees",
        "Instant rate calculation"
      ],
      popular: true
    },
    {
      title: "International Money Transfer", 
      description: "Send money across borders quickly and securely to family and friends.",
      icon: Globe,
      features: [
        "Fast international transfers",
        "Multiple receiving options",
        "Track your transfer",
        "Email notifications"
      ],
      popular: false
    },
    {
      title: "Mobile Money Services",
      description: "Connect with major mobile money providers for seamless transactions.",
      icon: Smartphone,
      features: [
        "Zaad integration",
        "Sahal support",
        "EVC Plus connectivity",
        "eDahab transactions"
      ],
      popular: true
    },
    {
      title: "Banking Solutions",
      description: "Traditional banking services integrated with modern digital platforms.",
      icon: Banknote,
      features: [
        "Premier Bank support",
        "Secure bank transfers",
        "Account verification",
        "Transaction history"
      ],
      popular: false
    },
    {
      title: "Cryptocurrency Exchange",
      description: "Trade popular cryptocurrencies with secure blockchain technology.",
      icon: Bitcoin,
      features: [
        "TRX trading",
        "TRC20 token support",
        "PEB20 compatibility",
        "USDC transactions"
      ],
      popular: true
    },
    {
      title: "Digital Wallet Services",
      description: "Modern digital payment solutions for the connected world.",
      icon: Zap,
      features: [
        "MoneyGo integration",
        "Instant payments",
        "QR code support",
        "Mobile app ready"
      ],
      popular: false
    }
  ];

  const paymentCategories = [
    {
      category: "Mobile Money",
      description: "Leading mobile payment solutions across Africa",
      methods: [
        { name: "Zaad", description: "Somalia's leading mobile money service", users: "2M+ users" },
        { name: "Sahal", description: "Reliable mobile payment platform", users: "1.5M+ users" },
        { name: "EVC Plus", description: "Enhanced mobile money features", users: "1M+ users" },
        { name: "eDahab", description: "Secure mobile transactions", users: "800K+ users" }
      ],
      color: "from-green-500 to-emerald-600"
    },
    {
      category: "Banking",
      description: "Traditional banking integrated with digital innovation",
      methods: [
        { name: "Premier Bank", description: "Full-service banking solutions", users: "500K+ users" }
      ],
      color: "from-blue-500 to-blue-600"
    }
  ];

  const businessSolutions = [
    {
      title: "Business Accounts",
      description: "Dedicated business solutions with bulk processing and API access",
      features: ["Volume discounts", "API integration", "Bulk transactions", "Priority support"]
    },
    {
      title: "Developer API",
      description: "Integrate our exchange services into your own applications",
      features: ["RESTful API", "Real-time rates", "Webhook support", "Comprehensive docs"]
    },
    {
      title: "White Label Solutions",
      description: "Launch your own exchange platform with our technology",
      features: ["Custom branding", "Full customization", "Technical support", "Revenue sharing"]
    }
  ];

  const pricingTiers = [
    {
      name: "Individual",
      description: "Perfect for personal use",
      features: [
        "Standard exchange rates",
        "24/7 customer support",
        "Mobile app access",
        "Email notifications"
      ],
      fee: "1.5%",
      popular: false
    },
    {
      name: "Premium",
      description: "For frequent users",
      features: [
        "Reduced exchange rates",
        "Priority customer support",
        "Advanced tracking",
        "Dedicated account manager"
      ],
      fee: "1.0%",
      popular: true
    },
    {
      name: "Business",
      description: "For businesses and high volume",
      features: [
        "Lowest exchange rates",
        "API access",
        "Bulk processing",
        "Custom solutions"
      ],
      fee: "0.5%",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Our <span className="text-primary">Services</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Comprehensive currency exchange and money transfer services designed to meet 
            all your financial needs with security, speed, and reliability.
          </p>
        </div>

        {/* Main Services Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Core Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className={`hover:shadow-xl transition-all duration-300 ${service.popular ? 'ring-2 ring-primary ring-opacity-50' : ''} relative`}>
                  {service.popular && (
                    <Badge className="absolute -top-2 left-4 bg-primary">Popular</Badge>
                  )}
                  <CardHeader>
                    <Icon className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                    <CardDescription className="text-base">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-6" variant={service.popular ? "default" : "outline"}>
                      Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Methods by Category */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Payment Methods
          </h2>
          <div className="space-y-8">
            {paymentCategories.map((category, index) => (
              <Card key={index} className="overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${category.color}`}></div>
                <CardHeader>
                  <CardTitle className="text-2xl">{category.category}</CardTitle>
                  <CardDescription className="text-lg">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {category.methods.map((method, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {method.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {method.description}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {method.users}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Solutions */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Business Solutions
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {businessSolutions.map((solution, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{solution.title}</CardTitle>
                  <CardDescription className="text-base">
                    {solution.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {solution.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`text-center hover:shadow-xl transition-all duration-300 ${tier.popular ? 'ring-2 ring-primary scale-105' : ''} relative`}>
                {tier.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription className="text-base mb-4">
                    {tier.description}
                  </CardDescription>
                  <div className="text-4xl font-bold text-primary">
                    {tier.fee}
                    <span className="text-lg text-gray-500"> fee</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Features */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/20 border-none">
            <CardHeader className="text-center">
              <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-3xl mb-4">Security First</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
                Your security is our top priority. We employ bank-level security measures, 
                including 256-bit SSL encryption, two-factor authentication, and regulatory 
                compliance to protect your transactions and personal information.
              </p>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">SSL Encryption</h4>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">KYC Compliance</h4>
                </div>
                <div className="text-center">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">24/7 Monitoring</h4>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">Fraud Protection</h4>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-primary text-white border-none">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-3xl font-bold mb-4">Ready to Experience Our Services?</h3>
              <p className="text-xl mb-6 opacity-90">
                Start with a simple exchange or explore our advanced business solutions.
              </p>
              <div className="space-x-4">
                <Button asChild size="lg" variant="secondary">
                  <a href="/exchange">Start Exchange</a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  <a href="/contact">Contact Sales</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}