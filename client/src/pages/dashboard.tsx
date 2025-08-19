import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { HeroSection } from "@/components/landing/hero-section";
import { useAuth } from "@/contexts/auth-context";
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
