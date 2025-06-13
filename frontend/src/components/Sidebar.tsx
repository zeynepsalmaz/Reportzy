"use client";

import { TabType } from "@/types";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Upload, 
  Plug, 
  Brain, 
  X
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ onTabChange, isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      id: "dashboard" as TabType,
      label: "Dashboard",
      icon: BarChart3,
      path: "/dashboard"
    },
    {
      id: "import-data" as TabType,
      label: "Import Data",
      icon: Upload,
      path: "/import-data"
    },
    {
      id: "api-connect" as TabType,
      label: "API Connect",
      icon: Plug,
      path: "/api-connect"
    },
    {
      id: "ai-insights" as TabType,
      label: "AI Insights",
      icon: Brain,
      path: "/ai-insights"
    }
  ];

  const handleNavigation = (item: typeof navigationItems[0]) => {
    router.push(item.path);
    onTabChange(item.id);
  };

  // Determine active tab from pathname
  const getActiveTab = () => {
    const currentItem = navigationItems.find(item => item.path === pathname);
    return currentItem?.id || "dashboard";
  };

  const currentActiveTab = getActiveTab();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Reportzy</h1>
          </div>
          
          {/* Mobile close button */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-6">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentActiveTab === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors duration-200",
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5",
                      isActive ? "text-blue-600" : "text-gray-500"
                    )} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <p className="font-medium">Reportzy AI</p>
            <p>Analytics Platform</p>
          </div>
        </div>
      </div>
    </>
  );
}
