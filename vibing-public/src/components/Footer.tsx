import { Button } from "@/components/ui/button";
import {
  Github,
  Hexagon,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import React from "react";

interface FooterLink {
  href: string;
  label: string;
}

interface SocialLink extends FooterLink {
  icon: React.ReactNode;
}

interface FooterProps {
  logo: React.ReactNode;
  brandName: string;
  socialLinks: SocialLink[];
  mainLinks: FooterLink[];
  legalLinks: FooterLink[];
  copyright: {
    text: string;
    license?: string;
  };
}

const defaultFooterContent: FooterProps = {
  logo: (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
      <Hexagon className="h-7 w-7" />
    </div>
  ),
  brandName: "VIBING.my.id",
  socialLinks: [
    {
      icon: <Instagram className="h-5 w-5" />,
      href: "https://www.instagram.com/adariya0",
      label: "Instagram",
    },
    {
      icon: <Twitter className="h-5 w-5" />,
      href: "https://x.com/adariya0",
      label: "Twitter",
    },
    {
      icon: <Github className="h-5 w-5" />,
      href: "https://github.com/ADARIYA0",
      label: "GitHub",
    },
  ],
  mainLinks: [
    { href: "/about", label: "Tentang Kami" },
    { href: "/events", label: "Cari Kegiatan" },
    { href: "/pricing", label: "Harga" },
  ],
  legalLinks: [
    { href: "#", label: "Kebijakan Privasi" },
    { href: "#", label: "Syarat & Ketentuan" },
  ],
  copyright: {
    text: "© 2025 VIBING Digital Innovations",
    license: "Seluruh hak cipta dilindungi undang-undang.",
  },
};

export function Footer(props: Partial<FooterProps> = {}) {
  const content = { ...defaultFooterContent, ...props };
  const { logo, brandName, socialLinks, mainLinks, legalLinks, copyright } =
    content;

  return (
    <footer className="pb-6 pt-16 lg:pb-8 lg:pt-24 border-t border-slate-200 dark:border-slate-800 bg-background dark:bg-black">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="md:flex md:items-start md:justify-between">
          <a 
            href="/" 
            className="group flex items-center gap-x-3 transition-transform duration-300 hover:scale-105" 
            aria-label={brandName}
          >
            <div className="transition-transform duration-300 group-hover:rotate-12">
              {logo}
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white transition-colors duration-300 group-hover:text-primary">
              {brandName}
            </span>
          </a>
          <ul className="mt-6 flex list-none space-x-3 md:mt-0">
            {socialLinks.map((link, i) => (
              <li key={`${link.label}-${i}`}>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-10 w-10 rounded-full transition-all duration-300 hover:shadow-lg hover:bg-primary hover:text-primary-foreground dark:bg-slate-800 dark:hover:bg-primary dark:text-slate-300 dark:hover:text-primary-foreground" 
                  asChild
                >
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    className="text-slate-600 dark:text-slate-300"
                  >
                    {link.icon}
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6 md:mt-4 md:pt-8 lg:grid lg:grid-cols-10 lg:gap-6">
          <nav className="lg:col-[4/11]">
            <ul className="flex list-none flex-wrap -my-1 -mx-2 lg:justify-end">
              {mainLinks.map((link, i) => (
                <li key={`${link.label}-${i}`} className="my-1 mx-2 shrink-0">
                  <a
                    href={link.href}
                    className="group relative text-sm text-primary dark:text-slate-300 underline-offset-4 transition-all duration-300 hover:text-primary-foreground dark:hover:text-white px-2 py-1 rounded-md hover:bg-primary hover:shadow-md hover:scale-105"
                  >
                    <span className="relative z-10">{link.label}</span>
                    <span className="absolute inset-0 scale-0 rounded-md bg-primary transition-transform duration-300 group-hover:scale-100"></span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 lg:mt-0 lg:col-[4/11]">
            <ul className="flex list-none flex-wrap -my-1 -mx-3 lg:justify-end">
              {legalLinks.map((link, i) => (
                <li key={`${link.label}-${i}`} className="my-1 mx-3 shrink-0">
                  <a
                    href={link.href}
                    className="group relative text-sm text-muted-foreground dark:text-slate-400 underline-offset-4 transition-all duration-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm hover:scale-105"
                  >
                    <span className="relative z-10">{link.label}</span>
                    <span className="absolute inset-0 scale-0 rounded-md bg-slate-100 dark:bg-slate-800 transition-transform duration-300 group-hover:scale-100"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 whitespace-nowrap text-sm leading-6 text-muted-foreground dark:text-slate-400 lg:col-[1/4] lg:row-[1/3] lg:mt-0">
            <div>{copyright.text}</div>
            {copyright.license && <div>{copyright.license}</div>}
          </div>
        </div>
      </div>
    </footer>
  );
}
