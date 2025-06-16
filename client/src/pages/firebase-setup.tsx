import { Link } from "wouter";
import { ArrowLeft, CheckCircle, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function FirebaseSetupPage() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  
  const currentDomain = window.location.origin;
  
  const copyToClipboard = (text: string, stepNumber: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepNumber);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const setupSteps = [
    {
      title: "Access Firebase Console",
      description: "Go to the Firebase Console and select your project",
      action: "Visit Firebase Console",
      link: "https://console.firebase.google.com/project/doogle-e-money",
      status: "pending"
    },
    {
      title: "Add Web Application",
      description: "Click 'Add app' and select the Web platform (</>) icon",
      details: "Register your app with nickname: 'DoogleOnline Web'",
      status: "pending"
    },
    {
      title: "Get Web App Configuration",
      description: "Copy the config object from Firebase Console",
      details: "You'll need the apiKey, authDomain, projectId, and appId values",
      status: "pending"
    },
    {
      title: "Enable Google Authentication",
      description: "Go to Authentication > Sign-in method > Google",
      action: "Enable Google Sign-in",
      status: "pending"
    },
    {
      title: "Add Authorized Domain",
      description: "Add your Replit domain to authorized domains",
      copyText: currentDomain,
      details: `Add this domain: ${currentDomain}`,
      status: "pending"
    },
    {
      title: "Update Environment Variables",
      description: "Add the Firebase credentials to your Replit secrets",
      details: "VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID, VITE_FIREBASE_PROJECT_ID",
      status: "pending"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <Link href="/login">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Title */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Firebase Setup Guide</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete these steps to enable Google Sign-In authentication for DoogleOnline
          </p>
          <Badge variant="outline" className="text-orange-700 border-orange-300">
            Configuration Required
          </Badge>
        </div>

        {/* Current Status */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Current Status</CardTitle>
            <CardDescription className="text-orange-800">
              Firebase authentication is installed but needs domain authorization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-orange-800">
              <p><strong>Project ID:</strong> doogle-e-money</p>
              <p><strong>Current Domain:</strong> {currentDomain}</p>
              <p><strong>Error:</strong> auth/unauthorized-domain</p>
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Setup Steps</h2>
          
          {setupSteps.map((step, index) => (
            <Card key={index} className="border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {step.details && (
                  <p className="text-sm text-gray-600">{step.details}</p>
                )}
                
                <div className="flex gap-2">
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        {step.action}
                      </Button>
                    </a>
                  )}
                  
                  {step.copyText && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => copyToClipboard(step.copyText!, index)}
                    >
                      <Copy className="w-4 h-4" />
                      {copiedStep === index ? 'Copied!' : 'Copy Domain'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success State */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              After Setup Complete
            </CardTitle>
            <CardDescription className="text-green-800">
              Once configured, users will be able to:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-green-800">
              <li>• Sign in with their Google account</li>
              <li>• Access personalized order tracking</li>
              <li>• Receive secure notifications</li>
              <li>• Maintain order history</li>
            </ul>
            
            <div className="mt-4 pt-4 border-t border-green-200">
              <Link href="/login">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Test Authentication After Setup
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Technical Info */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
            <CardDescription>
              For developers and administrators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium">Environment Variables</h4>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>VITE_FIREBASE_API_KEY</li>
                  <li>VITE_FIREBASE_APP_ID</li>
                  <li>VITE_FIREBASE_PROJECT_ID</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Authentication Features</h4>
                <ul className="text-gray-600 mt-1 space-y-1">
                  <li>Google OAuth 2.0</li>
                  <li>Redirect-based flow</li>
                  <li>Persistent sessions</li>
                  <li>Secure token management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}