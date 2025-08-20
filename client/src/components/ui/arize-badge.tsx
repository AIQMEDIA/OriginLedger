import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface ArizeBadgeProps {
  variant?: "default" | "footer" | "hero";
  showRevenue?: boolean;
  className?: string;
}

export function ArizeBadge({ variant = "default", showRevenue = false, className = "" }: ArizeBadgeProps) {
  const baseClasses = "inline-flex items-center gap-1 font-medium";
  
  if (variant === "footer") {
    return (
      <div className={`${baseClasses} text-xs text-muted-foreground ${className}`}>
        <Zap className="h-3 w-3" />
        <span>Observability powered by</span>
        <Badge variant="outline" className="text-xs">
          Arize Phoenix
        </Badge>
      </div>
    );
  }
  
  if (variant === "hero") {
    return (
      <div className={`${baseClasses} ${className}`}>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700">
          <Zap className="h-3 w-3 mr-1" />
          Enterprise Observability by Arize AI
          {showRevenue && <span className="ml-1">($45M Platform)</span>}
        </Badge>
      </div>
    );
  }
  
  return (
    <Badge variant="outline" className={`bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 ${className}`}>
      <Zap className="h-3 w-3 mr-1" />
      Powered by Arize Phoenix
    </Badge>
  );
}