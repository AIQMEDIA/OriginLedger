import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Blocks, 
  Package, 
  Users, 
  Plus, 
  Code,
  Link as LinkIcon,
  User
} from "lucide-react";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/blockchain", label: "Blockchain", icon: Blocks },
  { path: "/assets", label: "Asset Tracking", icon: Package },
  { path: "/participants", label: "Participants", icon: Users },
  { path: "/events", label: "Add Event", icon: Plus },
  { path: "/api-docs", label: "API Docs", icon: Code },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <LinkIcon className="text-white text-lg" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary dark:text-white">OriginLedger</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Supply Chain Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || 
              (item.path === "/dashboard" && location === "/");
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                data-testid={`nav-${item.path.replace('/', '')}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <User className="text-gray-600 dark:text-gray-300 text-sm" size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-secondary dark:text-white">Admin User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">System Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
