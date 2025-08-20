import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface FloatingChatButtonProps {
  className?: string;
}

export function FloatingChatButton({ className = "" }: FloatingChatButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Link href="/chat">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          data-testid="floating-chat-button"
        >
          <MessageCircle className="h-6 w-6 text-white" />
          
          {/* Animated notification dot */}
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse border-2 border-white">
            <Sparkles className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
          </div>
          
          {/* Tooltip */}
          <div
            className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm font-medium">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                AI Assistant
              </div>
              <div className="text-xs opacity-75 mt-1">
                Get instant help & support
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900 dark:border-l-gray-100"></div>
          </div>
        </Button>
      </Link>
    </div>
  );
}