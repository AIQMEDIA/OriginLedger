import { Package, Blocks, Users, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats?: {
    totalAssets: number;
    totalEvents: number;
    activeParticipants: number;
    chainIntegrity: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Assets",
      value: stats?.totalAssets || 0,
      icon: Package,
      color: "blue",
      change: "+12%",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-primary",
    },
    {
      title: "Blockchain Events", 
      value: stats?.totalEvents || 0,
      icon: Blocks,
      color: "green", 
      change: "+8%",
      bgColor: "bg-green-100 dark:bg-green-900",
      iconColor: "text-accent",
    },
    {
      title: "Active Participants",
      value: stats?.activeParticipants || 0,
      icon: Users,
      color: "purple",
      change: "+5%",
      bgColor: "bg-purple-100 dark:bg-purple-900", 
      iconColor: "text-purple-600",
    },
    {
      title: "Chain Integrity",
      value: `${stats?.chainIntegrity || 100}%`,
      icon: Shield,
      color: "green",
      change: "All blocks verified",
      bgColor: "bg-green-100 dark:bg-green-900",
      iconColor: "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p 
                    className="text-3xl font-bold text-secondary dark:text-white"
                    data-testid={`stat-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor} text-xl`} size={24} />
                </div>
              </div>
              <p className="text-sm text-accent dark:text-green-400 mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
                {card.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
