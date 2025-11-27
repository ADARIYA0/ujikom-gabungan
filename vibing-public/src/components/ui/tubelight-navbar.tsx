"use client";

import React, { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  url: string;
  icon?: React.ReactNode;
  isHashLink?: boolean;
}
  const handleHashLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string, pathname: string, router: any) => {
    const hasHash = url.includes("#");
    if (!hasHash) return;

    e.preventDefault();
    const parts = url.split("#");
    const elementId = parts[parts.length - 1];

    // If we're already on the root page, just scroll to the element
    if (pathname === "/") {
      const el = document.getElementById(elementId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // Otherwise navigate to root with hash then attempt to scroll after route change
    // Using a short timeout to allow the new page to render the target element.
    // This is a pragmatic approach compatible with the app-router client navigation.
    router.push(`/#${elementId}`);
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 120);
  };

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

export function NavBar({ items, className }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(items[0]?.name ?? "");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const matched = items.find((item) => {
      // Treat hash links specially: if the item has a hash, check if current pathname is root
      if (item.url === "/") return pathname === "/";
      if (item.url.includes("#")) {
        return pathname === "/"; // when on root, the active state will be driven by scroll observer
      }
      return pathname?.startsWith(item.url);
    });

    if (matched) {
      setActiveTab(matched.name);
    }
  }, [pathname, items]);

  // Observe sections corresponding to hash-links and update activeTab on scroll
  useEffect(() => {
    if (typeof window === "undefined") return;
    const observers: IntersectionObserver[] = [];

    // Use lower threshold for mobile to improve detection
    const sectionThreshold = isMobile ? 0.15 : 0.35;
    const hashThreshold = isMobile ? 0.1 : 0.45;

    // If there's a root nav item (e.g. Beranda -> "/"), observe the hero section
    const rootItem = items.find((it) => it.url === "/");
    if (rootItem) {
      const heroEl = document.getElementById("hero");
      if (heroEl) {
        const heroObs = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveTab(rootItem.name);
              }
            });
          },
          { root: null, threshold: sectionThreshold },
        );
        heroObs.observe(heroEl);
        observers.push(heroObs);
      }
    }

    const hashItems = items.filter((it) => it.url.includes("#"));
    hashItems.forEach((it) => {
      const parts = it.url.split("#");
      const id = parts[parts.length - 1];
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveTab(it.name);
            }
          });
        },
        { root: null, threshold: hashThreshold },
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [items, isMobile]);

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-[5000] mb-6",
        isMobile ? "bottom-6 top-auto" : "top-6 bottom-auto",
        className,
      )}
    >
      <div className="flex items-center gap-3 rounded-full border border-border bg-background/70 px-1 py-1 shadow-lg backdrop-blur-xl">
        {items.map((item) => {
          const isActive = activeTab === item.name;

          return (
            <a
              key={item.name}
              href={item.url}
              onClick={(e) => {
                // Prevent reload if already on the same page (e.g., clicking "Beranda" while on "/")
                if (item.url === "/" && pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setActiveTab(item.name);
                  return;
                }
                // handle urls that include hashes (both '#id' and '/#id')
                if (item.url.includes("#")) {
                  handleHashLinkClick(e, item.url, pathname, router);
                }
                setActiveTab(item.name);
              }}
              style={item.isHashLink ? {} : { cursor: "pointer" }}
              {...(!item.isHashLink && { target: "_self" })}
              className={cn(
                "relative cursor-pointer rounded-full px-6 py-2 text-sm font-semibold transition-colors",
                "text-foreground/80 hover:text-primary",
                isActive && "text-primary",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden flex items-center justify-center">
                {item.icon}
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 -z-10 w-full rounded-full bg-primary/5"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-primary">
                    <div className="absolute -top-2 -left-2 h-6 w-12 rounded-full bg-primary/20 blur-md" />
                    <div className="absolute -top-1 h-6 w-8 rounded-full bg-primary/20 blur-md" />
                    <div className="absolute left-2 top-0 h-4 w-4 rounded-full bg-primary/20 blur-sm" />
                  </div>
                </motion.div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

