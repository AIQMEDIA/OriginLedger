import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || 'originledger-dev-secret-change-in-production';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Hash password (during registration)
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

// Check password (during login)
export function checkPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// JWT token creation (after login)
export function generateToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// Express middleware to protect routes
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'No token provided',
      code: 'UNAUTHORIZED',
      message: 'Include Authorization: Bearer <token> header'
    });
  }
  
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ 
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID',
      message: 'Please login again to get a valid token'
    });
  }
}

// Role-based access control middleware
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        message: `Role '${req.user.role}' not authorized for this action`
      });
    }
    
    next();
  };
}

// Optional authentication middleware (doesn't fail if no token)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  if (header && header.startsWith('Bearer ')) {
    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
    } catch (err) {
      // Token invalid but continue without user
    }
  }
  next();
}