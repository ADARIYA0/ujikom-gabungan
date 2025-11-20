"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Download, 
  Menu, 
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dummy user data
  const userData = {
    name: "Joe Smith",
    isEmailVerified: true,
    role: "Super Administrator"
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'events', label: 'Daftar Event', icon: Calendar, href: '/events' },
    { id: 'statistics', label: 'Statistik', icon: BarChart3, href: '/statistics' },
    { id: 'exports', label: 'Ekspor Data', icon: Download, href: '/exports' },
    { id: 'global-templates', label: 'Global Templates', icon: FileText, href: '/certificate-templates/global' },
  ];


  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white border-teal-300 shadow-md"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:sticky top-0 left-0 h-screen z-40",
        "bg-sidebar border-r border-sidebar-border shadow-lg lg:shadow-none",
        "transform transition-all duration-300 ease-in-out",
        "flex flex-col",
        isCollapsed ? "w-16" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        {/* Header Section */}
        <div className={cn(
          "p-4 border-b border-sidebar-border",
          isCollapsed ? "px-2" : "px-6"
        )}>
          {/* User Info */}
          <div className={cn(
            "flex items-center gap-3 mb-4",
            isCollapsed ? "justify-center" : ""
          )}>
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-sidebar-foreground truncate">
                  {userData.name}
                </h2>
                <div className="flex items-center gap-1 mt-0.5">
                  {userData.isEmailVerified ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">Unverified</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <div className="hidden lg:block">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "w-full h-8 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors",
                isCollapsed ? "px-0 justify-center" : "justify-start"
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span className="text-xs">Tutup Menu</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className={cn(
          "flex-1 overflow-y-auto",
          isCollapsed ? "px-2 py-4" : "px-4 py-4"
        )}>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.id} href={item.href} className="block">
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={cn(
                      "w-full h-10 transition-all duration-200 relative",
                      isCollapsed ? "justify-center px-0" : "justify-start px-3",
                      active 
                        ? "bg-teal-600 text-white hover:bg-teal-700 shadow-sm" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    onClick={() => setIsOpen(false)} // Close mobile menu on click
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn(
                      "h-4 w-4 flex-shrink-0",
                      !isCollapsed && "mr-3",
                      active ? "text-white" : ""
                    )} />
                    {!isCollapsed && (
                      <span className={cn(
                        "text-sm font-medium truncate",
                        active ? "text-white" : ""
                      )}>
                        {item.label}
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Section */}
        <div className={cn(
          "p-4 border-t border-sidebar-border",
          isCollapsed ? "px-2" : "px-4"
        )}>
          {!isCollapsed && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Admin PlanHub v0.1.0
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
