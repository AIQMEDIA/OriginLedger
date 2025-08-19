import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ChainHealthProps {
  health?: {
    blockchain_valid: boolean;
    total_participants: number;
    total_assets: number;
    blockchain_length: number;
  };
}

export default function ChainHealth({ health }: ChainHealthProps) {
  const healthMetrics = [
    {
      label: "Block Generation",
      value: 95,
      status: "Optimal",
      color: "bg-accent",
    },
    {
      label: "Network Sync", 
      value: 100,
      status: "100%",
      color: "bg-accent",
    },
    {
      label: "Data Integrity",
      value: health?.blockchain_valid ? 100 : 0,
      status: health?.blockchain_valid ? "Verified" : "Error",
      color: health?.blockchain_valid ? "bg-accent" : "bg-error",
    },
  ];

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
          Chain Health
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Blockchain performance metrics
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {healthMetrics.map((metric) => (
            <div key={metric.label} data-testid={`health-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.label}
                </span>
                <span className="text-sm text-accent dark:text-green-400">
                  {metric.status}
                </span>
              </div>
              <Progress 
                value={metric.value} 
                className="h-2"
              />
            </div>
          ))}
          
          {health && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Blocks:</span>
                  <span className="ml-2 font-medium text-secondary dark:text-white">
                    {health.blockchain_length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Participants:</span>
                  <span className="ml-2 font-medium text-secondary dark:text-white">
                    {health.total_participants}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
