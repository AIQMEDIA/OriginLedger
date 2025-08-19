import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Blockchain from "@/pages/blockchain";
import Assets from "@/pages/assets";
import Participants from "@/pages/participants";
import Events from "@/pages/events";
import Chat from "@/pages/chat";
import ApiDocs from "@/pages/api-docs";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

function Router() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/blockchain" component={Blockchain} />
            <Route path="/assets" component={Assets} />
            <Route path="/participants" component={Participants} />
            <Route path="/events" component={Events} />
            <Route path="/chat" component={Chat} />
            <Route path="/api-docs" component={ApiDocs} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
