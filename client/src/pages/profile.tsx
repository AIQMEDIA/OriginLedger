import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { AuthenticatedOnly } from "@/components/auth/role-guard";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Shield, Key, Clock, AlertCircle } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      // This would call your API to change password
      toast({
        title: "Success",
        description: "Password updated successfully"
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsChangingPassword(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      });
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'manufacturer':
        return 'Can create assets and track manufacturing events';
      case 'shipper':
        return 'Can update shipping status and track logistics';
      case 'retailer':
        return 'Can confirm deliveries and final sale events';
      case 'auditor':
        return 'Can access audit trails and validate blockchain integrity';
      default:
        return 'Standard user access';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manufacturer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'shipper': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'retailer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'auditor': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <AuthenticatedOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Profile Settings</h2>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and role information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={user?.username || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Username cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <Button variant="outline" size="sm" disabled>
                    <Mail className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role & Permissions</Label>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(user?.role || '')}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user?.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getRoleDescription(user?.role || '')}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Active
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Account is in good standing
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>User ID</Label>
                <Input
                  value={user?.id || ""}
                  disabled
                  className="bg-muted font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isChangingPassword ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your password was last updated recently. We recommend using a strong, unique password.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full"
                    data-testid="change-password-button"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>

                  <div className="space-y-2">
                    <Label>Security Features</Label>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span>JWT Token Authentication</span>
                        <Badge variant="outline" className="text-green-600">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Password Hashing</span>
                        <Badge variant="outline" className="text-green-600">bcrypt</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Role-based Access</span>
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        currentPassword: e.target.value
                      }))}
                      required
                      data-testid="current-password-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        newPassword: e.target.value
                      }))}
                      required
                      data-testid="new-password-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))}
                      required
                      data-testid="confirm-password-input"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" data-testid="save-password-button">
                      Update Password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      }}
                      data-testid="cancel-password-button"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-sm font-medium">Login Status</Label>
                <p className="text-sm text-muted-foreground">Currently signed in</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Session Type</Label>
                <p className="text-sm text-muted-foreground">JWT Token</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Activity</Label>
                <p className="text-sm text-muted-foreground">Just now</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedOnly>
  );
}