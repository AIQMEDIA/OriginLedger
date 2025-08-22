import { useState } from "react";
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
import { AlertCircle, Wallet, CreditCard, DollarSign, MapPin, TrendingUp, Percent, CheckCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface ResidentProperty {
  id: string;
  propertyId: string;
  address: string;
  assessedValue: number;
  assessedValueFormatted: string;
  taxOwed: number;
  taxOwedFormatted: string;
  status: string;
  metadata: {
    neighborhood?: string;
    propertyType?: string;
    squareFootage?: number;
  };
}

interface ResidentData {
  properties: ResidentProperty[];
  ownerships: any[];
  totalProperties: number;
  totalOwnerships: number;
}

export function DetroitResidentPortal() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'usdc',
    txHash: ''
  });
  const [selectedProperty, setSelectedProperty] = useState<ResidentProperty | null>(null);

  // Fetch resident's properties
  const { data: residentData, isLoading: residentLoading } = useQuery<ResidentData>({
    queryKey: ['/api/participants', user?.id, 'properties'],
    enabled: isAuthenticated && !!user?.id
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: { propertyId: string; amount: number; paymentMethod: string; txHash?: string }) => {
      return apiRequest(`/api/payments/property/${data.propertyId}`, {
        method: 'POST',
        body: JSON.stringify({
          amount: data.amount * 100, // Convert to cents
          paymentMethod: data.paymentMethod,
          txHash: data.txHash || undefined
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Your property tax payment has been processed and recorded on the blockchain."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/participants'] });
      setPaymentData({ amount: '', paymentMethod: 'usdc', txHash: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePayment = () => {
    if (!selectedProperty || !paymentData.amount) return;
    
    paymentMutation.mutate({
      propertyId: selectedProperty.id,
      amount: parseFloat(paymentData.amount),
      paymentMethod: paymentData.paymentMethod,
      txHash: paymentData.txHash
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wallet className="h-6 w-6" />
              Detroit Resident Portal
            </CardTitle>
            <CardDescription>
              Please log in to access your property dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to be logged in as a Detroit resident to access this portal.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (residentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalAssessedValue = residentData?.properties.reduce((sum, prop) => sum + prop.assessedValue, 0) || 0;
  const totalTaxOwed = residentData?.properties.reduce((sum, prop) => sum + prop.taxOwed, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Wallet className="h-8 w-8 text-blue-600" />
                My Property Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user?.username}! Manage your Detroit properties with blockchain transparency.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {residentData?.totalProperties || 0} Properties
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {residentData?.totalOwnerships || 0} Ownership Records
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Property Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalAssessedValue / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Assessed value of all properties</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxes Owed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${(totalTaxOwed / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Outstanding property taxes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalTaxOwed === 0 ? 'PAID' : 'DUE'}
              </div>
              <p className="text-xs text-muted-foreground">Current tax status</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">My Properties</TabsTrigger>
            <TabsTrigger value="payments">Pay Taxes</TabsTrigger>
            <TabsTrigger value="ownership">Ownership</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Your Detroit Properties
                </CardTitle>
                <CardDescription>
                  Blockchain-verified property records with real-time tax status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {residentData?.properties.length ? (
                  <div className="space-y-4">
                    {residentData.properties.map((property) => (
                      <div 
                        key={property.id} 
                        className="p-4 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={() => setSelectedProperty(property)}
                        data-testid={`resident-property-${property.propertyId}`}
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
                            <div className={`text-sm ${property.taxOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {property.taxOwed > 0 ? `Tax: ${property.taxOwedFormatted}` : 'Taxes Paid'}
                            </div>
                            <Badge variant={property.status === 'active' ? 'default' : 'secondary'} className="text-xs mt-1">
                              {property.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No properties found for your account</p>
                    <p className="text-sm">Contact Detroit City Hall to register your properties</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Select Property
                  </CardTitle>
                  <CardDescription>
                    Choose the property for tax payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {residentData?.properties.filter(p => p.taxOwed > 0).map((property) => (
                    <div 
                      key={property.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProperty?.id === property.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedProperty(property)}
                      data-testid={`payment-property-${property.propertyId}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{property.propertyId}</div>
                          <div className="text-sm text-gray-600">{property.address}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-red-600">{property.taxOwedFormatted}</div>
                          <div className="text-sm text-gray-600">Tax Owed</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Make Payment
                  </CardTitle>
                  <CardDescription>
                    Pay property taxes with crypto or traditional methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProperty ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Payment Amount ($)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={paymentData.amount}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                          data-testid="payment-amount-input"
                        />
                        <p className="text-sm text-gray-600">
                          Maximum: ${(selectedProperty.taxOwed / 100).toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select 
                          value={paymentData.paymentMethod} 
                          onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
                        >
                          <SelectTrigger data-testid="payment-method-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usdc">USDC (Crypto)</SelectItem>
                            <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                            <SelectItem value="fiat">Credit Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(paymentData.paymentMethod === 'usdc' || paymentData.paymentMethod === 'eth') && (
                        <div className="space-y-2">
                          <Label htmlFor="txHash">Transaction Hash (Optional)</Label>
                          <Input
                            id="txHash"
                            placeholder="0x..."
                            value={paymentData.txHash}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, txHash: e.target.value }))}
                            data-testid="transaction-hash-input"
                          />
                          <p className="text-sm text-gray-600">
                            Enter blockchain transaction hash for verification
                          </p>
                        </div>
                      )}

                      <Button 
                        onClick={handlePayment} 
                        disabled={!paymentData.amount || paymentMutation.isPending}
                        className="w-full"
                        data-testid="submit-payment-button"
                      >
                        {paymentMutation.isPending ? 'Processing...' : `Pay $${paymentData.amount || '0'}`}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a property to make a payment</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ownership Tab */}
          <TabsContent value="ownership" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Property Ownership
                </CardTitle>
                <CardDescription>
                  Your ownership stakes and fractional shares
                </CardDescription>
              </CardHeader>
              <CardContent>
                {residentData?.ownerships.length ? (
                  <div className="space-y-4">
                    {residentData.ownerships.map((ownership, index) => (
                      <div key={ownership.id || index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Property: {ownership.propertyId}</div>
                            <div className="text-sm text-gray-600">
                              Acquired: {new Date(ownership.acquiredAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-600">
                              {(parseFloat(ownership.fraction) * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">Ownership</div>
                          </div>
                        </div>
                        {ownership.transferTx && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-xs text-gray-600">
                              Blockchain TX: {ownership.transferTx.slice(0, 10)}...
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No ownership records found</p>
                    <p className="text-sm">Ownership records will appear here when you acquire property shares</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Blockchain Benefits */}
        <Card className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Detroit Blockchain Benefits</CardTitle>
            <CardDescription className="text-blue-100">
              Experience the future of municipal services with transparent, secure blockchain technology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span>Instant crypto payments</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span>Transparent ownership records</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-300" />
                <span>Fraud-proof audit trails</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}