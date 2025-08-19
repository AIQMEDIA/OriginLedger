import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, QrCode } from "lucide-react";
import { useState } from "react";

interface AssetSearchProps {
  onSearch: (params: { status?: string; search?: string }) => void;
}

export default function AssetSearch({ onSearch }: AssetSearchProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const handleSearch = () => {
    onSearch({
      search: search || undefined,
      status: status || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search assets by ID, name, or participant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                data-testid="input-asset-search"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]" data-testid="select-asset-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="manufactured">Manufactured</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleSearch}
              variant="outline"
              data-testid="button-search-assets"
            >
              Search
            </Button>
            
            <Button 
              className="bg-primary hover:bg-blue-700 text-white"
              data-testid="button-scan-qr"
            >
              <QrCode size={16} className="mr-2" />
              Scan QR
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
