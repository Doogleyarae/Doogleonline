import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  Settings, 
  Globe, 
  Shield,
  AlertTriangle
} from 'lucide-react';

export default function FirebaseWebSetup() {
  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const currentDomain = window.location.origin;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Firebase Web App Setup
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Complete these steps to enable Google Sign-In for your DoogleOnline platform.
              Your Firebase project exists, but needs web app configuration.
            </p>
          </div>
        </div>

        {/* Current Status */}
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Current Status:</strong> Your Firebase project "doogle-e-money" exists with Android configuration. 
            Web app setup is needed for Google Sign-In to work in browsers.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* Step 1: Add Web App */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Step 1: Add Web App to Firebase
              </CardTitle>
              <CardDescription>
                Add a web application to your existing Firebase project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">Project Details:</p>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>• Project ID: <code className="bg-white px-1 rounded">doogle-e-money</code></p>
                  <p>• Project Number: <code className="bg-white px-1 rounded">478312672914</code></p>
                </div>
              </div>
              
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Go to{' '}
                  <a 
                    href="https://console.firebase.google.com/project/doogle-e-money" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Firebase Console
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Click the <strong>"Add app"</strong> button in the project overview</li>
                <li>Select the <strong>Web platform</strong> (web icon)</li>
                <li>Enter app nickname: <code className="bg-gray-100 px-1 rounded">DoogleOnline Web</code></li>
                <li>Click <strong>"Register app"</strong></li>
              </ol>
            </CardContent>
          </Card>

          {/* Step 2: Get Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Step 2: Copy Web App Configuration
              </CardTitle>
              <CardDescription>
                Get the configuration values for your web app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">After registering your web app, you'll see a configuration screen. Copy these values:</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <code className="text-sm font-mono">apiKey</code>
                    <p className="text-xs text-gray-600">Firebase API Key</p>
                  </div>
                  <Badge variant="outline">Required</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <code className="text-sm font-mono">appId</code>
                    <p className="text-xs text-gray-600">Web App ID (starts with 1:478312672914:web:)</p>
                  </div>
                  <Badge variant="outline">Required</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <code className="text-sm font-mono">projectId</code>
                    <p className="text-xs text-green-700">Already configured: doogle-e-money</p>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Enable Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Step 3: Enable Google Authentication
              </CardTitle>
              <CardDescription>
                Configure Google Sign-In in Firebase Authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>In Firebase Console, go to <strong>Authentication</strong> → <strong>Sign-in method</strong></li>
                <li>Click on <strong>Google</strong> provider</li>
                <li>Toggle <strong>"Enable"</strong> switch</li>
                <li>Set support email (your email address)</li>
                <li>Click <strong>"Save"</strong></li>
              </ol>
            </CardContent>
          </Card>

          {/* Step 4: Authorize Domain */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Step 4: Authorize Your Domain
              </CardTitle>
              <CardDescription>
                Add your website domain to authorized domains list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-2">Current Domain:</p>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded text-sm">{currentDomain}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(currentDomain, 'domain')}
                    className="h-7"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedText === 'domain' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>In Firebase Console, go to <strong>Authentication</strong> → <strong>Settings</strong></li>
                <li>Scroll to <strong>"Authorized domains"</strong> section</li>
                <li>Click <strong>"Add domain"</strong></li>
                <li>Paste your domain: <code className="bg-gray-100 px-1 rounded">{currentDomain}</code></li>
                <li>Click <strong>"Add"</strong></li>
              </ol>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> After deployment, you'll also need to add your production domain 
                  (ending in .replit.app) to this list.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 5: Provide Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Step 5: Configure Application
              </CardTitle>
              <CardDescription>
                Provide the Firebase credentials to enable Google Sign-In
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Once you have the configuration values from Step 2, you'll need to provide them as environment variables:
              </p>
              
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  <div>VITE_FIREBASE_API_KEY=your_api_key_here</div>
                  <div>VITE_FIREBASE_APP_ID=your_app_id_here</div>
                  <div className="text-green-600">VITE_FIREBASE_PROJECT_ID=doogle-e-money ✓</div>
                </div>
              </div>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  After completing all steps and providing the credentials, Google Sign-In will work alongside 
                  email/password authentication.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/login">
            <Button>
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}