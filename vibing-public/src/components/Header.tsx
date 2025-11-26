"use client";

import React, { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, Sun, Moon } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";

interface HeaderItem {
  name: string;
  link: string;
  icon?: React.ReactNode;
}

interface HeaderProps {
  headerItems?: HeaderItem[];
  className?: string;
}

export const Header = ({ headerItems = [], className }: HeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user, logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const applyTheme = (nextTheme: "light" | "dark") => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (nextTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    if (stored) {
      applyTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    applyTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLoginClick = () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    await logout();
  };

  // Convert header items for NavBar, handling hash links
  const navItems = useMemo(
    () =>
      headerItems.map((item) => ({
        name: item.name,
        url: item.link,
        icon: item.icon,
        isHashLink: item.link.startsWith("#"), // Flag hash links
      })),
    [headerItems],
  );

  const isProfileActive = pathname === "/profile" || pathname.startsWith("/profile/");

  return (
    <>
      <NavBar items={navItems} className={cn("pointer-events-auto", className)} />

      <div className="fixed top-4 right-4 z-[5100] flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-sm font-medium shadow-lg backdrop-blur-xl">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 transition cursor-pointer",
            "bg-white/80 text-slate-700 hover:border-primary/50 hover:text-primary hover:shadow-md hover:scale-105",
            "dark:bg-black dark:text-slate-100 dark:hover:text-white dark:hover:shadow-md dark:hover:scale-105"
          )}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        {isLoggedIn ? (
          <>
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-200 cursor-pointer",
                isProfileActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/80 hover:text-primary",
              )}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.name || "Profile"}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-transparent bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:shadow-md cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleLoginClick}
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/90 px-4 py-1.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary dark:bg-slate-900/60 cursor-pointer"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Login</span>
          </button>
        )}
      </div>
    </>
  );
};
