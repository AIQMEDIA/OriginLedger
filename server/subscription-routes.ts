import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { subscriptionStorage } from './subscription-storage';
import { requireAuth } from './auth';

const router = Router();

// Get all available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionStorage.getAllPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch plans', 
      code: 'FETCH_PLANS_ERROR' 
    });
  }
});

// Get specific plan details with pricing calculator
router.get('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { users = 1, assets = 0, billing = 'monthly' } = req.query;
    
    const plan = await subscriptionStorage.getPlanById(id);
    if (!plan) {
      return res.status(404).json({ 
        error: 'Plan not found', 
        code: 'PLAN_NOT_FOUND' 
      });
    }

    const userCount = parseInt(users as string);
    const assetCount = parseInt(assets as string);
    const billingCycle = billing as 'monthly' | 'annual';

    const pricing = subscriptionStorage.calculateSubscriptionPrice(
      plan, 
      userCount, 
      assetCount, 
      billingCycle
    );

    res.json({
      plan,
      pricing,
      breakdown: {
        users: userCount,
        assets: assetCount,
        userPrice: parseFloat(plan.pricePerUserMonth || "0"),
        assetPrice: parseFloat(plan.pricePerAssetMonth || "0"),
        billingCycle
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch plan details', 
      code: 'PLAN_DETAILS_ERROR' 
    });
  }
});

// Get current organization subscription
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId || `${user.username.toLowerCase()}-org`;
    
    const subscription = await subscriptionStorage.getSubscriptionByOrgId(organizationId);
    if (!subscription) {
      return res.status(404).json({ 
        error: 'No subscription found', 
        code: 'SUBSCRIPTION_NOT_FOUND' 
      });
    }

    const plan = await subscriptionStorage.getPlanById(subscription.planId!);
    const billingHistory = await subscriptionStorage.getBillingHistory(subscription.id);
    const usage = await subscriptionStorage.getUsageBySubscription(subscription.id);

    res.json({
      subscription,
      plan,
      billingHistory: billingHistory.slice(0, 5), // Last 5 records
      currentUsage: usage.filter(u => u.period === new Date().toISOString().slice(0, 7)) // Current month
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch subscription', 
      code: 'SUBSCRIPTION_FETCH_ERROR' 
    });
  }
});

// Update subscription (upgrade/downgrade)
const updateSubscriptionSchema = z.object({
  planId: z.string(),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
  userCount: z.number().min(1).optional(),
  assetCount: z.number().min(0).optional()
});

router.patch('/subscription', requireAuth, async (req, res) => {
  try {
    const validation = updateSubscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues
      });
    }

    const user = (req as any).user;
    const organizationId = user.organizationId || `${user.username.toLowerCase()}-org`;
    const { planId, billingCycle, userCount, assetCount } = validation.data;

    const subscription = await subscriptionStorage.getSubscriptionByOrgId(organizationId);
    if (!subscription) {
      return res.status(404).json({ 
        error: 'No subscription found', 
        code: 'SUBSCRIPTION_NOT_FOUND' 
      });
    }

    const newPlan = await subscriptionStorage.getPlanById(planId);
    if (!newPlan) {
      return res.status(404).json({ 
        error: 'Plan not found', 
        code: 'PLAN_NOT_FOUND' 
      });
    }

    // Calculate new pricing
    const finalUserCount = userCount || subscription.userCount || 1;
    const finalAssetCount = assetCount || subscription.assetCount || 0;
    const pricing = subscriptionStorage.calculateSubscriptionPrice(
      newPlan,
      finalUserCount,
      finalAssetCount,
      billingCycle || subscription.billingCycle || 'monthly'
    );

    // Update subscription
    const now = new Date();
    const updatedSubscription = await subscriptionStorage.updateSubscription(subscription.id, {
      planId,
      billingCycle: billingCycle || subscription.billingCycle,
      userCount: finalUserCount,
      assetCount: finalAssetCount,
      updatedAt: now
    });

    // Create billing record for the change
    if (updatedSubscription) {
      const amount = billingCycle === 'annual' ? pricing.annual : pricing.monthly;
      await subscriptionStorage.createBillingRecord({
        id: randomUUID(),
        subscriptionId: subscription.id,
        amount: amount.toString(),
        description: `Plan change to ${newPlan.displayName}`,
        billingDate: now,
        status: 'pending'
      });
    }

    res.json({
      subscription: updatedSubscription,
      plan: newPlan,
      pricing,
      message: `Successfully updated subscription to ${newPlan.displayName}`
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update subscription', 
      code: 'SUBSCRIPTION_UPDATE_ERROR' 
    });
  }
});

// Start trial for new organization
const startTrialSchema = z.object({
  planId: z.string(),
  userCount: z.number().min(1).max(100),
  assetCount: z.number().min(0).max(1000)
});

router.post('/trial', requireAuth, async (req, res) => {
  try {
    const validation = startTrialSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues
      });
    }

    const user = (req as any).user;
    const organizationId = user.organizationId || `${user.username.toLowerCase()}-org`;
    const { planId, userCount, assetCount } = validation.data;

    // Check if subscription already exists
    const existingSubscription = await subscriptionStorage.getSubscriptionByOrgId(organizationId);
    if (existingSubscription) {
      return res.status(409).json({ 
        error: 'Organization already has a subscription', 
        code: 'SUBSCRIPTION_EXISTS' 
      });
    }

    const plan = await subscriptionStorage.getPlanById(planId);
    if (!plan) {
      return res.status(404).json({ 
        error: 'Plan not found', 
        code: 'PLAN_NOT_FOUND' 
      });
    }

    // Create trial subscription
    const subscription = await subscriptionStorage.createSubscription({
      id: randomUUID(),
      organizationId,
      planId,
      userCount,
      assetCount,
      billingCycle: 'monthly',
      status: 'trial'
    });

    res.status(201).json({
      subscription,
      plan,
      message: `Trial started for ${plan.displayName}`,
      trialEndsAt: subscription.trialEnd
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to start trial', 
      code: 'TRIAL_START_ERROR' 
    });
  }
});

// Cancel subscription
router.post('/subscription/cancel', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId || `${user.username.toLowerCase()}-org`;
    const { cancelAtPeriodEnd = true } = req.body;

    const subscription = await subscriptionStorage.getSubscriptionByOrgId(organizationId);
    if (!subscription) {
      return res.status(404).json({ 
        error: 'No subscription found', 
        code: 'SUBSCRIPTION_NOT_FOUND' 
      });
    }

    const updatedSubscription = await subscriptionStorage.updateSubscription(subscription.id, {
      cancelAtPeriodEnd,
      status: cancelAtPeriodEnd ? subscription.status : 'cancelled',
      updatedAt: new Date()
    });

    res.json({
      subscription: updatedSubscription,
      message: cancelAtPeriodEnd 
        ? 'Subscription will be cancelled at the end of the current billing period'
        : 'Subscription cancelled immediately'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to cancel subscription', 
      code: 'SUBSCRIPTION_CANCEL_ERROR' 
    });
  }
});

// Get billing history
router.get('/billing', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId || `${user.username.toLowerCase()}-org`;

    const subscription = await subscriptionStorage.getSubscriptionByOrgId(organizationId);
    if (!subscription) {
      return res.status(404).json({ 
        error: 'No subscription found', 
        code: 'SUBSCRIPTION_NOT_FOUND' 
      });
    }

    const billingHistory = await subscriptionStorage.getBillingHistory(subscription.id);
    
    res.json({
      billingHistory,
      total: billingHistory.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch billing history', 
      code: 'BILLING_FETCH_ERROR' 
    });
  }
});

// Record usage (for metered billing)
const recordUsageSchema = z.object({
  metricType: z.enum(['users', 'assets', 'events', 'api_calls', 'storage']),
  value: z.number().min(0),
  period: z.string().regex(/^\d{4}-\d{2}$/) // YYYY-MM format
});

router.post('/usage', requireAuth, async (req, res) => {
  try {
    const validation = recordUsageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues
      });
    }

    const user = (req as any).user;
    const organizationId = user.organizationId || `${user.username.toLowerCase()}-org`;
    const { metricType, value, period } = validation.data;

    const subscription = await subscriptionStorage.getSubscriptionByOrgId(organizationId);
    if (!subscription) {
      return res.status(404).json({ 
        error: 'No subscription found', 
        code: 'SUBSCRIPTION_NOT_FOUND' 
      });
    }

    const usage = await subscriptionStorage.recordUsage({
      id: randomUUID(),
      subscriptionId: subscription.id,
      metricType,
      value,
      period
    });

    res.status(201).json({
      usage,
      message: `Usage recorded for ${metricType}`
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to record usage', 
      code: 'USAGE_RECORD_ERROR' 
    });
  }
});

// Initialize demo subscriptions
router.post('/demo/initialize', async (req, res) => {
  try {
    await subscriptionStorage.initializeDemoSubscriptions();
    res.json({ message: 'Demo subscriptions initialized successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to initialize demo subscriptions', 
      code: 'DEMO_INIT_ERROR' 
    });
  }
});

export default router;