import { useLocation } from "wouter";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const pageInfo = {
  "/": { title: "Dashboard", subtitle: "Overview of supply chain activities" },
  "/dashboard": { title: "Dashboard", subtitle: "Overview of supply chain activities" },
  "/blockchain": { title: "Blockchain Explorer", subtitle: "Interactive blockchain visualization" },
  "/assets": { title: "Asset Tracking", subtitle: "Monitor assets throughout the supply chain" },
  "/participants": { title: "Participants", subtitle: "Manage supply chain participants" },
  "/events": { title: "Add Event", subtitle: "Record new supply chain events" },
  "/api-docs": { title: "API Documentation", subtitle: "Integration guides and endpoints" },
};

export default function Header() {
  const [location] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const currentPage = pageInfo[location as keyof typeof pageInfo] || 
    { title: "Page", subtitle: "Navigation" };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary dark:text-white">
            {currentPage.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {currentPage.subtitle}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            data-testid="button-notifications"
          >
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
          
          {/* Refresh Button */}
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-primary hover:bg-blue-700 text-white"
            data-testid="button-refresh"
          >
            <RefreshCw 
              size={16} 
              className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
    </header>
  );
}
