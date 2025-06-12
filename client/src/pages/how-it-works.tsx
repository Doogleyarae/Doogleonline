import { ArrowRight, CheckCircle, CreditCard, Send, Shield, Clock, Users, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Choose Your Exchange",
      description: "Select the currency you want to send and the currency you want to receive from our supported payment methods.",
      icon: CreditCard,
      details: [
        "11+ payment methods supported",
        "Real-time exchange rates",
        "Transparent fee structure",
        "Instant rate calculation"
      ]
    },
    {
      number: "02", 
      title: "Enter Transaction Details",
      description: "Provide the amount you want to exchange and recipient information for a secure transaction.",
      icon: Send,
      details: [
        "Minimum $5 exchange amount",
        "Secure data encryption",
        "Recipient verification",
        "Amount confirmation"
      ]
    },
    {
      number: "03",
      title: "Verify & Confirm",
      description: "Review your transaction details, verify the exchange rate, and confirm your order.",
      icon: Shield,
      details: [
        "Order summary review",
        "Rate lock guarantee",
        "Security verification",
        "Final confirmation"
      ]
    },
    {
      number: "04",
      title: "Track Your Order",
      description: "Monitor your transaction status in real-time with our advanced tracking system.",
      icon: Clock,
      details: [
        "Real-time status updates",
        "Email notifications",
        "Order ID tracking",
        "Completion confirmation"
      ]
    }
  ];

  const features = [
    {
      title: "Instant Processing",
      description: "Most transactions completed within 5-15 minutes",
      icon: Clock
    },
    {
      title: "Secure Platform",
      description: "Bank-level security with SSL encryption",
      icon: Shield
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock customer assistance",
      icon: Users
    },
    {
      title: "Best Rates",
      description: "Competitive exchange rates with low fees",
      icon: Star
    }
  ];

  const paymentMethods = [
    { name: "Zaad", type: "Mobile Money", color: "bg-green-500" },
    { name: "Sahal", type: "Mobile Money", color: "bg-blue-500" },
    { name: "EVC Plus", type: "Mobile Money", color: "bg-purple-500" },
    { name: "eDahab", type: "Mobile Money", color: "bg-orange-500" },
    { name: "Premier Bank", type: "Banking", color: "bg-red-500" },
    { name: "MoneyGo", type: "Digital Wallet", color: "bg-indigo-500" },
    { name: "TRX", type: "Cryptocurrency", color: "bg-yellow-500" },
    { name: "TRC20", type: "Cryptocurrency", color: "bg-teal-500" },
    { name: "PEB20", type: "Cryptocurrency", color: "bg-pink-500" },
    { name: "USDC", type: "Cryptocurrency", color: "bg-cyan-500" }
  ];

  const testimonials = [
    {
      name: "Sarah Ahmed",
      role: "Small Business Owner",
      comment: "DoogleOnline has made international payments so much easier for my business. Fast and reliable!",
      rating: 5
    },
    {
      name: "Mohamed Hassan",
      role: "Freelancer",
      comment: "The best exchange rates I've found. The process is simple and customer support is excellent.",
      rating: 5
    },
    {
      name: "Fatima Al-Rashid",
      role: "Student",
      comment: "Perfect for sending money to family abroad. Quick processing and transparent fees.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            How <span className="text-primary">DoogleOnline</span> Works
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Exchange currencies and send money worldwide in just 4 simple steps. 
            Fast, secure, and transparent transactions every time.
          </p>
        </div>

        {/* Steps Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Simple 4-Step Process
          </h2>
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div key={index} className={`flex flex-col lg:flex-row items-center gap-8 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  <div className="lg:w-1/2">
                    <Card className="hover:shadow-xl transition-shadow border-2 border-primary/20">
                      <CardHeader>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                            {step.number}
                          </div>
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">{step.title}</CardTitle>
                        <CardDescription className="text-lg">
                          {step.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-gray-600 dark:text-gray-400">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="lg:w-1/2 flex justify-center">
                    <div className="w-80 h-60 bg-gradient-to-br from-primary/20 to-blue-200 dark:from-primary/30 dark:to-blue-800 rounded-2xl flex items-center justify-center">
                      <Icon className="h-24 w-24 text-primary" />
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="flex lg:hidden justify-center my-8">
                      <ArrowRight className="h-8 w-8 text-primary rotate-90 lg:rotate-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Supported Payment Methods
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {paymentMethods.map((method, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 ${method.color} rounded-full mx-auto mb-3 flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">
                      {method.name.substring(0, 2)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{method.name}</h3>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {method.type}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose Our Platform?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            What Our Customers Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <Badge variant="outline">{testimonial.role}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 italic">
                    "{testimonial.comment}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-primary text-white border-none">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-3xl font-bold mb-4">Ready to Start Exchanging?</h3>
              <p className="text-xl mb-6 opacity-90">
                Join thousands of users who trust DoogleOnline for fast and secure currency exchange.
              </p>
              <div className="space-x-4">
                <Button asChild size="lg" variant="secondary">
                  <a href="/exchange">Start Exchange Now</a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  <a href="/track-order">Track Your Order</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}