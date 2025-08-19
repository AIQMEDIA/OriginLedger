import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, User } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export function RoleGuard({ 
  children, 
  allowedRoles = [], 
  requireAuth = false,
  fallback 
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return fallback || <AuthRequiredFallback />;
  }

  // If specific roles are required, check user role
  if (allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      return fallback || <InsufficientRoleFallback userRole={user.role} requiredRoles={allowedRoles} />;
    }
  }

  // If no restrictions or user meets requirements, render children
  return <>{children}</>;
}

function AuthRequiredFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Lock className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            You need to sign in to access this feature.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => window.location.reload()}>
            Sign In to Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InsufficientRoleFallback({ userRole, requiredRoles }: { 
  userRole: string; 
  requiredRoles: string[];
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Shield className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>
            Your current role ({userRole}) doesn't have permission to access this feature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <strong>Required roles:</strong> {requiredRoles.join(", ")}
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Convenience components for common role combinations
export function ManufacturerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["manufacturer"]} requireAuth={true} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AuditorOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["auditor"]} requireAuth={true} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ShipperRetailerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["shipper", "retailer"]} requireAuth={true} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AuthenticatedOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requireAuth={true} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}