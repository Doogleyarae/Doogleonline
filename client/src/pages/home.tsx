import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Shield, TrendingUp } from "lucide-react";

const paymentMethods = [
  { name: "Zaad", type: "Mobile Money" },
  { name: "Sahal", type: "Mobile Money" },
  { name: "EVC Plus", type: "Mobile Money" },
  { name: "eDahab", type: "Mobile Money" },
  { name: "MoneyGo", type: "Digital Wallet" },
  { name: "TRX", type: "Cryptocurrency" },
  { name: "TRC20", type: "Token Standard" },
  { name: "PEB20", type: "Token Standard" },
  { name: "Premier", type: "Bank Transfer" },
];

const features = [
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Transactions completed within 15 minutes",
    bgColor: "bg-blue-100",
    iconColor: "text-primary"
  },
  {
    icon: Shield,
    title: "100% Secure",
    description: "Bank-level security for all transactions",
    bgColor: "bg-green-100",
    iconColor: "text-green-600"
  },
  {
    icon: TrendingUp,
    title: "Best Rates",
    description: "Competitive exchange rates updated live",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img 
                src="/attached_assets/WhatsApp Image 2025-06-13 at 17.58.11_cbc00289_1749826746862.jpg"
                alt="Doogle Online"
                className="h-24 w-24 rounded-full border-4 border-white shadow-lg"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Fast & Secure<br />
              <span className="text-yellow-300">Currency Exchange</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Exchange between Zaad, Sahal, EVC Plus, eDahab, Premier Bank, MoneyGo, and cryptocurrencies with the best rates.
            </p>
            <Link href="/exchange">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4 h-auto">
                Start Exchange
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose DoogleOnline?</h2>
            <p className="text-xl text-gray-600">Trusted by thousands for reliable currency exchange</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow duration-200">
                <CardContent className="pt-6">
                  <div className={`${feature.bgColor} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Supported Currencies */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Supported Payment Methods</h2>
            <p className="text-xl text-gray-600">Wide range of popular payment options</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {paymentMethods.map((method, index) => (
              <Card key={index} className="text-center p-6 shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary mb-2">{method.name}</div>
                  <div className="text-sm text-gray-600">{method.type}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
