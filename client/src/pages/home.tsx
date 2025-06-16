import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Transactions completed within 15 minutes"
  },
  {
    icon: Shield,
    title: "100% Secure",
    description: "Bank-level security for all transactions"
  },
  {
    icon: Clock,
    title: "24/7 Available",
    description: "Exchange currency anytime, anywhere"
  }
];

const supportedMethods = [
  "Zaad", "Sahal", "EVC Plus", "eDahab", 
  "Premier Bank", "MoneyGo", "TRC20", "USDC"
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-blue-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center text-white">
            <div className="flex justify-center mb-6">
              <img 
                src="/attached_assets/WhatsApp Image 2025-06-13 at 17.58.11_cbc00289_1749826746862.jpg" 
                alt="Doogle Online" 
                className="h-16 w-16 rounded-2xl shadow-lg"
              />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
              Fast & Secure<br />Currency Exchange
            </h1>
            <p className="text-lg sm:text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Exchange between mobile money, bank transfers, and cryptocurrencies with the best rates
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/exchange">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-50 w-full sm:w-auto">
                  Start Exchange
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/track">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-primary w-full sm:w-auto"
                >
                  Track Order
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Why Choose Doogle Online?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide the fastest, most secure way to exchange your money
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Supported Methods */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Supported Payment Methods
            </h2>
            <p className="text-gray-600">
              Exchange between all major payment platforms
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {supportedMethods.map((method) => (
              <div 
                key={method}
                className="bg-white p-4 rounded-xl text-center shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <span className="font-medium text-gray-700">{method}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Ready to Exchange?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Start your exchange in less than 2 minutes
          </p>
          <Link href="/exchange">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}