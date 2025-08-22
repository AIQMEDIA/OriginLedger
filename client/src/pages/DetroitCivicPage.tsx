import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, DollarSign, MapPin, Users, CreditCard, Percent } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Property {
  id: string;
  propertyId: string;
  address: string;
  ownerId: string;
  assessedValue: number;
  assessedValueFormatted: string;
  taxOwed: number;
  taxOwedFormatted: string;
  status: string;
  metadata: {
    neighborhood?: string;
    propertyType?: string;
    squareFootage?: number;
    year?: number;
  };
}

interface Payment {
  id: string;
  propertyId: string;
  payerId: string;
  txHash?: string;
  paymentMethod: string;
  amount: number;
  amountFormatted: string;
  status: string;
  timestamp: string;
  context?: {
    reason?: string;
    blockchainNetwork?: string;
  };
}

interface DetroitDashboard {
  title: string;
  stats: {
    totalProperties: number;
    totalAssessedValue: string;
    totalTaxOwed: string;
    governmentProperties: number;
    activeResidents: number;
    blockchainTransactions: number;
  };
  recentProperties: Property[];
  municipalFeatures: string[];
}

export function DetroitCivicPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Fetch Detroit dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery<DetroitDashboard>({
    queryKey: ['/api/detroit/dashboard']
  });

  // Fetch all properties
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery<{
    properties: Property[];
    total: number;
  }>({
    queryKey: ['/api/detroit/properties']
  });

  // Fetch payments for selected property
  const { data: paymentsData } = useQuery<{
    payments: Payment[];
    total: number;
  }>({
    queryKey: ['/api/detroit/properties', selectedProperty?.id, 'payments'],
    enabled: !!selectedProperty
  });

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Detroit Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                Detroit Civic Blockchain
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Municipal property registry and tax management powered by blockchain technology
              </p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Powered by OriginLedger
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.stats.totalProperties}</div>
                <p className="text-xs text-muted-foreground">Registered in Detroit</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assessed Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.stats.totalAssessedValue}</div>
                <p className="text-xs text-muted-foreground">Municipal property value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxes Owed</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.stats.totalTaxOwed}</div>
                <p className="text-xs text-muted-foreground">Outstanding property taxes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Residents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.stats.activeResidents}</div>
                <p className="text-xs text-muted-foreground">Blockchain participants</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Government Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.stats.governmentProperties}</div>
                <p className="text-xs text-muted-foreground">Municipal buildings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blockchain Transactions</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.stats.blockchainTransactions}</div>
                <p className="text-xs text-muted-foreground">Total blockchain records</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Property Registry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property Registry
              </CardTitle>
              <CardDescription>
                Browse Detroit's blockchain-based property records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {propertiesData?.properties.map((property) => (
                    <div
                      key={property.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProperty?.id === property.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedProperty(property)}
                      data-testid={`property-card-${property.propertyId}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{property.propertyId}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.address}
                          </div>
                          {property.metadata?.neighborhood && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {property.metadata.neighborhood}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{property.assessedValueFormatted}</div>
                          {property.taxOwed > 0 && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              Tax: {property.taxOwedFormatted}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details & Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {selectedProperty ? 'Property Details & Payments' : 'Select a Property'}
              </CardTitle>
              <CardDescription>
                {selectedProperty ? `Details for ${selectedProperty.propertyId}` : 'Click on a property to view details and payment history'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProperty ? (
                <div className="space-y-6">
                  {/* Property Info */}
                  <div>
                    <h4 className="font-medium mb-3">Property Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Property ID</Label>
                        <div className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          {selectedProperty.propertyId}
                        </div>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div>
                          <Badge variant={selectedProperty.status === 'active' ? 'default' : 'secondary'}>
                            {selectedProperty.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label>Assessed Value</Label>
                        <div className="font-medium">{selectedProperty.assessedValueFormatted}</div>
                      </div>
                      <div>
                        <Label>Tax Owed</Label>
                        <div className={`font-medium ${selectedProperty.taxOwed > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {selectedProperty.taxOwedFormatted}
                        </div>
                      </div>
                      {selectedProperty.metadata?.squareFootage && (
                        <div>
                          <Label>Square Footage</Label>
                          <div>{selectedProperty.metadata.squareFootage.toLocaleString()} sq ft</div>
                        </div>
                      )}
                      {selectedProperty.metadata?.propertyType && (
                        <div>
                          <Label>Property Type</Label>
                          <div>{selectedProperty.metadata.propertyType}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Payment History */}
                  <div>
                    <h4 className="font-medium mb-3">Payment History</h4>
                    {paymentsData?.payments.length ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {paymentsData.payments.map((payment) => (
                          <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div>
                              <div className="font-medium">{payment.amountFormatted}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {payment.paymentMethod.toUpperCase()} • {new Date(payment.timestamp).toLocaleDateString()}
                              </div>
                              {payment.txHash && (
                                <div className="text-xs font-mono text-blue-600 dark:text-blue-400">
                                  {payment.txHash.slice(0, 10)}...
                                </div>
                              )}
                            </div>
                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                        No payment history available
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a property from the registry to view details and payment history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Municipal Features */}
        {dashboard && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Detroit Municipal Blockchain Features
              </CardTitle>
              <CardDescription>
                Advanced civic services powered by OriginLedger blockchain technology
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.municipalFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Ready to Transform Your City?</CardTitle>
            <CardDescription className="text-blue-100">
              Contact Justin Owenu and the Detroit blockchain team to implement civic blockchain solutions in your municipality
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Contact Detroit Team
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Learn More About Municipal Blockchain
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}