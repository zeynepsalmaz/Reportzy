'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/app-store';
import { NAVIGATION_ITEMS } from '@/constants/config';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  Upload, 
  Brain, 
  Link as LinkIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
  Database,
  Zap
} from 'lucide-react';
import { useState } from 'react';

const iconMap = {
  BarChart3,
  Upload,
  Brain,
  Link: LinkIcon,
};

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const handleClose = () => setSidebarOpen(false);
  const handleToggleCollapse = () => setCollapsed(!collapsed);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full bg-background border-r transition-all duration-300 ease-in-out",
        // Mobile
        "md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop collapse
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex h-full flex-col">
          
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">R</span>
                </div>
                <h2 className="text-lg font-semibold">Reportzy</h2>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              {/* Collapse toggle - desktop only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCollapse}
                className="hidden md:flex h-8 w-8"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
              
              {/* Close button - mobile only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="md:hidden h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          {!collapsed && (
            <div className="p-4 border-b">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Database className="h-4 w-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">5</div>
                    <div className="text-xs text-muted-foreground truncate">Datasets</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Activity className="h-4 w-4 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">12</div>
                    <div className="text-xs text-muted-foreground truncate">Queries</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                const isActive = pathname === item.href;
                
                return (
                  <Link key={item.id} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-11",
                        collapsed && "justify-center px-2",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Bottom section */}
          {!collapsed && (
            <div className="p-4 border-t">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <Zap className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">AI Processing</div>
                  <div className="text-xs text-muted-foreground">Ready for queries</div>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
