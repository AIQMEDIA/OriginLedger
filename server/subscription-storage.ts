import { randomUUID } from 'crypto';
import {
  SubscriptionPlan,
  OrganizationSubscription,
  BillingHistory,
  UsageMetrics,
  InsertSubscriptionPlan,
  InsertOrganizationSubscription,
  InsertBillingHistory,
  InsertUsageMetrics,
  PLAN_FEATURES
} from '../shared/pricing-schema';

// In-memory storage for subscription data
export class SubscriptionStorage {
  private plans = new Map<string, SubscriptionPlan>();
  private subscriptions = new Map<string, OrganizationSubscription>();
  private billingHistory = new Map<string, BillingHistory>();
  private usageMetrics = new Map<string, UsageMetrics>();

  constructor() {
    this.initializeDefaultPlans();
  }

  private initializeDefaultPlans() {
    const defaultPlans: InsertSubscriptionPlan[] = [
      {
        id: "free",
        name: "free",
        displayName: "Free Trial",
        description: "Perfect for getting started with supply chain tracking",
        pricePerUserMonth: "0.00",
        pricePerAssetMonth: "0.00",
        maxUsers: 3,
        maxAssets: 50,
        features: [...PLAN_FEATURES.free],
        trialDays: 30,
        sortOrder: 1
      },
      {
        id: "business",
        name: "business",
        displayName: "Business",
        description: "Advanced tracking and reporting for growing businesses",
        pricePerUserMonth: "75.00",
        pricePerAssetMonth: "0.00",
        maxUsers: 50,
        maxAssets: 500,
        features: [...PLAN_FEATURES.business],
        trialDays: 14,
        sortOrder: 2
      },
      {
        id: "enterprise",
        name: "enterprise", 
        displayName: "Enterprise",
        description: "Full-featured solution with dedicated support for large organizations",
        pricePerUserMonth: "175.00",
        pricePerAssetMonth: "1.00",
        maxUsers: null,
        maxAssets: null,
        features: [...PLAN_FEATURES.enterprise],
        trialDays: 14,
        sortOrder: 3
      },
      {
        id: "custom",
        name: "custom",
        displayName: "Custom Enterprise",
        description: "Tailored solution with custom pricing for enterprise consortiums",
        customPricing: true,
        maxUsers: null,
        maxAssets: null,
        features: [...PLAN_FEATURES.custom],
        trialDays: 30,
        sortOrder: 4
      }
    ];

    defaultPlans.forEach(plan => {
      this.plans.set(plan.id, {
        ...plan,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });
    });
  }

  // Plan management
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.plans.values())
      .filter(plan => plan.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getPlanById(id: string): Promise<SubscriptionPlan | null> {
    return this.plans.get(id) || null;
  }

  async createPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const newPlan: SubscriptionPlan = {
      ...plan,
      id: plan.id || randomUUID(),
      description: plan.description || null,
      pricePerUserMonth: plan.pricePerUserMonth || null,
      pricePerAssetMonth: plan.pricePerAssetMonth || null,
      customPricing: plan.customPricing || false,
      maxUsers: plan.maxUsers || null,
      maxAssets: plan.maxAssets || null,
      features: plan.features || [],
      trialDays: plan.trialDays || 14,
      isActive: plan.isActive || true,
      sortOrder: plan.sortOrder || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.plans.set(newPlan.id, newPlan);
    return newPlan;
  }

  // Subscription management
  async getSubscriptionByOrgId(organizationId: string): Promise<OrganizationSubscription | null> {
    return Array.from(this.subscriptions.values())
      .find(sub => sub.organizationId === organizationId) || null;
  }

  async createSubscription(subscription: InsertOrganizationSubscription): Promise<OrganizationSubscription> {
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(now.getDate() + 14); // Default 14-day trial

    const newSubscription: OrganizationSubscription = {
      ...subscription,
      id: subscription.id || randomUUID(),
      planId: subscription.planId || null,
      status: "trial",
      billingCycle: subscription.billingCycle || "monthly",
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      userCount: subscription.userCount || 1,
      assetCount: subscription.assetCount || 0,
      customPricePerUser: subscription.customPricePerUser || null,
      customPricePerAsset: subscription.customPricePerAsset || null,
      setupFee: subscription.setupFee || "0",
      annualDiscount: subscription.annualDiscount || "0.15",
      metadata: subscription.metadata || null,
      createdAt: now,
      updatedAt: now
    };

    this.subscriptions.set(newSubscription.id, newSubscription);
    return newSubscription;
  }

  async updateSubscription(id: string, updates: Partial<OrganizationSubscription>): Promise<OrganizationSubscription | null> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return null;

    const updated = {
      ...subscription,
      ...updates,
      updatedAt: new Date()
    };

    this.subscriptions.set(id, updated);
    return updated;
  }

  // Usage tracking
  async recordUsage(usage: InsertUsageMetrics): Promise<UsageMetrics> {
    const newUsage: UsageMetrics = {
      ...usage,
      id: usage.id || randomUUID(),
      subscriptionId: usage.subscriptionId || null,
      recordedAt: new Date()
    };

    this.usageMetrics.set(newUsage.id, newUsage);
    return newUsage;
  }

  async getUsageBySubscription(subscriptionId: string, period?: string): Promise<UsageMetrics[]> {
    return Array.from(this.usageMetrics.values())
      .filter(metric => 
        metric.subscriptionId === subscriptionId && 
        (!period || metric.period === period)
      )
      .sort((a, b) => (b.recordedAt?.getTime() || 0) - (a.recordedAt?.getTime() || 0));
  }

  // Billing management
  async createBillingRecord(billing: InsertBillingHistory): Promise<BillingHistory> {
    const newBilling: BillingHistory = {
      ...billing,
      id: billing.id || randomUUID(),
      subscriptionId: billing.subscriptionId || null,
      currency: billing.currency || "USD",
      description: billing.description || null,
      paidDate: billing.paidDate || null,
      invoiceUrl: billing.invoiceUrl || null,
      metadata: billing.metadata || null,
      createdAt: new Date()
    };

    this.billingHistory.set(newBilling.id, newBilling);
    return newBilling;
  }

  async getBillingHistory(subscriptionId: string): Promise<BillingHistory[]> {
    return Array.from(this.billingHistory.values())
      .filter(record => record.subscriptionId === subscriptionId)
      .sort((a, b) => b.billingDate.getTime() - a.billingDate.getTime());
  }

  // Pricing calculations
  calculateSubscriptionPrice(
    plan: SubscriptionPlan,
    userCount: number,
    assetCount: number,
    billingCycle: 'monthly' | 'annual' = 'monthly',
    customUserPrice?: string,
    customAssetPrice?: string,
    annualDiscount: number = 0.15
  ): { monthly: number; annual: number; savings: number } {
    if (plan.customPricing) {
      return { monthly: 0, annual: 0, savings: 0 };
    }

    const userPrice = customUserPrice ? parseFloat(customUserPrice) : parseFloat(plan.pricePerUserMonth || "0");
    const assetPrice = customAssetPrice ? parseFloat(customAssetPrice) : parseFloat(plan.pricePerAssetMonth || "0");
    
    const monthly = (userPrice * userCount) + (assetPrice * assetCount);
    const annual = monthly * 12 * (1 - annualDiscount);
    const savings = (monthly * 12) - annual;

    return { monthly, annual, savings };
  }

  // Demo data for testing
  async initializeDemoSubscriptions(): Promise<void> {
    // Create demo subscriptions for existing organizations
    const demoOrgs = [
      { id: "acme-corp", planId: "enterprise", userCount: 25, assetCount: 150 },
      { id: "global-logistics", planId: "business", userCount: 12, assetCount: 75 },
      { id: "tech-mart", planId: "business", userCount: 8, assetCount: 45 }
    ];

    for (const org of demoOrgs) {
      const existing = await this.getSubscriptionByOrgId(org.id);
      if (!existing) {
        await this.createSubscription({
          id: randomUUID(),
          organizationId: org.id,
          planId: org.planId,
          userCount: org.userCount,
          assetCount: org.assetCount,
          billingCycle: "annual",
          status: "active"
        });

        // Add some demo billing history
        const subscription = await this.getSubscriptionByOrgId(org.id);
        if (subscription) {
          const plan = await this.getPlanById(org.planId);
          if (plan) {
            const pricing = this.calculateSubscriptionPrice(plan, org.userCount, org.assetCount, "annual");
            
            await this.createBillingRecord({
              id: randomUUID(),
              subscriptionId: subscription.id,
              amount: pricing.annual.toString(),
              description: `Annual subscription - ${plan.displayName}`,
              billingDate: new Date(2024, 0, 1), // January 1, 2024
              paidDate: new Date(2024, 0, 3),
              status: "paid"
            });
          }
        }
      }
    }
  }
}

export const subscriptionStorage = new SubscriptionStorage();