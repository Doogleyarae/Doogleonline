import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  History, 
  Settings, 
  LogOut,
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function UserDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  // Mock data for user orders (replace with actual API call)
  const { data: userOrders } = useQuery({
    queryKey: ['/api/user/orders', user.uid],
    enabled: false, // Disable until backend supports user-specific orders
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">My Account</h1>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="text-lg bg-blue-100 text-blue-800">
                      {getInitials(user.displayName || user.email || 'User')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{user.displayName || 'User'}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Account Status</span>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Active
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Email Verified</span>
                  <Badge variant={user.emailVerified ? "outline" : "secondary"} 
                         className={user.emailVerified ? "text-green-700 border-green-300" : ""}>
                    {user.emailVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </>
                    )}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Member Since</span>
                  <span className="text-gray-900">
                    {user.metadata.creationTime ? formatDate(user.metadata.creationTime) : 'Recently'}
                  </span>
                </div>

                <div className="pt-4 space-y-2">
                  <Link href="/exchange">
                    <Button className="w-full">
                      Start New Exchange
                    </Button>
                  </Link>
                  <Link href="/track">
                    <Button variant="outline" className="w-full">
                      Track Order
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Order History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
                      <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">
                        No orders yet
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Account Security</CardTitle>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">Secure</div>
                      <p className="text-xs text-muted-foreground">
                        Firebase authenticated
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common tasks you can perform with your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link href="/exchange">
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Start Currency Exchange
                        </Button>
                      </Link>
                      
                      <Link href="/track">
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <History className="w-4 h-4" />
                          Track Existing Order
                        </Button>
                      </Link>
                      
                      <Link href="/contact">
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <Mail className="w-4 h-4" />
                          Contact Support
                        </Button>
                      </Link>
                      
                      <Link href="/services">
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <Settings className="w-4 h-4" />
                          View Services
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>
                      View and manage your currency exchange orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600 mb-4">
                        You haven't made any currency exchanges yet. Start your first exchange to see your order history here.
                      </p>
                      <Link href="/exchange">
                        <Button>Start First Exchange</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account preferences and security
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Profile Information</h4>
                          <p className="text-sm text-gray-600">Update your personal details</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit Profile
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Email Preferences</h4>
                          <p className="text-sm text-gray-600">Manage notification settings</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Security Settings</h4>
                          <p className="text-sm text-gray-600">Change password and security options</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage Security
                        </Button>
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-red-600">Delete Account</h4>
                          <p className="text-sm text-gray-600">Permanently delete your account and data</p>
                        </div>
                        <Button variant="destructive" size="sm">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}