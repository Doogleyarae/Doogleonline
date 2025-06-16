import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, LogOut, User, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FirebaseLogin() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Sign in failed:', error);
      if (error.message.includes('Firebase setup required') || error.message.includes('unauthorized-domain')) {
        setAuthError('Firebase setup required. Domain authorization needed for Google Sign-In.');
      } else if (error.message.includes('domain not configured')) {
        setAuthError('Firebase authentication needs to be configured. Please contact administrator.');
      } else {
        setAuthError('Sign in failed. Please try again.');
      }
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setAuthError(null);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      setAuthError('Sign out failed. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Welcome Back!
          </CardTitle>
          <CardDescription>You are signed in with Google</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{user.displayName || 'Google User'}</p>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Mail className="w-3 h-3" />
                {user.email}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Authenticated
            </Badge>
            {user.emailVerified && (
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                Email Verified
              </Badge>
            )}
          </div>
          
          <Button 
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <LogIn className="w-5 h-5" />
          Sign In with Google
        </CardTitle>
        <CardDescription>
          Access your DoogleOnline account securely with Google authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{authError}</p>
            {(authError.includes('Firebase') || authError.includes('domain')) && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-red-700">Firebase needs web app configuration.</p>
                <Link href="/firebase-web-setup" className="inline-block text-xs text-red-700 underline hover:text-red-800">
                  View Web Setup Guide →
                </Link>
              </div>
            )}
          </div>
        )}
        
        <Button 
          onClick={handleSignIn}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </CardContent>
    </Card>
  );
}