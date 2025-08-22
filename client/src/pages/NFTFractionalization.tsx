import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Coins, TrendingUp, Users, Zap, ExternalLink, Copy, QrCode, Percent, DollarSign, Clock, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface NFTProperty {
  id: string;
  propertyId: string;
  address: string;
  assessedValue: number;
  assessedValueFormatted: string;
  currentOwnership: OwnershipFraction[];
  nftMetadata: {
    tokenId: string;
    contractAddress: string;
    totalSupply: number;
    availableShares: number;
    floorPrice: number;
    lastSalePrice: number;
    royaltyPercentage: number;
  };
  tradingActivity: TradingActivity[];
}

interface OwnershipFraction {
  id: string;
  ownerId: string;
  ownerName: string;
  fraction: number;
  fractionPercent: string;
  acquiredAt: string;
  acquisitionPrice: number;
  currentValue: number;
  nftTokenIds: number[];
}

interface TradingActivity {
  id: string;
  type: 'mint' | 'transfer' | 'sale' | 'listing';
  fromAddress?: string;
  toAddress: string;
  tokenAmount: number;
  pricePerToken: number;
  totalPrice: number;
  txHash: string;
  timestamp: string;
  gasUsed: number;
}

interface FractionalizationRequest {
  propertyId: string;
  totalShares: number;
  sharePrice: number;
  royaltyPercentage: number;
  allowPublicTrading: boolean;
  minimumPurchase: number;
}

interface TradingOrder {
  type: 'buy' | 'sell';
  propertyId: string;
  shareAmount: number;
  pricePerShare: number;
  expirationDays: number;
}

export function NFTFractionalization() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProperty, setSelectedProperty] = useState<NFTProperty | null>(null);
  const [fractionalizationData, setFractionalizationData] = useState<FractionalizationRequest>({
    propertyId: '',
    totalShares: 1000,
    sharePrice: 250,
    royaltyPercentage: 2.5,
    allowPublicTrading: true,
    minimumPurchase: 1
  });
  const [tradingOrder, setTradingOrder] = useState<TradingOrder>({
    type: 'buy',
    propertyId: '',
    shareAmount: 10,
    pricePerShare: 250,
    expirationDays: 7
  });

  // Fetch NFT-enabled properties
  const { data: nftProperties, isLoading: propertiesLoading } = useQuery<NFTProperty[]>({
    queryKey: ['/api/nft/properties'],
    enabled: isAuthenticated
  });

  // Fetch market data
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['/api/nft/market-data'],
    enabled: isAuthenticated,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fractionalization mutation
  const fractionalizeMutation = useMutation({
    mutationFn: async (data: FractionalizationRequest) => {
      return apiRequest('/api/nft/fractionalize', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Property Fractionalized",
        description: `Successfully created ${fractionalizationData.totalShares} NFT shares. Contract: ${data.contractAddress}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/nft/properties'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fractionalization Failed",
        description: error.message || "Failed to create NFT shares",
        variant: "destructive"
      });
    }
  });

  // Trading mutation
  const tradingMutation = useMutation({
    mutationFn: async (data: TradingOrder) => {
      return apiRequest('/api/nft/trade', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Order Placed",
        description: `${tradingOrder.type === 'buy' ? 'Buy' : 'Sell'} order for ${tradingOrder.shareAmount} shares submitted. TX: ${data.txHash?.slice(0, 10)}...`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/nft/properties'] });
    },
    onError: (error: any) => {
      toast({
        title: "Trading Failed",
        description: error.message || "Failed to execute trade",
        variant: "destructive"
      });
    }
  });

  const handleFractionalize = () => {
    if (!selectedProperty) return;
    fractionalizeMutation.mutate({
      ...fractionalizationData,
      propertyId: selectedProperty.id
    });
  };

  const handleTrade = () => {
    if (!selectedProperty) return;
    tradingMutation.mutate({
      ...tradingOrder,
      propertyId: selectedProperty.id
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard"
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Coins className="h-6 w-6" />
              NFT Fractionalization
            </CardTitle>
            <CardDescription>
              Please log in to access property NFT features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Authentication required to view and trade fractional property NFTs.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (propertiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Coins className="h-8 w-8 text-purple-600" />
                NFT Fractionalization
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Transform Detroit properties into tradeable NFT shares with ERC-1155 compatibility
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Zap className="h-3 w-3 mr-1" />
                ERC-1155 Compatible
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                OpenSea Ready
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2.4M</div>
              <p className="text-xs text-green-600">+12.5% this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nftProperties?.length || 0}</div>
              <p className="text-xs text-blue-600">NFT-enabled properties</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">847</div>
              <p className="text-xs text-purple-600">Fractional owners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$48.2K</div>
              <p className="text-xs text-orange-600">Trading volume</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="fractionalize">Fractionalize</TabsTrigger>
            <TabsTrigger value="trade">Trade</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  NFT-Enabled Detroit Properties
                </CardTitle>
                <CardDescription>
                  Properties available for fractionalization and trading as NFTs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nftProperties?.length ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {nftProperties.map((property) => (
                      <div 
                        key={property.id} 
                        className={`p-6 border rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                          selectedProperty?.id === property.id 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedProperty(property)}
                        data-testid={`nft-property-${property.propertyId}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="font-semibold text-lg">{property.propertyId}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{property.address}</div>
                          </div>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">
                            NFT Enabled
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{property.assessedValueFormatted}</div>
                            <div className="text-sm text-gray-600">Property Value</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{property.nftMetadata?.availableShares || 0}</div>
                            <div className="text-sm text-gray-600">Shares Available</div>
                          </div>
                        </div>

                        {property.nftMetadata && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Token ID:</span>
                              <span className="font-mono">{property.nftMetadata.tokenId}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Floor Price:</span>
                              <span className="font-semibold">${property.nftMetadata.floorPrice}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Last Sale:</span>
                              <span className="text-green-600">${property.nftMetadata.lastSalePrice}</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Ownership Distribution:</span>
                            <span className="text-sm font-medium">{property.currentOwnership?.length || 0} owners</span>
                          </div>
                          <Progress 
                            value={((property.nftMetadata?.totalSupply - property.nftMetadata?.availableShares) / property.nftMetadata?.totalSupply) * 100} 
                            className="mt-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Coins className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No NFT Properties Available</p>
                    <p className="text-sm">Properties need to be fractionalized before they appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fractionalize Tab */}
          <TabsContent value="fractionalize" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Select Property to Fractionalize
                  </CardTitle>
                  <CardDescription>
                    Choose a Detroit property to convert into tradeable NFT shares
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertySelect">Property</Label>
                    <Select 
                      value={selectedProperty?.id || ''} 
                      onValueChange={(value) => {
                        const property = nftProperties?.find(p => p.id === value);
                        setSelectedProperty(property || null);
                      }}
                    >
                      <SelectTrigger data-testid="property-select">
                        <SelectValue placeholder="Select property..." />
                      </SelectTrigger>
                      <SelectContent>
                        {nftProperties?.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.propertyId} - {property.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProperty && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Property ID:</span>
                          <span className="font-medium">{selectedProperty.propertyId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Assessed Value:</span>
                          <span className="font-medium">{selectedProperty.assessedValueFormatted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Current Status:</span>
                          <Badge variant="secondary">Ready for Fractionalization</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fractionalization Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Fractionalization Settings
                  </CardTitle>
                  <CardDescription>
                    Configure NFT share parameters and trading rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalShares">Total Shares</Label>
                      <Input
                        id="totalShares"
                        type="number"
                        value={fractionalizationData.totalShares}
                        onChange={(e) => setFractionalizationData(prev => ({ 
                          ...prev, 
                          totalShares: parseInt(e.target.value) || 0 
                        }))}
                        data-testid="total-shares-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sharePrice">Share Price ($)</Label>
                      <Input
                        id="sharePrice"
                        type="number"
                        step="0.01"
                        value={fractionalizationData.sharePrice}
                        onChange={(e) => setFractionalizationData(prev => ({ 
                          ...prev, 
                          sharePrice: parseFloat(e.target.value) || 0 
                        }))}
                        data-testid="share-price-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="royalty">Royalty (%)</Label>
                      <Input
                        id="royalty"
                        type="number"
                        step="0.1"
                        max="10"
                        value={fractionalizationData.royaltyPercentage}
                        onChange={(e) => setFractionalizationData(prev => ({ 
                          ...prev, 
                          royaltyPercentage: parseFloat(e.target.value) || 0 
                        }))}
                        data-testid="royalty-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimumPurchase">Min Purchase</Label>
                      <Input
                        id="minimumPurchase"
                        type="number"
                        value={fractionalizationData.minimumPurchase}
                        onChange={(e) => setFractionalizationData(prev => ({ 
                          ...prev, 
                          minimumPurchase: parseInt(e.target.value) || 1 
                        }))}
                        data-testid="minimum-purchase-input"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Market Cap:</span>
                        <span className="font-semibold">
                          ${(fractionalizationData.totalShares * fractionalizationData.sharePrice).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Share of Property:</span>
                        <span className="font-semibold">
                          {selectedProperty ? 
                            ((fractionalizationData.sharePrice / (selectedProperty.assessedValue / 100)) * 100).toFixed(4) + '%'
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Royalty per Trade:</span>
                        <span className="font-semibold">{fractionalizationData.royaltyPercentage}%</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleFractionalize}
                    disabled={!selectedProperty || fractionalizeMutation.isPending}
                    className="w-full"
                    data-testid="fractionalize-button"
                  >
                    {fractionalizeMutation.isPending ? 'Creating NFT Shares...' : 'Fractionalize Property'}
                    <Zap className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trade Tab */}
          <TabsContent value="trade" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trading Interface */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Property Share Trading
                  </CardTitle>
                  <CardDescription>
                    Buy and sell fractional property shares on the blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProperty ? (
                    <>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{selectedProperty.propertyId}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Floor: ${selectedProperty.nftMetadata?.floorPrice}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(selectedProperty.nftMetadata?.contractAddress || '')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">{selectedProperty.address}</div>
                      </div>

                      <Tabs defaultValue="buy" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="buy">Buy Shares</TabsTrigger>
                          <TabsTrigger value="sell">Sell Shares</TabsTrigger>
                        </TabsList>

                        <TabsContent value="buy" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="buyAmount">Shares to Buy</Label>
                              <Input
                                id="buyAmount"
                                type="number"
                                value={tradingOrder.shareAmount}
                                onChange={(e) => setTradingOrder(prev => ({ 
                                  ...prev, 
                                  shareAmount: parseInt(e.target.value) || 0 
                                }))}
                                data-testid="buy-amount-input"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="buyPrice">Price per Share ($)</Label>
                              <Input
                                id="buyPrice"
                                type="number"
                                step="0.01"
                                value={tradingOrder.pricePerShare}
                                onChange={(e) => setTradingOrder(prev => ({ 
                                  ...prev, 
                                  pricePerShare: parseFloat(e.target.value) || 0 
                                }))}
                                data-testid="buy-price-input"
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex justify-between text-sm">
                              <span>Total Cost:</span>
                              <span className="font-semibold">${(tradingOrder.shareAmount * tradingOrder.pricePerShare).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Gas Fee (Est.):</span>
                              <span>~$12.50</span>
                            </div>
                          </div>

                          <Button 
                            onClick={() => handleTrade()}
                            disabled={tradingMutation.isPending}
                            className="w-full bg-green-600 hover:bg-green-700"
                            data-testid="buy-shares-button"
                          >
                            {tradingMutation.isPending ? 'Processing...' : 'Buy Shares'}
                          </Button>
                        </TabsContent>

                        <TabsContent value="sell" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="sellAmount">Shares to Sell</Label>
                              <Input
                                id="sellAmount"
                                type="number"
                                value={tradingOrder.shareAmount}
                                onChange={(e) => setTradingOrder(prev => ({ 
                                  ...prev, 
                                  shareAmount: parseInt(e.target.value) || 0 
                                }))}
                                data-testid="sell-amount-input"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sellPrice">Price per Share ($)</Label>
                              <Input
                                id="sellPrice"
                                type="number"
                                step="0.01"
                                value={tradingOrder.pricePerShare}
                                onChange={(e) => setTradingOrder(prev => ({ 
                                  ...prev, 
                                  pricePerShare: parseFloat(e.target.value) || 0 
                                }))}
                                data-testid="sell-price-input"
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="flex justify-between text-sm">
                              <span>Total Revenue:</span>
                              <span className="font-semibold">${(tradingOrder.shareAmount * tradingOrder.pricePerShare).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Royalty (2.5%):</span>
                              <span>-${((tradingOrder.shareAmount * tradingOrder.pricePerShare) * 0.025).toFixed(2)}</span>
                            </div>
                          </div>

                          <Button 
                            onClick={() => handleTrade()}
                            disabled={tradingMutation.isPending}
                            className="w-full bg-red-600 hover:bg-red-700"
                            data-testid="sell-shares-button"
                          >
                            {tradingMutation.isPending ? 'Processing...' : 'Sell Shares'}
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a property from the Properties tab to start trading</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Market Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedProperty?.tradingActivity?.slice(0, 5).map((activity, index) => (
                      <div key={activity.id || index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>
                          <div className="text-sm font-medium">
                            {activity.type === 'sale' ? 'Sale' : activity.type === 'mint' ? 'Mint' : 'Transfer'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {activity.tokenAmount} shares @ ${activity.pricePerToken}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">${activity.totalPrice}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No recent activity
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My NFT Portfolio
                </CardTitle>
                <CardDescription>
                  Your fractional property ownership and trading history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Portfolio Coming Soon</p>
                  <p className="text-sm">Your NFT holdings and trading history will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* NFT Integration Benefits */}
        <Card className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Detroit NFT Property Benefits</CardTitle>
            <CardDescription className="text-purple-100">
              Revolutionary property investment with blockchain technology and OpenSea integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span>Fractional ownership from $1</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span>Trade on OpenSea marketplace</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span>Instant liquidity 24/7</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                <ExternalLink className="mr-2 h-4 w-4" />
                View on OpenSea
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                <QrCode className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}