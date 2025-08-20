import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/auth-context";
import { MainNavigation } from "@/components/navigation/main-nav";
import { RoleGuard } from "@/components/auth/role-guard";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";

// Import pages
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Blockchain from "@/pages/blockchain";
import Assets from "@/pages/assets";
import Participants from "@/pages/participants";
import Events from "@/pages/events";
import Chat from "@/pages/chat";
import ApiDocs from "@/pages/api-docs";
import Audit from "@/pages/audit";
import Testing from "@/pages/testing";
import Profile from "@/pages/profile";
import RoleDemo from "@/pages/role-demo";
import Subscription from "@/pages/subscription";
import Observability from "@/pages/observability";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/landing" component={Landing} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/blockchain" component={Blockchain} />
          <Route path="/assets" component={Assets} />
          <Route path="/participants" component={Participants} />
          <Route path="/chat" component={Chat} />
          
          {/* Role-protected routes */}
          <Route path="/events">
            <RoleGuard allowedRoles={["manufacturer", "shipper", "retailer"]} requireAuth={true}>
              <Events />
            </RoleGuard>
          </Route>
          
          <Route path="/audit">
            <RoleGuard allowedRoles={["other", "manufacturer"]} requireAuth={true}>
              <Audit />
            </RoleGuard>
          </Route>
          
          <Route path="/testing">
            <RoleGuard allowedRoles={["manufacturer", "other"]} requireAuth={true}>
              <Testing />
            </RoleGuard>
          </Route>
          
          <Route path="/profile">
            <RoleGuard requireAuth={true}>
              <Profile />
            </RoleGuard>
          </Route>
          
          <Route path="/role-demo" component={RoleDemo} />
          <Route path="/subscription">
            <RoleGuard requireAuth={true}>
              <Subscription />
            </RoleGuard>
          </Route>
          <Route path="/observability">
            <RoleGuard allowedRoles={["manufacturer", "other"]} requireAuth={true}>
              <Observability />
            </RoleGuard>
          </Route>
          <Route path="/api-docs" component={ApiDocs} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
