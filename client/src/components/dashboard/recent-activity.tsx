import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Truck, Warehouse } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  action: string;
  participantName: string;
  assetId: string;
  location: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities?: Activity[];
  isLoading?: boolean;
}

const getActivityIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'manufactured':
      return Check;
    case 'shipped':
      return Truck;
    case 'received':
      return Warehouse;
    default:
      return Check;
  }
};

const getActivityColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'manufactured':
      return "bg-green-100 dark:bg-green-900 text-accent";
    case 'shipped':
      return "bg-blue-100 dark:bg-blue-900 text-primary";
    case 'received':
      return "bg-yellow-100 dark:bg-yellow-900 text-warning";
    default:
      return "bg-green-100 dark:bg-green-900 text-accent";
  }
};

export default function RecentActivity({ activities = [], isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
            Recent Activity
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest supply chain events
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
          Recent Activity
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Latest supply chain events
        </p>
      </CardHeader>
      <CardContent className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.action);
              const colorClass = getActivityColor(activity.action);
              
              return (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-4"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-secondary dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Asset ID: {activity.assetId} • by {activity.participantName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Unknown time'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
