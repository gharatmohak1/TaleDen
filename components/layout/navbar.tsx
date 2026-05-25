"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Compass, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileDrawer } from "@/components/ui/mobile-drawer";

const navLinks = [
  { href: "/movies", label: "Movies", iconName: "movies" },
  { href: "/recommendations", label: "For you", iconName: "recommendations" },
  { href: "/taste-match", label: "Taste Match", iconName: "taste-match" },
  { href: "/watch-rooms", label: "Watch Rooms", iconName: "watch-rooms" },
  { href: "/passport", label: "Passport", iconName: "passport" },
];

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 md:gap-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
            className="h-9 w-9 p-0 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Compass className="h-5 w-5 text-primary" />
            <span>TaleDen</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <NotificationBell />
              <Link
                href={`/profile/${session.user.username ?? "me"}`}
                className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground"
              >
                @{session.user.username ?? session.user.name}
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="hidden sm:inline-flex"
              >
                Sign out
              </Button>
              <Link
                href={`/profile/${session.user.username ?? "me"}`}
                className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border"
                aria-label="Profile"
              >
                <User className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 min-h-[44px]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navLinks={navLinks}
        renderFooter={
          session?.user
            ? () => (
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/profile/${session.user.username ?? "me"}`}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full"
                  >
                    Sign out
                  </Button>
                </div>
              )
            : undefined
        }
      />
    </header>
  );
}
