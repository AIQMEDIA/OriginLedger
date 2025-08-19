import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AuthenticatedOnly } from "@/components/auth/role-guard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CreditCard,
  Check,
  Star,
  Users,
  Package,
  Shield,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Settings,
  Download
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  pricePerUserMonth: string;
  pricePerAssetMonth: string;
  customPricing: boolean;
  maxUsers: number | null;
  maxAssets: number | null;
  features: string[];
  trialDays: number;
  sortOrder: number;
}

interface OrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string;
  userCount: number;
  assetCount: number;
  cancelAtPeriodEnd: boolean;
}

interface BillingRecord {
  id: string;
  amount: string;
  currency: string;
  description: string;
  billingDate: string;
  paidDate: string;
  status: string;
}

function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [userCount, setUserCount] = useState(10);
  const [assetCount, setAssetCount] = useState(100);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription/plans'],
  });

  // Fetch current subscription
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/subscription/subscription'],
  });

  // Fetch billing history
  const { data: billingData } = useQuery({
    queryKey: ['/api/subscription/billing'],
  });

  // Start trial mutation
  const startTrialMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch(`/api/subscription/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          planId,
          userCount,
          assetCount
        })
      });
      if (!response.ok) throw new Error('Failed to start trial');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trial Started!",
        description: "Your free trial has been activated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Trial",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: { planId: string; billingCycle?: string }) => {
      const response = await fetch(`/api/subscription/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const getPlanPricing = (plan: SubscriptionPlan) => {
    if (plan.customPricing) {
      return { monthly: 0, annual: 0, savings: 0 };
    }

    const userPrice = parseFloat(plan.pricePerUserMonth || "0");
    const assetPrice = parseFloat(plan.pricePerAssetMonth || "0");
    const monthly = (userPrice * userCount) + (assetPrice * assetCount);
    const annual = monthly * 12 * 0.85; // 15% discount
    const savings = (monthly * 12) - annual;

    return { monthly, annual, savings };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "trial": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "expired": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-green-600";
      case "pending": return "text-yellow-600";
      case "failed": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  const currentSubscription = subscriptionData?.subscription as OrganizationSubscription | undefined;
  const currentPlan = subscriptionData?.plan as SubscriptionPlan | undefined;
  const billingHistory = billingData?.billingHistory as BillingRecord[] || [];

  return (
    <AuthenticatedOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Subscription & Billing</h2>
            <p className="text-muted-foreground">
              Manage your OriginLedger subscription and billing preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue={currentSubscription ? "current" : "plans"} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="plans">Available Plans</TabsTrigger>
            <TabsTrigger value="current" disabled={!currentSubscription}>Current Plan</TabsTrigger>
            <TabsTrigger value="billing" disabled={!currentSubscription}>Billing History</TabsTrigger>
            <TabsTrigger value="usage" disabled={!currentSubscription}>Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Plan</CardTitle>
                <CardDescription>
                  Select the perfect plan for your organization's supply chain tracking needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Pricing Calculator */}
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-4">Estimate Your Costs</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium">Users</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="number"
                          value={userCount}
                          onChange={(e) => setUserCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 px-2 py-1 text-sm border rounded"
                          min="1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Assets</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="number"
                          value={assetCount}
                          onChange={(e) => setAssetCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-20 px-2 py-1 text-sm border rounded"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Billing</label>
                      <select 
                        value={billingCycle}
                        onChange={(e) => setBillingCycle(e.target.value as "monthly" | "annual")}
                        className="w-full px-2 py-1 text-sm border rounded mt-1"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual (15% off)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {(plans as SubscriptionPlan[]).map((plan: SubscriptionPlan) => {
                    const pricing = getPlanPricing(plan);
                    const isPopular = plan.name === "business";
                    const price = billingCycle === "annual" ? pricing.annual : pricing.monthly;
                    const pricePerMonth = billingCycle === "annual" ? pricing.annual / 12 : pricing.monthly;

                    return (
                      <Card key={plan.id} className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground">
                              <Star className="h-3 w-3 mr-1" />
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader className="text-center">
                          <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                          
                          <div className="py-4">
                            {plan.customPricing ? (
                              <div className="text-2xl font-bold">Custom</div>
                            ) : (
                              <>
                                <div className="text-3xl font-bold">
                                  ${Math.round(pricePerMonth).toLocaleString()}
                                  <span className="text-lg font-normal text-muted-foreground">/mo</span>
                                </div>
                                {billingCycle === "annual" && pricing.savings > 0 && (
                                  <div className="text-sm text-green-600">
                                    Save ${Math.round(pricing.savings).toLocaleString()}/year
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {plan.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-4">
                            {currentSubscription?.planId === plan.id ? (
                              <Badge variant="outline" className="w-full justify-center py-2">
                                Current Plan
                              </Badge>
                            ) : plan.customPricing ? (
                              <Button variant="outline" className="w-full">
                                Contact Sales
                              </Button>
                            ) : currentSubscription ? (
                              <Button
                                onClick={() => updateSubscriptionMutation.mutate({ planId: plan.id, billingCycle })}
                                disabled={updateSubscriptionMutation.isPending}
                                className="w-full"
                              >
                                Upgrade to {plan.displayName}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => startTrialMutation.mutate(plan.id)}
                                disabled={startTrialMutation.isPending}
                                variant={isPopular ? "default" : "outline"}
                                className="w-full"
                              >
                                Start Free Trial
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="current" className="space-y-6">
            {currentSubscription && currentPlan && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {currentPlan.displayName}
                          <Badge className={getStatusColor(currentSubscription.status)}>
                            {currentSubscription.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{currentPlan.description}</CardDescription>
                      </div>
                      <Settings className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Users</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-2xl font-bold">{currentSubscription.userCount}</span>
                          {currentPlan.maxUsers && (
                            <span className="text-sm text-muted-foreground">/ {currentPlan.maxUsers}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Assets</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-2xl font-bold">{currentSubscription.assetCount}</span>
                          {currentPlan.maxAssets && (
                            <span className="text-sm text-muted-foreground">/ {currentPlan.maxAssets}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Billing</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-2xl font-bold capitalize">{currentSubscription.billingCycle}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Current Period</label>
                        <p className="mt-1">
                          {new Date(currentSubscription.currentPeriodStart).toLocaleDateString()} - {" "}
                          {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      {currentSubscription.status === "trial" && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Trial Ends</label>
                          <p className="mt-1 text-orange-600 font-medium">
                            {new Date(currentSubscription.trialEnd).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {currentSubscription.cancelAtPeriodEnd && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Your subscription will be cancelled at the end of the current billing period.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Button variant="outline">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Upgrade Plan
                      </Button>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Update Billing
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Invoice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View your past invoices and payment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {billingHistory.length > 0 ? (
                  <div className="space-y-4">
                    {billingHistory.map((record: BillingRecord) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{record.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.billingDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${parseFloat(record.amount).toLocaleString()}</p>
                          <p className={`text-sm capitalize ${getBillingStatusColor(record.status)}`}>
                            {record.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No billing history available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
                <CardDescription>
                  Monitor your current usage against plan limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Users</span>
                      <span className="text-sm text-muted-foreground">
                        {currentSubscription?.userCount} / {currentPlan?.maxUsers || "Unlimited"}
                      </span>
                    </div>
                    <Progress 
                      value={currentPlan?.maxUsers ? (currentSubscription?.userCount || 0) / currentPlan.maxUsers * 100 : 0}
                      className="h-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Assets</span>
                      <span className="text-sm text-muted-foreground">
                        {currentSubscription?.assetCount} / {currentPlan?.maxAssets || "Unlimited"}
                      </span>
                    </div>
                    <Progress 
                      value={currentPlan?.maxAssets ? (currentSubscription?.assetCount || 0) / currentPlan.maxAssets * 100 : 0}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedOnly>
  );
}

export default Subscription;