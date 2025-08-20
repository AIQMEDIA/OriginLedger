import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { HeroSection } from "@/components/landing/hero-section";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentActivity from "@/components/dashboard/recent-activity";
import ChainHealth from "@/components/dashboard/chain-health";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return <HeroSection />;
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard-stats'],
    queryFn: api.getDashboardStats,
  });

  const { data: recentActivitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/recent-activities'],
    queryFn: () => api.getRecentActivities({ limit: 10 }),
  });

  const activities = recentActivitiesData?.activities || [];

  const { data: health } = useQuery({
    queryKey: ['/api/health'],
    queryFn: api.getHealth,
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enterprise Observability Badge */}
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Enterprise Observability</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Powered by Arize Phoenix AI Platform</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700">
          AI Monitoring Active
        </Badge>
      </div>
      
      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity 
          activities={activities} 
          isLoading={activitiesLoading} 
        />
        <ChainHealth health={health} />
      </div>
    </div>
  );
}
