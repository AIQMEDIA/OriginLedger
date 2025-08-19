import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Asset {
  id: string;
  assetId: string;
  name: string;
  category: string;
  currentStatus: string;
  currentLocation: string;
  batch: string;
  updatedAt: string;
}

interface AssetListProps {
  assets: Asset[];
  isLoading?: boolean;
  totalCount: number;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'manufactured':
      return 'status-manufactured';
    case 'shipped':
      return 'status-shipped';
    case 'delivered':
      return 'status-delivered';
    case 'received':
      return 'status-received';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export default function AssetList({ assets, isLoading, totalCount }: AssetListProps) {
  if (isLoading) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
            Asset Tracking
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor all assets in the supply chain
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
          Asset Tracking
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monitor all assets in the supply chain • {totalCount} assets
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {assets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No assets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Asset ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {assets.map((asset) => (
                  <tr 
                    key={asset.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    data-testid={`asset-row-${asset.assetId}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary dark:text-white">
                        {asset.assetId}
                      </div>
                      {asset.batch && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Batch: {asset.batch}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary dark:text-white">
                        {asset.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {asset.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getStatusColor(asset.currentStatus)} capitalize`}>
                        {asset.currentStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {asset.currentLocation || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {asset.updatedAt 
                        ? formatDistanceToNow(new Date(asset.updatedAt), { addSuffix: true })
                        : 'Unknown'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button 
                        variant="link" 
                        className="text-primary hover:text-blue-700 p-0"
                        data-testid={`button-view-journey-${asset.assetId}`}
                      >
                        View Journey
                      </Button>
                      <Button 
                        variant="link" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-0"
                        data-testid={`button-details-${asset.assetId}`}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
