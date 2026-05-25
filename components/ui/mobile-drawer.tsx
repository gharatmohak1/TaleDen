"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavLink {
  href: string;
  label: string;
  iconName: string;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
  renderFooter?: () => React.ReactNode;
}

export function MobileDrawer({ isOpen, onClose, navLinks, renderFooter }: MobileDrawerProps) {
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-background border-r z-50
        transform transition-transform duration-200 ease-in-out md:hidden
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <Link href="/" onClick={onClose} className="flex items-center gap-2 font-semibold tracking-tight">
            <Compass className="h-5 w-5 text-primary" />
            <span>TaleDen</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 p-0" aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        {renderFooter && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            {renderFooter()}
          </div>
        )}
      </div>
    </>
  );
}
