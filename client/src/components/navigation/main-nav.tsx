import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import originLedgerIcon from "@assets/OriginLedgerIcon_1755629837786.png";
import { 
  Home, 
  Package, 
  Users, 
  Activity, 
  FileText, 
  Blocks, 
  Play, 
  MessageCircle,
  User,
  LogOut,
  Settings,
  Shield,
  Plus,
  Search,
  BarChart3,
  Moon,
  Sun,
  HelpCircle,
  CreditCard
} from "lucide-react";

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[]; // If empty, visible to all users
  requireAuth?: boolean;
}

// Define navigation structure with role-based access
const navigationItems: NavigationItem[] = [
  {
    path: "/",
    label: "Dashboard",
    icon: Home,
    requireAuth: false
  },
  {
    path: "/assets",
    label: "Assets",
    icon: Package,
    requireAuth: false
  },
  {
    path: "/blockchain",
    label: "Blockchain",
    icon: Blocks,
    requireAuth: false
  },
  {
    path: "/participants",
    label: "Participants",
    icon: Users,
    requireAuth: false
  },
  {
    path: "/events",
    label: "Events",
    icon: Activity,
    roles: ["manufacturer", "shipper", "retailer"],
    requireAuth: true
  },
  {
    path: "/audit",
    label: "Audit Trail",
    icon: Shield,
    roles: ["other", "manufacturer"], // Only specific roles can access
    requireAuth: true
  },
  {
    path: "/testing",
    label: "API Testing",
    icon: Play,
    roles: ["manufacturer", "other"], // Developer/admin features
    requireAuth: true
  },
  {
    path: "/chat",
    label: "Support Chat",
    icon: MessageCircle,
    requireAuth: false
  },
  {
    path: "/role-demo",
    label: "Role Demo", 
    icon: Shield,
    requireAuth: false
  },
  {
    path: "/subscription",
    label: "Subscription",
    icon: CreditCard,
    requireAuth: true
  }
];

// Additional action buttons based on roles
const getRoleActions = (userRole: string) => {
  const actions = [];
  
  if (["manufacturer", "shipper"].includes(userRole)) {
    actions.push({
      label: "Add Event",
      icon: Plus,
      action: "add-event",
      variant: "default" as const
    });
  }
  
  if (userRole === "manufacturer") {
    actions.push({
      label: "Add Asset",
      icon: Package,
      action: "add-asset",
      variant: "outline" as const
    });
  }
  
  if (["other", "manufacturer"].includes(userRole)) {
    actions.push({
      label: "Validate Chain",
      icon: Shield,
      action: "validate-chain",
      variant: "secondary" as const
    });
  }

  return actions;
};

export function MainNavigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Filter navigation items based on user role and authentication
  const visibleNavItems = navigationItems.filter(item => {
    // If item requires auth and user is not authenticated, hide it
    if (item.requireAuth && !isAuthenticated) return false;
    
    // If item has role restrictions, check user role
    if (item.roles && user) {
      return item.roles.includes(user.role);
    }
    
    return true;
  });

  const handleAuthSuccess = (token: string, userData: any) => {
    // Refresh page or invalidate queries as needed
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleRoleAction = (action: string) => {
    // Handle role-specific actions
    switch (action) {
      case 'add-event':
        window.location.href = '/events?action=add';
        break;
      case 'add-asset':
        window.location.href = '/assets?action=add';
        break;
      case 'validate-chain':
        window.location.href = '/blockchain?action=validate';
        break;
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manufacturer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'shipper': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'retailer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'other': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src={originLedgerIcon} 
                alt="OriginLedger"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                OriginLedger
              </span>
            </Link>
          </div>

          {/* Main Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center space-x-2"
                    data-testid={`nav-${item.path.slice(1) || 'dashboard'}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Role-specific Action Buttons */}
            {isAuthenticated && user && (
              <div className="hidden lg:flex items-center space-x-2">
                {getRoleActions(user.role).map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant={action.variant}
                      size="sm"
                      onClick={() => handleRoleAction(action.action)}
                      className="flex items-center space-x-1"
                      data-testid={`action-${action.action}`}
                    >
                      <ActionIcon className="h-4 w-4" />
                      <span className="hidden xl:inline">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="h-9 w-9 p-0"
              data-testid="toggle-dark-mode"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Help Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              data-testid="help-button"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* Authentication Section */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-9 w-9 rounded-full"
                    data-testid="user-menu-trigger"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} alt={user.username} />
                      <AvatarFallback>{getUserInitials(user.username)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.username}</p>
                      {user.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ID: {user.id.slice(0, 8)}...
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild data-testid="menu-profile">
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'other' && (
                    <DropdownMenuItem data-testid="menu-admin">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400"
                    data-testid="menu-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-2"
                data-testid="sign-in-button"
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t px-4 py-2">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {visibleNavItems.slice(0, 4).map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center space-x-1 whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Authentication Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}