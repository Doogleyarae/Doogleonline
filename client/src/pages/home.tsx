import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Shield, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import SimpleLanguageSwitcher from "@/components/simple-language-switcher";
import HomeFeatureGrid from "@/components/home-feature-grid";
import Logo from "../assets/doogle-logo.png";
import { Helmet } from "react-helmet-async";

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
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Doogle Online - Fast & Secure Currency Exchange</title>
        <meta name="description" content="Exchange between Zaad, Sahal, EVC Plus, eDahab, Premier Bank, MoneyGo, and cryptocurrencies with the best rates. Fast, secure, and reliable currency exchange platform." />
        <meta name="keywords" content="currency exchange, Zaad, Sahal, EVC Plus, eDahab, Premier Bank, MoneyGo, TRX, TRC20, PEB20, crypto, secure, fast, best rates, Doogle Online" />
        <meta property="og:title" content="Doogle Online - Fast & Secure Currency Exchange" />
        <meta property="og:description" content="Exchange between Zaad, Sahal, EVC Plus, eDahab, Premier Bank, MoneyGo, and cryptocurrencies with the best rates." />
        <meta property="og:image" content="/src/assets/doogle-logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://doogleonline.com/" />
        <link rel="canonical" href="https://doogleonline.com/" />
      </Helmet>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img 
                src={Logo}
                alt="Doogle Online Logo"
                className="h-24 w-24 object-contain border-4 border-white shadow-lg"
              />
            </div>
            <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold mb-6">
              {t("exchange")}<br />
              <span className="text-yellow-200">{t("exchange")}</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Exchange between Zaad, Sahal, EVC Plus, eDahab, Premier Bank, MoneyGo, and cryptocurrencies with the best rates.
            </p>
            <div className="space-y-4">
              <Link href="/exchange">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4 h-auto" aria-label="Start currency exchange">
                  {t("exchange")}
                </Button>
              </Link>
              <div className="flex justify-center">
                <SimpleLanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section aria-labelledby="features-heading">
        <HomeFeatureGrid />
      </section>

      {/* Supported Currencies */}
      <section className="py-16 bg-gray-50" aria-labelledby="payment-methods-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="payment-methods-heading" className="text-3xl font-bold text-gray-900 mb-4">Supported Payment Methods</h2>
            <p className="text-xl text-gray-600">Wide range of popular payment options</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6" role="list" aria-label="Supported payment methods">
            {paymentMethods.map((method, index) => (
              <Card key={index} className="text-center p-6 shadow-sm" role="listitem">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary mb-2">{method.name}</div>
                  <div className="text-sm text-gray-600">{method.type}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
