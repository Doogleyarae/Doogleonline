import { Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useScrollMemory } from "@/hooks/use-scroll-memory";
import { LanguageProvider } from "@/contexts/language-context";
import { ErrorBoundary } from 'react-error-boundary';

// Lazy load pages to improve initial loading
const Home = lazy(() => import("@/pages/home"));
const About = lazy(() => import("@/pages/about"));
const Services = lazy(() => import("@/pages/services"));
const HowItWorks = lazy(() => import("@/pages/how-it-works"));
const Exchange = lazy(() => import("@/pages/exchange"));
const Confirmation = lazy(() => import("@/pages/confirmation"));
const OrderCompleted = lazy(() => import("@/pages/order-completed"));
const OrderCancelled = lazy(() => import("@/pages/order-cancelled"));
const TrackOrder = lazy(() => import("@/pages/track-order"));
const Contact = lazy(() => import("@/pages/contact"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminAnalytics = lazy(() => import("@/pages/admin-analytics"));
const AdminExchangeRates = lazy(() => import("@/pages/admin-exchange-rates"));
const OrderHistory = lazy(() => import("@/pages/order-history"));
const CompletedOrders = lazy(() => import("@/pages/completed-orders"));
const CancelledOrders = lazy(() => import("@/pages/cancelled-orders"));
const SignIn = lazy(() => import("@/pages/signin"));
const SignUp = lazy(() => import("@/pages/signup"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const NotFound = lazy(() => import("@/pages/not-found"));

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
  
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingSpinner />}>
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
          <Route path="/admin" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin-exchange-rates" component={AdminExchangeRates} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isAuthRoute = location.startsWith("/signin") || location.startsWith("/signup") || 
                     location.startsWith("/forgot-password") || location.startsWith("/reset-password");
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            {!isAdminRoute && !isAuthRoute && <Navigation />}
            <main className="flex-1">
              <Router />
            </main>
            {!isAdminRoute && !isAuthRoute && <Footer />}
          </div>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
