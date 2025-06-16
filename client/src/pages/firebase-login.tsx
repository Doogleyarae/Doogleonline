import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function FirebaseLoginPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo/Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">DoogleOnline</h1>
            <p className="text-gray-600">Secure Currency Exchange Platform</p>
          </div>

          {/* Complete Authentication Form */}
          <AuthForm />

          {/* Additional Info */}
          {!user && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Why Sign In?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Track your exchange orders</li>
                  <li>• Access order history</li>
                  <li>• Get personalized support</li>
                  <li>• Secure transaction notifications</li>
                </ul>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>Continue without signing in:</p>
                <Link href="/exchange">
                  <Button variant="link" className="text-xs p-0 h-auto">
                    Start Exchange →
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Success State */}
          {user && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Welcome to DoogleOnline!</h3>
                <p className="text-sm text-green-800">
                  You're now signed in and can access all platform features.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Link href="/exchange">
                  <Button className="w-full">Start Exchange</Button>
                </Link>
                <Link href="/track">
                  <Button variant="outline" className="w-full">Track Order</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center space-y-2">
        <div className="text-xs text-gray-500">
          <p>© 2025 DoogleOnline. Secure by design.</p>
        </div>
        <div className="text-xs">
          <Link href="/firebase-web-setup" className="text-blue-600 hover:underline">
            Having issues with Google Sign-In? View setup guide →
          </Link>
        </div>
      </div>
    </div>
  );
}