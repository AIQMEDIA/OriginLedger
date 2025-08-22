import { Request, Response, NextFunction } from "express";
import { traceSupplyChainEvent } from "../phoenix-otel";

interface RateLimitRule {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    blocked: boolean;
  };
}

export class EnterpriseRateLimiter {
  private store: RateLimitStore = {};
  private rules: Map<string, RateLimitRule> = new Map();

  constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  addRule(pattern: string, rule: RateLimitRule): void {
    this.rules.set(pattern, rule);
  }

  createMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const identifier = this.getIdentifier(req);
      const matchedRule = this.findMatchingRule(req.path);
      
      if (!matchedRule) {
        return next();
      }

      const key = `${identifier}:${req.path}`;
      const now = Date.now();
      
      // Initialize or reset if window expired
      if (!this.store[key] || now >= this.store[key].resetTime) {
        this.store[key] = {
          count: 0,
          resetTime: now + matchedRule.windowMs,
          blocked: false
        };
      }

      const entry = this.store[key];
      
      // Check if already blocked in this window
      if (entry.blocked) {
        await this.logRateLimitViolation(req, identifier, 'blocked_request');
        return this.sendRateLimitResponse(res, matchedRule, entry);
      }

      // Increment counter
      entry.count++;

      // Check if limit exceeded
      if (entry.count > matchedRule.maxRequests) {
        entry.blocked = true;
        await this.logRateLimitViolation(req, identifier, 'limit_exceeded');
        return this.sendRateLimitResponse(res, matchedRule, entry);
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': matchedRule.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, matchedRule.maxRequests - entry.count).toString(),
        'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
      });

      next();
    };
  }

  private getIdentifier(req: Request): string {
    // Use authenticated user ID if available, otherwise IP
    const userId = (req as any).user?.id;
    return userId || req.ip || req.socket.remoteAddress || 'unknown';
  }

  private findMatchingRule(path: string): RateLimitRule | null {
    for (const pattern of this.rules.keys()) {
      const rule = this.rules.get(pattern);
      if (rule && (path.includes(pattern) || new RegExp(pattern).test(path))) {
        return rule;
      }
    }
    return null;
  }

  private async logRateLimitViolation(req: Request, identifier: string, type: string): Promise<void> {
    await traceSupplyChainEvent('Security.RateLimitViolation', {
      type,
      identifier,
      endpoint: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    }, async () => {
      console.warn(`⚠️  RATE LIMIT VIOLATION: ${type} for ${identifier} on ${req.path}`);
    });
  }

  private sendRateLimitResponse(res: Response, rule: RateLimitRule, entry: any): void {
    const retryAfter = Math.ceil((entry.resetTime - Date.now()) / 1000);
    
    res.set({
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Limit': rule.maxRequests.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
    });

    res.status(429).json({
      error: 'Too Many Requests',
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter
    });
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now >= this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
}

// Create global rate limiter instance
export const rateLimiter = new EnterpriseRateLimiter();

// Configure default rules
rateLimiter.addRule('/api/auth', { windowMs: 15 * 60 * 1000, maxRequests: 5 }); // Auth: 5 per 15 min
rateLimiter.addRule('/api/assets', { windowMs: 60 * 1000, maxRequests: 100 }); // Assets: 100 per minute  
rateLimiter.addRule('/api/participants', { windowMs: 60 * 1000, maxRequests: 50 }); // Participants: 50 per minute
rateLimiter.addRule('/api/blockchain', { windowMs: 60 * 1000, maxRequests: 20 }); // Blockchain: 20 per minute
rateLimiter.addRule('/api/events', { windowMs: 60 * 1000, maxRequests: 200 }); // Events: 200 per minute