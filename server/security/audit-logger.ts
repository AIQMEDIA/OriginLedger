import { Request } from "express";
import { traceSupplyChainEvent } from "../phoenix-otel";

export interface SecurityAuditEntry {
  userId?: string;
  action: string;
  resource?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  riskScore: number;
  metadata?: Record<string, any>;
}

export class SecurityAuditLogger {
  
  async logSecurityEvent(entry: SecurityAuditEntry): Promise<void> {
    // Trace to Arize Phoenix for enterprise monitoring
    await traceSupplyChainEvent('Security.AuditEvent', {
      action: entry.action,
      userId: entry.userId,
      resource: entry.resource,
      success: entry.success,
      riskScore: entry.riskScore,
      ipAddress: entry.ipAddress
    }, async () => {
      // In production, this would write to the security_audit_log table
      console.log(`🔒 SECURITY AUDIT: ${entry.action} | User: ${entry.userId || 'anonymous'} | Success: ${entry.success} | Risk: ${entry.riskScore}`);
    });
  }

  async logLoginAttempt(req: Request, userId?: string, success: boolean = false): Promise<void> {
    const riskScore = this.calculateLoginRiskScore(req, success);
    
    await this.logSecurityEvent({
      userId,
      action: 'login_attempt',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      success,
      riskScore,
      metadata: {
        timestamp: new Date().toISOString(),
        endpoint: req.path,
        method: req.method
      }
    });
  }

  async logAssetAccess(req: Request, userId: string, assetId: string, success: boolean = true): Promise<void> {
    await this.logSecurityEvent({
      userId,
      action: 'asset_access',
      resource: assetId,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      success,
      riskScore: success ? 10 : 50,
      metadata: {
        assetId,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logBlockchainWrite(req: Request, userId: string, blockId: string): Promise<void> {
    await this.logSecurityEvent({
      userId,
      action: 'blockchain_write',
      resource: blockId,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      success: true,
      riskScore: 5, // Low risk for legitimate blockchain operations
      metadata: {
        blockId,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logAPIAccess(req: Request, endpoint: string, statusCode: number, userId?: string): Promise<void> {
    const riskScore = this.calculateAPIRiskScore(req, statusCode);
    
    await this.logSecurityEvent({
      userId,
      action: 'api_access',
      resource: endpoint,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      success: statusCode < 400,
      riskScore,
      metadata: {
        endpoint,
        statusCode,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }

  private calculateLoginRiskScore(req: Request, success: boolean): number {
    let score = 0;
    
    // Base score for failed login
    if (!success) score += 30;
    
    // Check for suspicious user agents
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider')) {
      score += 40;
    }
    
    // Check for missing common headers
    if (!req.headers.referer && !req.headers.origin) {
      score += 20;
    }
    
    // Check for unusual methods
    if (req.method !== 'POST') {
      score += 25;
    }
    
    return Math.min(score, 100);
  }

  private calculateAPIRiskScore(req: Request, statusCode: number): number {
    let score = 0;
    
    // Failed requests
    if (statusCode >= 400) score += 15;
    if (statusCode >= 500) score += 10;
    
    // Suspicious endpoints
    if (req.path.includes('admin') || req.path.includes('internal') || req.path.includes('debug')) {
      score += 35;
    }
    
    // Unusual methods for API
    if (['DELETE', 'PATCH', 'PUT'].includes(req.method)) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }
}

export const auditLogger = new SecurityAuditLogger();