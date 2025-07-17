import { Suspense, lazy, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import WelcomeBanner from "@/components/welcome-banner";
import { useScrollMemory } from "@/hooks/use-scroll-memory";
import { LanguageProvider } from "@/contexts/language-context";
import { AuthProvider } from "@/contexts/auth-context";
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from "react-helmet-async";

// Lazy load pages to improve initial loading with error handling
const Home = lazy(() => import("@/pages/home").catch((error) => {
  // Failed to load Home component
  return { default: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Failed to load Home page</h1>
        <p className="text-gray-600 mb-4">Please refresh the page or try again later.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )};
}));
const About = lazy(() => import("@/pages/about").catch(() => ({ default: () => <div>Error loading About page</div> })));
const Services = lazy(() => import("@/pages/services").catch(() => ({ default: () => <div>Error loading Services page</div> })));
const HowItWorks = lazy(() => import("@/pages/how-it-works").catch(() => ({ default: () => <div>Error loading How It Works page</div> })));
const Exchange = lazy(() => import("@/pages/exchange").catch(() => ({ default: () => <div>Error loading Exchange page</div> })));
const Confirmation = lazy(() => import("@/pages/confirmation").catch(() => ({ default: () => <div>Error loading Confirmation page</div> })));
const OrderCompleted = lazy(() => import("@/pages/order-completed").catch(() => ({ default: () => <div>Error loading Order Completed page</div> })));
const OrderCancelled = lazy(() => import("@/pages/order-cancelled").catch(() => ({ default: () => <div>Error loading Order Cancelled page</div> })));
const TrackOrder = lazy(() => import("@/pages/track-order").catch(() => ({ default: () => <div>Error loading Track Order page</div> })));
const Contact = lazy(() => import("@/pages/contact").catch(() => ({ default: () => <div>Error loading Contact page</div> })));
const AdminLogin = lazy(() => import("@/pages/admin-login").catch(() => ({ default: () => <div>Error loading Admin Login page</div> })));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard").catch(() => ({ default: () => <div>Error loading Admin Dashboard page</div> })));
const AdminAnalytics = lazy(() => import("@/pages/admin-analytics").catch(() => ({ default: () => <div>Error loading Admin Analytics page</div> })));
const AdminExchangeRates = lazy(() => import("@/pages/admin-exchange-rates").catch(() => ({ default: () => <div>Error loading Admin Exchange Rates page</div> })));
const OrderHistory = lazy(() => import("@/pages/order-history").catch(() => ({ default: () => <div>Error loading Order History page</div> })));
const CompletedOrders = lazy(() => import("@/pages/completed-orders").catch(() => ({ default: () => <div>Error loading Completed Orders page</div> })));
const CancelledOrders = lazy(() => import("@/pages/cancelled-orders").catch(() => ({ default: () => <div>Error loading Cancelled Orders page</div> })));
const SignIn = lazy(() => import("@/pages/signin").catch(() => ({ default: () => <div>Error loading Sign In page</div> })));
const SignUp = lazy(() => import("@/pages/signup").catch(() => ({ default: () => <div>Error loading Sign Up page</div> })));
const ForgotPassword = lazy(() => import("@/pages/forgot-password").catch(() => ({ default: () => <div>Error loading Forgot Password page</div> })));
const ResetPassword = lazy(() => import("@/pages/reset-password").catch(() => ({ default: () => <div>Error loading Reset Password page</div> })));
const Profile = lazy(() => import("@/pages/profile").catch(() => ({ default: () => <div>Error loading Profile page</div> })));
const MyOrders = lazy(() => import("@/pages/my-orders").catch(() => ({ default: () => <div>Error loading My Orders page</div> })));
const NotFound = lazy(() => import("@/pages/not-found").catch(() => ({ default: () => <div>Error loading Not Found page</div> })));

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-red-600 text-xl font-bold mb-4">
        Something went wrong: {error.message}
      </div>
      <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold">
        Try Again
      </button>
    </div>
  );
}

function Router() {
  // Initialize scroll memory for the entire app
  useScrollMemory();
  const [location] = useLocation();
  // Auto-set admin token to bypass login (temporary bypass)
  useEffect(() => {
    if (location.startsWith("/admin")) {
      sessionStorage.setItem("adminToken", "bypass-token");
    }
  }, [location]);
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/exchange" component={Exchange} />
      <Route path="/confirmation" component={Confirmation} />
      <Route path="/order-completed" component={OrderCompleted} />
      <Route path="/order-cancelled" component={OrderCancelled} />
      <Route path="/track" component={TrackOrder} />
      <Route path="/contact" component={Contact} />
      <Route path="/orders" component={OrderHistory} />
      <Route path="/completed" component={CompletedOrders} />
      <Route path="/cancelled" component={CancelledOrders} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/profile" component={Profile} />
      <Route path="/my-orders" component={MyOrders} />
      {/* Admin routes - bypass login and go directly to dashboard */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/login" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin-exchange-rates" component={AdminExchangeRates} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isAuthRoute = location.startsWith("/signin") || location.startsWith("/signup") || 
                     location.startsWith("/forgot-password") || location.startsWith("/reset-password");
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense fallback={<LoadingSpinner />}>
                  {/* Skip link for accessibility */}
                  <a 
                    href="#main-content" 
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:rounded"
                  >
                    Skip to main content
                  </a>
                  <div className="min-h-screen bg-gray-50 flex flex-col">
                    {!isAdminRoute && !isAuthRoute && <Navigation />}
                    {!isAdminRoute && !isAuthRoute && <WelcomeBanner />}
                    <main className="flex-1" id="main-content">
                      <Router />
                    </main>
                    {!isAdminRoute && !isAuthRoute && <Footer />}
                  </div>
                  <Toaster />
                </Suspense>
              </ErrorBoundary>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
