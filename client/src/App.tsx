import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useScrollMemory } from "@/hooks/use-scroll-memory";
import { AuthProvider } from "@/contexts/AuthContext";

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
const OrderHistory = lazy(() => import("@/pages/order-history"));
const CompletedOrders = lazy(() => import("@/pages/completed-orders"));
const CancelledOrders = lazy(() => import("@/pages/cancelled-orders"));
const FirebaseLoginPage = lazy(() => import("@/pages/firebase-login"));
const FirebaseSetupPage = lazy(() => import("@/pages/firebase-setup"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}

function Router() {
  // Initialize scroll memory for the entire app
  useScrollMemory();
  
  return (
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
        <Route path="/login" component={FirebaseLoginPage} />
        <Route path="/firebase-setup" component={FirebaseSetupPage} />
        <Route path="/admin" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
