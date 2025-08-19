import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface Block {
  index: number;
  timestamp: number;
  data: any;
  hash: string;
  prev_hash: string;
}

interface BlockDetailsProps {
  block?: Block;
}

export default function BlockDetails({ block }: BlockDetailsProps) {
  if (!block) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
            Block Details
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a block to view detailed information
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No block selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
          Block Details
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Detailed information about Block #{block.index}
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-secondary dark:text-white mb-4">
              Block Information
            </h4>
            <dl className="space-y-3" data-testid="block-info">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Block Index:</dt>
                <dd className="text-sm font-medium text-secondary dark:text-white">
                  {block.index}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Timestamp:</dt>
                <dd className="text-sm font-medium text-secondary dark:text-white">
                  {formatDistanceToNow(new Date(block.timestamp * 1000), { addSuffix: true })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Previous Hash:</dt>
                <dd className="text-sm font-medium text-secondary dark:text-white truncate">
                  {block.prev_hash?.slice(0, 16)}...
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Current Hash:</dt>
                <dd className="text-sm font-medium text-secondary dark:text-white truncate">
                  {block.hash?.slice(0, 16)}...
                </dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h4 className="font-medium text-secondary dark:text-white mb-4">
              Transaction Data
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <pre 
                className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto"
                data-testid="transaction-data"
              >
                {JSON.stringify(block.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
