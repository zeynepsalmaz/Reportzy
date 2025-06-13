"use client";

import { Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="mr-4 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            AI Analytics Platform
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden text-sm text-gray-500">
            <RefreshCw className="inline h-4 w-4 mr-1 animate-spin" />
            Refreshing...
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Connected
          </Badge>
        </div>
      </div>
    </header>
  );
}
