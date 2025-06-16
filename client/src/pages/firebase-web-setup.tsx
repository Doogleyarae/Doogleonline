import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function FirebaseWebSetup() {
  const currentDomain = window.location.origin;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Firebase Web App Setup Guide
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Configure your Firebase project for web authentication
            </p>
          </div>

          <div className="space-y-6">
            {/* Current Domain Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Current domain: <strong>{currentDomain}</strong>
                <br />
                This domain needs to be added to Firebase authorized domains.
              </AlertDescription>
            </Alert>

            {/* Step 1: Add Web App */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Add Web App to Firebase Project
                </CardTitle>
                <CardDescription>
                  Create a web app configuration in your Firebase Console
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Console</a></li>
                  <li>Select your project: <strong>doogle-e-money</strong></li>
                  <li>Click on "Project Overview" → "Add app" → Web icon (&lt;/&gt;)</li>
                  <li>Enter app nickname: <strong>DoogleOnline Web</strong></li>
                  <li>Check "Also set up Firebase Hosting" (optional)</li>
                  <li>Click "Register app"</li>
                </ol>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    After registration, you'll see the Firebase configuration object with your API keys.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 2: Authorize Domain */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Authorize Domain for Google Sign-In
                </CardTitle>
                <CardDescription>
                  Add your Replit domain to Firebase authorized domains
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>In Firebase Console, go to <strong>Authentication</strong> → <strong>Settings</strong></li>
                  <li>Scroll down to <strong>Authorized domains</strong></li>
                  <li>Click <strong>Add domain</strong></li>
                  <li>Add this domain:
                    <div className="flex items-center gap-2 mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      <code className="flex-1">{currentDomain.replace('https://', '').replace('http://', '')}</code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(currentDomain.replace('https://', '').replace('http://', ''))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                  <li>Click <strong>Add</strong></li>
                </ol>
              </CardContent>
            </Card>

            {/* Step 3: Enable Google Sign-In */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Enable Google Authentication
                </CardTitle>
                <CardDescription>
                  Configure Google as a sign-in provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>In Firebase Console, go to <strong>Authentication</strong> → <strong>Sign-in method</strong></li>
                  <li>Find <strong>Google</strong> in the providers list</li>
                  <li>Click on Google to configure it</li>
                  <li>Toggle <strong>Enable</strong></li>
                  <li>Add your project support email</li>
                  <li>Click <strong>Save</strong></li>
                </ol>
              </CardContent>
            </Card>

            {/* Step 4: Configuration Values */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                  Get Configuration Values
                </CardTitle>
                <CardDescription>
                  Copy the Firebase configuration for your web app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  After creating the web app, you'll see a configuration object like this:
                </p>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <pre className="text-xs overflow-x-auto">
{`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "doogle-e-money.firebaseapp.com",
  projectId: "doogle-e-money",
  storageBucket: "doogle-e-money.firebasestorage.app",
  messagingSenderId: "478312672914",
  appId: "1:478312672914:web:...",
  measurementId: "G-..."
};`}
                  </pre>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to provide the <strong>apiKey</strong> and <strong>appId</strong> values to complete the setup.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6">
              <Link href="/login">
                <Button variant="outline">
                  ← Back to Login
                </Button>
              </Link>
              
              <a 
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  Open Firebase Console
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}