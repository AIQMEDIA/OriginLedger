import { AssetSearch } from "@/components/assets/asset-search";

export default function Assets() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary dark:text-white">Asset Tracking</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Search and manage supply chain assets with advanced filtering
          </p>
        </div>
      </div>

      <AssetSearch />
    </div>
  );
}
