import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import AssetSearch from "@/components/assets/asset-search";
import AssetList from "@/components/assets/asset-list";
import { useState } from "react";

export default function Assets() {
  const [searchParams, setSearchParams] = useState<{
    status?: string;
    search?: string;
  }>({});

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['/api/assets', searchParams],
    queryFn: () => api.getAssets(searchParams),
  });

  return (
    <div className="space-y-6">
      <AssetSearch onSearch={setSearchParams} />
      <AssetList 
        assets={assetsData?.assets || []} 
        isLoading={isLoading}
        totalCount={assetsData?.total_count || 0}
      />
    </div>
  );
}
