import { Express, Request, Response, NextFunction } from 'express';

// Comprehensive IP Protection Middleware
export function addIPProtectionHeaders(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Add copyright headers to all responses
    res.setHeader('X-Copyright', 'Copyright 2025 OriginLedger Technologies LLC All Rights Reserved');
    res.setHeader('X-Proprietary-Notice', 'CONFIDENTIAL PROPRIETARY Unauthorized use prohibited');
    res.setHeader('X-Patent-Status', 'Patent Pending Municipal Blockchain Integration System');
    res.setHeader('X-Trademark', 'OriginLedger Municipal Blockchain Platform Property NFT Fractionalization');
    res.setHeader('X-Legal-Warning', 'Violation may result in immediate legal action');
    
    next();
  });

  // API response watermarking
  app.use('/api/*', (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Add IP protection notice to all API responses
      const protectedResponse = {
        ...data,
        __copyright: '© 2025 OriginLedger Technologies, LLC',
        __legal_notice: 'PROPRIETARY & CONFIDENTIAL - Detroit stakeholder evaluation only',
        __patent_status: 'Patent Pending Technologies - Unauthorized copying prohibited',
        __trademark: 'OriginLedger™ - Municipal Blockchain Platform™'
      };
      
      return originalJson.call(this, protectedResponse);
    };
    
    next();
  });
}

// Detroit stakeholder specific protection
export function detroitStakeholderNotice(req: Request, res: Response, next: NextFunction) {
  if (req.path.includes('/detroit')) {
    res.setHeader('X-Detroit-Notice', 'Confidential demonstration for authorized Detroit municipal stakeholders only');
    res.setHeader('X-Evaluation-Only', 'This system is provided for partnership evaluation purposes only');
  }
  next();
}

// Console logging with IP protection
export function logIPProtectedAccess(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  if (req.path.startsWith('/api')) {
    console.log(`🔒 IP PROTECTED ACCESS: ${req.method} ${req.path} | IP: ${ip} | UA: ${userAgent.substring(0, 50)}`);
  }
  
  next();
}