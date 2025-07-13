import { Card, CardContent } from "@/components/ui/card";
import { Zap, Shield, TrendingUp } from "lucide-react";

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

export default function HomeFeatureGrid() {
  return (
    <div className="w-full">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose DoogleOnline?</h2>
        <p className="text-xl text-gray-600">Trusted by thousands for reliable currency exchange</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className={`${feature.bgColor} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 