import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useScrollMemory } from "@/hooks/use-scroll-memory";
import Home from "@/pages/home";
import About from "@/pages/about";
import Services from "@/pages/services";
import HowItWorks from "@/pages/how-it-works";
import Exchange from "@/pages/exchange";
import Confirmation from "@/pages/confirmation";
import TrackOrder from "@/pages/track-order";
import Contact from "@/pages/contact";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminAnalytics from "@/pages/admin-analytics";
import OrderHistory from "@/pages/order-history";
import CompletedOrders from "@/pages/completed-orders";
import NotFound from "@/pages/not-found";

function Router() {
  // Initialize scroll memory for the entire app
  useScrollMemory();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/exchange" component={Exchange} />
      <Route path="/confirmation" component={Confirmation} />
      <Route path="/track" component={TrackOrder} />
      <Route path="/contact" component={Contact} />
      <Route path="/orders" component={OrderHistory} />
      <Route path="/completed" component={CompletedOrders} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
