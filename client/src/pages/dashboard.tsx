import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { HeroSection } from "@/components/landing/hero-section";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, MessageCircle } from "lucide-react";
import { Link } from "wouter";
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentActivity 
          activities={activities} 
          isLoading={activitiesLoading} 
        />
        <ChainHealth health={health} />
        
        {/* AI Assistant Quick Access Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Get instant help</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Need help with blockchain operations, asset tracking, or supply chain questions? Our AI assistant is here 24/7.
          </p>
          <Link href="/chat">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="dashboard-chat-cta">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
