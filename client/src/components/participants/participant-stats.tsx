import { Card, CardContent } from "@/components/ui/card";
import { Factory, Truck, Store, Users } from "lucide-react";

interface ParticipantStatsProps {
  stats?: {
    manufacturers: number;
    shippers: number;
    retailers: number;
    total: number;
  };
  isLoading?: boolean;
}

export default function ParticipantStats({ stats, isLoading }: ParticipantStatsProps) {
  const cards = [
    {
      title: "Manufacturers",
      value: stats?.manufacturers || 0,
      icon: Factory,
      bgColor: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-primary",
    },
    {
      title: "Shippers",
      value: stats?.shippers || 0,
      icon: Truck,
      bgColor: "bg-green-100 dark:bg-green-900",
      iconColor: "text-accent",
    },
    {
      title: "Retailers",
      value: stats?.retailers || 0,
      icon: Store,
      bgColor: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-600",
    },
    {
      title: "Total Active",
      value: stats?.total || 0,
      icon: Users,
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      iconColor: "text-warning",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <Card key={i} className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    className="text-2xl font-bold text-secondary dark:text-white"
                    data-testid={`stat-${card.title.toLowerCase()}`}
                  >
                    {card.value}
                  </p>
                </div>
                <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor}`} size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
