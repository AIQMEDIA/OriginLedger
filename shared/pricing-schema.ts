import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";

// Subscription Plans Table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  pricePerUserMonth: decimal("price_per_user_month", { precision: 10, scale: 2 }),
  pricePerAssetMonth: decimal("price_per_asset_month", { precision: 10, scale: 2 }),
  customPricing: boolean("custom_pricing").default(false),
  maxUsers: integer("max_users"),
  maxAssets: integer("max_assets"),
  features: jsonb("features").$type<string[]>().default([]),
  trialDays: integer("trial_days").default(14),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Organization Subscriptions Table
export const organizationSubscriptions = pgTable("organization_subscriptions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  planId: text("plan_id").references(() => subscriptionPlans.id),
  status: text("status", { enum: ["trial", "active", "cancelled", "expired", "suspended"] }).notNull(),
  billingCycle: text("billing_cycle", { enum: ["monthly", "annual"] }).default("monthly"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialEnd: timestamp("trial_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  userCount: integer("user_count").default(1),
  assetCount: integer("asset_count").default(0),
  customPricePerUser: decimal("custom_price_per_user", { precision: 10, scale: 2 }),
  customPricePerAsset: decimal("custom_price_per_asset", { precision: 10, scale: 2 }),
  setupFee: decimal("setup_fee", { precision: 10, scale: 2 }).default("0"),
  annualDiscount: decimal("annual_discount", { precision: 3, scale: 2 }).default("0.15"), // 15% default
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Billing History Table
export const billingHistory = pgTable("billing_history", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").references(() => organizationSubscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  description: text("description"),
  billingDate: timestamp("billing_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: text("status", { enum: ["pending", "paid", "failed", "refunded"] }).notNull(),
  invoiceUrl: text("invoice_url"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow()
});

// Usage Metrics Table
export const usageMetrics = pgTable("usage_metrics", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").references(() => organizationSubscriptions.id),
  metricType: text("metric_type", { enum: ["users", "assets", "events", "api_calls", "storage"] }).notNull(),
  value: integer("value").notNull(),
  period: text("period").notNull(), // YYYY-MM format
  recordedAt: timestamp("recorded_at").defaultNow()
});

// Schema types
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertOrganizationSubscriptionSchema = createInsertSchema(organizationSubscriptions);
export const insertBillingHistorySchema = createInsertSchema(billingHistory);
export const insertUsageMetricsSchema = createInsertSchema(usageMetrics);

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type OrganizationSubscription = typeof organizationSubscriptions.$inferSelect;
export type BillingHistory = typeof billingHistory.$inferSelect;
export type UsageMetrics = typeof usageMetrics.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type InsertOrganizationSubscription = z.infer<typeof insertOrganizationSubscriptionSchema>;
export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;
export type InsertUsageMetrics = z.infer<typeof insertUsageMetricsSchema>;

// Pricing calculation utilities
export const calculateMonthlyPrice = (
  plan: SubscriptionPlan,
  userCount: number,
  assetCount: number,
  customUserPrice?: string,
  customAssetPrice?: string
): number => {
  const userPrice = customUserPrice ? parseFloat(customUserPrice) : parseFloat(plan.pricePerUserMonth || "0");
  const assetPrice = customAssetPrice ? parseFloat(customAssetPrice) : parseFloat(plan.pricePerAssetMonth || "0");
  
  return (userPrice * userCount) + (assetPrice * assetCount);
};

export const calculateAnnualPrice = (
  monthlyPrice: number,
  discount: number = 0.15
): number => {
  return monthlyPrice * 12 * (1 - discount);
};

// Plan feature definitions
export const PLAN_FEATURES = {
  free: [
    "Up to 3 users",
    "Up to 50 assets", 
    "Basic tracking",
    "Email support",
    "14-day history"
  ],
  business: [
    "Up to 50 users",
    "Up to 500 assets",
    "Advanced tracking & reporting",
    "Priority email support",
    "API integrations",
    "Export functionality",
    "90-day history"
  ],
  enterprise: [
    "Unlimited users",
    "Unlimited assets", 
    "Custom integrations",
    "SSO authentication",
    "Dedicated account manager",
    "Advanced security",
    "Multi-region support",
    "Unlimited history",
    "SLA guarantees"
  ],
  custom: [
    "All Enterprise features",
    "API-only access",
    "On-premises deployment",
    "Custom audit tools",
    "White-label options",
    "Custom SLA",
    "24/7 phone support"
  ]
} as const;