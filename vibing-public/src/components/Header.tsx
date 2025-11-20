"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, Calendar, User, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  userName?: string;
  transparent?: boolean;
}

export function Header({
  currentView = 'home',
  onViewChange = () => { },
  transparent = false
}: Omit<HeaderProps, 'isLoggedIn' | 'onLogout' | 'userName'>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { user, isLoggedIn, logout, loading } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Handle scroll behavior - detect when past hero section
  useEffect(() => {
    const handleScroll = () => {
      // For event page, always keep transparent (like Hero section)
      // For home page, detect scroll past hero section
      if (currentView === 'search') {
        setIsScrolled(false); // Always transparent on event page
      } else {
        const heroHeight = window.innerHeight * 0.8;
      setIsScrolled(window.scrollY > heroHeight);
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [currentView]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuItems = [
    { label: 'Beranda', value: 'home', icon: Calendar, route: '/' },
    { label: 'Cari Event', value: 'search', icon: Search, route: '/event' },
  ];

  const userMenuItems = isLoggedIn ? [
    { label: 'Dashboard', value: 'dashboard', icon: User },
    { label: 'Riwayat Event', value: 'history', icon: Calendar },
    { label: 'Sertifikat', value: 'certificates', icon: Calendar },
  ] : [
    { label: 'Masuk', value: 'login', icon: User, route: '/login' },
    { label: 'Daftar', value: 'register', icon: User },
  ];

  const handleMenuClick = (value: string, route?: string) => {
    if (value === 'logout') {
      logout();
    } else if (route) {
      router.push(route);
    } else {
      onViewChange(value);
    }
    setIsOpen(false);
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-[60]">
      <div className={`w-full transition-all duration-300 ease-in-out ${
        isScrolled && currentView !== 'search'
          ? 'bg-gray-100 rounded-xl shadow-md' 
          : 'bg-transparent'
      }`}>
        <div className={`w-full transition-all duration-300 ${
          isScrolled && currentView !== 'search'
            ? 'px-3 md:px-4' 
            : 'px-6 md:px-8 lg:px-12 xl:px-16'
        }`}>
          <header className="h-[64px] md:h-[72px] flex items-center justify-between gap-2">
            {/* Left side: Logo + Navigation */}
            <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
              {/* Logo */}
              <div
                className="flex items-center space-x-2 cursor-pointer group flex-shrink-0"
                onClick={() => router.push('/')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push('/');
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="PlanHub Home"
              >
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all duration-200 flex-shrink-0 ${
                  isScrolled && currentView !== 'search' ? 'bg-primary text-white' : 'bg-white text-primary'
                }`}>
                  <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <span className={`font-bold text-lg md:text-xl transition-colors duration-200 whitespace-nowrap ${
                  isScrolled && currentView !== 'search' ? 'text-gray-900' : 'text-white'
                }`}>
                  PlanHub
                </span>
              </div>

              {/* Desktop Navigation - Right after logo */}
              <nav 
                className="hidden md:flex items-center space-x-2 lg:space-x-3 flex-shrink-0"
                role="navigation"
                aria-label="Main navigation"
              >
                <button
                  onClick={() => handleMenuClick('home', '/')}
                  className={`transition-colors duration-200 font-semibold text-sm uppercase tracking-wide relative group cursor-pointer rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap ${
                    isScrolled && currentView !== 'search'
                      ? 'text-gray-700 hover:text-gray-900 focus:text-gray-900 focus:ring-primary/50 focus:ring-offset-gray-100' 
                      : 'text-white/90 hover:text-white focus:text-white focus:ring-white/50 focus:ring-offset-transparent'
                  }`}
                >
                  BERANDA
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${
                    isScrolled && currentView !== 'search' ? 'bg-primary' : 'bg-white'
                  }`}></span>
                </button>
                <button
                  onClick={() => handleMenuClick('search', '/event')}
                  className={`transition-colors duration-200 font-semibold text-sm uppercase tracking-wide relative group cursor-pointer rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap ${
                    isScrolled && currentView !== 'search'
                      ? 'text-gray-700 hover:text-gray-900 focus:text-gray-900 focus:ring-primary/50 focus:ring-offset-gray-100' 
                      : 'text-white/90 hover:text-white focus:text-white focus:ring-white/50 focus:ring-offset-transparent'
                  }`}
                >
                  CARI EVENT
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${
                    isScrolled && currentView !== 'search' ? 'bg-primary' : 'bg-white'
                  }`}></span>
                </button>
              </nav>
            </div>


            {/* Right side: CTA Button */}
            <div className="hidden md:flex items-center flex-shrink-0">
              {!loading && isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant={isScrolled && currentView !== 'search' ? "default" : "pill"}
                    size="icon"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`transition-all duration-200 cursor-pointer rounded-full w-9 h-9 ${
                      isScrolled && currentView !== 'search'
                        ? 'bg-primary text-white hover:bg-primary/90' 
                        : 'bg-white text-gray-900 hover:bg-gray-100 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <User className="h-4 w-4" />
                  </Button>

                  {/* Dropdown Menu with Animation */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out opacity-100 scale-100">
                      <button
                        onClick={() => {
                          router.push('/profile');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={async () => {
                          const result = await logout();
                          if (result.success) {
                            setIsDropdownOpen(false);
                          } else {
                            // Show error message to user
                            alert(result.message || 'Logout failed');
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : !loading ? (
                <button
                  onClick={handleLoginClick}
                  className={`px-3 py-1.5 text-sm font-semibold transition-all duration-200 cursor-pointer rounded-lg whitespace-nowrap ${
                    isScrolled && currentView !== 'search'
                      ? 'bg-primary text-white hover:bg-primary/90' 
                      : 'bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  MASUK
                </button>
              ) : (
                <div className="px-4 py-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-3">
              {!loading && !isLoggedIn && (
                <Button
                  variant={isScrolled && currentView !== 'search' ? "default" : "pill"}
                  size="sm"
                  onClick={handleLoginClick}
                  className={`px-4 py-2 text-xs transition-all duration-200 cursor-pointer ${
                    isScrolled && currentView !== 'search'
                      ? 'bg-primary text-white hover:bg-primary/90' 
                      : 'bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  MASUK
                </Button>
              )}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`p-2 transition-colors duration-200 ${
                      isScrolled && currentView !== 'search'
                        ? 'text-gray-900 hover:bg-gray-100' 
                        : 'text-white hover:bg-white/20'
                    }`}
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-4 mt-8">
                    {!loading && isLoggedIn && (
                      <div className="pb-4 border-b border-gray-200">
                        <p className="text-gray-600">Halo,</p>
                        <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
                      </div>
                    )}
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.value}
                          onClick={() => handleMenuClick(item.value, item.route)}
                          className="flex items-center space-x-4 p-3 rounded-xl hover:bg-teal-50 text-left transition-colors"
                        >
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-gray-900">{item.label}</span>
                        </button>
                      );
                    })}
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.value}
                          onClick={() => handleMenuClick(item.value, (item as any).route)}
                          className="flex items-center space-x-4 p-3 rounded-xl hover:bg-teal-50 text-left transition-colors"
                        >
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-gray-900">{item.label}</span>
                        </button>
                      );
                    })}
                    {!loading && isLoggedIn && (
                      <button
                        onClick={async () => {
                          const result = await logout();
                          if (result.success) {
                            setIsOpen(false);
                          } else {
                            alert(result.message || 'Logout failed');
                          }
                        }}
                        className="flex items-center space-x-4 p-3 rounded-xl hover:bg-red-50 text-red-600 text-left transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="font-semibold">Keluar</span>
                      </button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </header>
        </div>
      </div>
    </div>
  );
}
