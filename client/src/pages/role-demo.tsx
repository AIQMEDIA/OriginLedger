import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { RoleGuard } from "@/components/auth/role-guard";
import { 
  User, 
  Shield, 
  Package, 
  Truck, 
  Store, 
  Settings, 
  Lock,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

interface RolePermission {
  feature: string;
  description: string;
  manufacturer: boolean;
  shipper: boolean;
  retailer: boolean;
  other: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const rolePermissions: RolePermission[] = [
  {
    feature: "Dashboard Access",
    description: "View overall system statistics and recent activities",
    manufacturer: true,
    shipper: true,
    retailer: true,
    other: true,
    icon: Info
  },
  {
    feature: "Assets Viewing",
    description: "Browse and search all assets in the system",
    manufacturer: true,
    shipper: true,
    retailer: true,
    other: true,
    icon: Package
  },
  {
    feature: "Blockchain Explorer",
    description: "View blockchain data and transaction history",
    manufacturer: true,
    shipper: true,
    retailer: true,
    other: true,
    icon: Shield
  },
  {
    feature: "Participants List",
    description: "View all registered participants and their roles",
    manufacturer: true,
    shipper: true,
    retailer: true,
    other: true,
    icon: User
  },
  {
    feature: "Events Management",
    description: "Create and manage supply chain events",
    manufacturer: true,
    shipper: true,
    retailer: true,
    other: false,
    icon: Settings
  },
  {
    feature: "Asset Creation",
    description: "Add new assets to the supply chain",
    manufacturer: true,
    shipper: false,
    retailer: false,
    other: false,
    icon: Package
  },
  {
    feature: "Add Events",
    description: "Create supply chain events for tracking",
    manufacturer: true,
    shipper: true,
    retailer: false,
    other: false,
    icon: Settings
  },
  {
    feature: "Audit Trail Access",
    description: "View detailed audit logs and compliance data",
    manufacturer: true,
    shipper: false,
    retailer: false,
    other: true,
    icon: Shield
  },
  {
    feature: "Chain Validation",
    description: "Validate blockchain integrity and detect issues",
    manufacturer: true,
    shipper: false,
    retailer: false,
    other: true,
    icon: Shield
  },
  {
    feature: "API Testing",
    description: "Access developer tools and API testing interface",
    manufacturer: true,
    shipper: false,
    retailer: false,
    other: true,
    icon: Settings
  }
];

export default function RoleDemo() {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manufacturer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'shipper': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'retailer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'other': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manufacturer': return Package;
      case 'shipper': return Truck;
      case 'retailer': return Store;
      case 'other': return Settings;
      default: return User;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'manufacturer': return 'Can create assets, manage events, access audit trails, and validate blockchain';
      case 'shipper': return 'Can manage shipping events and track logistics throughout the supply chain';
      case 'retailer': return 'Can manage retail events and confirm final deliveries to end customers';
      case 'other': return 'Administrative access with audit capabilities and system validation tools';
      default: return 'Standard user access with basic viewing permissions';
    }
  };

  const hasPermission = (permission: RolePermission, userRole?: string) => {
    if (!userRole) return false;
    return (permission as any)[userRole] === true;
  };

  const PermissionIcon = ({ granted }: { granted: boolean }) => {
    return granted ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-400" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Role Permissions Demo</h2>
          <p className="text-muted-foreground">
            Explore how different user roles access different features
          </p>
        </div>
      </div>

      {/* Current User Status */}
      {isAuthenticated && user ? (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <User className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            <span>Currently signed in as:</span>
            <Badge className={getRoleColor(user.role)}>
              {user.username} ({user.role})
            </Badge>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Sign in to see your role-specific permissions in action.
            <Button 
              onClick={() => setShowAuthModal(true)} 
              variant="link" 
              className="p-0 ml-2 h-auto"
            >
              Sign In Here
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manufacturer">Manufacturer</TabsTrigger>
          <TabsTrigger value="shipper">Shipper</TabsTrigger>
          <TabsTrigger value="retailer">Retailer</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                Complete overview of what each role can access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Feature</th>
                      <th className="text-center p-3 font-medium text-blue-600">Manufacturer</th>
                      <th className="text-center p-3 font-medium text-yellow-600">Shipper</th>
                      <th className="text-center p-3 font-medium text-green-600">Retailer</th>
                      <th className="text-center p-3 font-medium text-purple-600">Other</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolePermissions.map((permission, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <permission.icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{permission.feature}</div>
                              <div className="text-sm text-muted-foreground">{permission.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <PermissionIcon granted={permission.manufacturer} />
                        </td>
                        <td className="p-3 text-center">
                          <PermissionIcon granted={permission.shipper} />
                        </td>
                        <td className="p-3 text-center">
                          <PermissionIcon granted={permission.retailer} />
                        </td>
                        <td className="p-3 text-center">
                          <PermissionIcon granted={permission.other} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Demo Users */}
          <Card>
            <CardHeader>
              <CardTitle>Test Users Available</CardTitle>
              <CardDescription>
                Use these demo accounts to test different role permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {['manufacturer', 'shipper', 'retailer', 'other'].map((role) => {
                  const Icon = getRoleIcon(role);
                  return (
                    <Card key={role} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-5 w-5" />
                        <Badge className={getRoleColor(role)}>
                          {role}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div><strong>Username:</strong> Demo{role.charAt(0).toUpperCase() + role.slice(1)}</div>
                        <div><strong>Password:</strong> demo123</div>
                        <div className="text-muted-foreground">{getRoleDescription(role)}</div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Role Tabs */}
        {['manufacturer', 'shipper', 'retailer', 'other'].map((role) => {
          const Icon = getRoleIcon(role);
          const userPermissions = rolePermissions.filter(p => (p as any)[role]);
          
          return (
            <TabsContent key={role} value={role} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-6 w-6" />
                    {role.charAt(0).toUpperCase() + role.slice(1)} Role
                  </CardTitle>
                  <CardDescription>
                    {getRoleDescription(role)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">✓ Allowed Features ({userPermissions.length})</h4>
                      <div className="grid gap-2">
                        {userPermissions.map((permission, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                            <permission.icon className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium text-green-800 dark:text-green-200">{permission.feature}</div>
                              <div className="text-sm text-green-600 dark:text-green-400">{permission.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Show what's restricted */}
                    {rolePermissions.length - userPermissions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">✗ Restricted Features</h4>
                        <div className="grid gap-2">
                          {rolePermissions.filter(p => !(p as any)[role]).map((permission, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded">
                              <permission.icon className="h-4 w-4 text-red-400" />
                              <div>
                                <div className="font-medium text-red-800 dark:text-red-200">{permission.feature}</div>
                                <div className="text-sm text-red-600 dark:text-red-400">{permission.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live Demo */}
                    {isAuthenticated && user?.role === role && (
                      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>You are currently signed in with this role!</strong> 
                          <br />Navigate through the app to see these permissions in action.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Role-specific demonstrations */}
              {role === 'manufacturer' && (
                <RoleGuard allowedRoles={["manufacturer"]} requireAuth={true}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Manufacturer-Only Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-green-600">
                        ✓ You can see this content because you have manufacturer role!
                      </div>
                    </CardContent>
                  </Card>
                </RoleGuard>
              )}

              {role === 'other' && (
                <RoleGuard allowedRoles={["other"]} requireAuth={true}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Admin-Only Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-purple-600">
                        ✓ You can see this content because you have administrative access!
                      </div>
                    </CardContent>
                  </Card>
                </RoleGuard>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}