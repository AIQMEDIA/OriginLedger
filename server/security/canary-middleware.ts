import { randomInt } from "crypto";
import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { traceSupplyChainEvent } from "../phoenix-otel";
import { SecurityCanaryEvent } from "@shared/schema";

const FAKE_503_MESSAGES = [
  "Service Unavailable", 
  "Service temporarily unavailable", 
  "Maintenance Scheduled",
  "System overload detected",
  "Resource temporarily exhausted"
];

const FAKE_DELAY_SECONDS = [625, 1646, 2950, 4200, 5850];

export interface SecurityCanaryConfig {
  trackedEndpoints: string[];
  enableDeception: boolean;
  logAllAttempts: boolean;
}

export function createCanaryProtection(config: SecurityCanaryConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const isCanaryEndpoint = config.trackedEndpoints.some(endpoint => 
      req.path.includes(endpoint) || req.path === endpoint
    );

    if (isCanaryEndpoint) {
      // Generate randomized fake response
      const delaySec = FAKE_DELAY_SECONDS[Math.floor(Math.random() * FAKE_DELAY_SECONDS.length)];
      const fakeMessage = FAKE_503_MESSAGES[Math.floor(Math.random() * FAKE_503_MESSAGES.length)];
      
      // Create canary event with full forensic context
      const canaryEvent: SecurityCanaryEvent = {
        eventType: req.path.includes('api') ? 'api_probe' : 'general',
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        endpoint: req.path,
        method: req.method,
        severity: 'high',
        context: {
          headers: req.headers,
          query: req.query,
          body: req.body,
          params: req.params,
          referer: req.headers.referer,
          origin: req.headers.origin
        },
        fakeResponse: `HTTP 503 (Retry-After: ${delaySec}s)`,
        timestamp: new Date(),
      };

      // Log to Arize Phoenix for monitoring
      await traceSupplyChainEvent('Security.CanaryTriggered', {
        eventType: canaryEvent.eventType,
        endpoint: canaryEvent.endpoint,
        ip: canaryEvent.ip,
        severity: canaryEvent.severity,
        method: canaryEvent.method,
        userAgent: canaryEvent.userAgent
      }, async () => {
        // Store canary event (would be implemented in storage interface)
        console.warn(`🚨 SECURITY CANARY TRIGGERED: ${canaryEvent.endpoint} from ${canaryEvent.ip}`);
      });

      // Respond with convincing fake error
      if (config.enableDeception) {
        res.set('Retry-After', String(delaySec));
        res.set('X-RateLimit-Limit', '100');
        res.set('X-RateLimit-Remaining', '0');
        res.status(503).json({
          error: fakeMessage,
          code: 'SERVICE_UNAVAILABLE',
          retryAfter: delaySec,
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    next();
  };
}

// Predefined canary endpoints that look like real admin/internal endpoints
export const DEFAULT_CANARY_ENDPOINTS = [
  '/admin',
  '/admin/dashboard',
  '/admin/users',
  '/admin/config', 
  '/api/internal',
  '/api/admin',
  '/api/debug',
  '/debug',
  '/console',
  '/.env',
  '/config',
  '/backup',
  '/logs',
  '/metrics',
  '/health-internal',
  '/status-internal',
  '/.well-known/security',
  '/robots.txt.backup',
  '/admin-panel',
  '/management',
  '/internal-api'
];