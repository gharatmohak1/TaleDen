"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { NotificationBell } from "@/components/layout/notification-bell";

const NAV_LINKS = [
  { href: "/",             label: "Home",         icon: "🏠" },
  { href: "/movies",       label: "Movies",        icon: "🎬" },
  { href: "/taste-match",  label: "Taste Match",   icon: "🤝" },
  { href: "/watch-rooms",  label: "Watch Rooms",   icon: "👥" },
  { href: "/passport",     label: "Passport",      icon: "🌍" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [drawerOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const profileHref = session
    ? `/profile/${session.user.username ?? session.user.name ?? "me"}`
    : "/login";

  return (
    <>
      <header className={`
        fixed top-0 left-0 right-0 z-40 h-14
        bg-background/90 backdrop-blur-xl border-b border-border
        transition-shadow duration-200
        ${scrolled ? "shadow-[0_1px_8px_hsl(var(--foreground)/0.05)]" : ""}
      `}>
        <div className="flex items-center justify-between h-full px-4 md:px-8 max-w-screen-xl mx-auto">

          <Link
            href="/"
            className="flex items-center gap-2 font-medium text-base
                       active:opacity-70 transition-all duration-150 hover:opacity-80"
          >
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center
                            justify-center text-background text-xs font-bold">
              TD
            </div>
            <span className="hidden sm:inline">TaleDen</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  px-3 py-1.5 rounded-full text-sm transition-all duration-150
                  ${isActive(link.href)
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {session && (
              <>
                <NotificationBell />
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5
                             rounded-full text-sm text-muted-foreground
                             hover:text-destructive hover:bg-destructive/10
                             transition-all duration-150 active:scale-[0.97]"
                  aria-label="Sign out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor"
                       strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign out
                </button>
                <Link
                  href={profileHref}
                  className="hidden lg:flex items-center gap-2 px-2 py-1.5
                             rounded-full hover:bg-accent transition-all duration-150"
                >
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt="Avatar"
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center
                                    justify-center text-xs font-medium">
                      {session.user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm max-w-[100px] truncate">
                    {session.user.name}
                  </span>
                </Link>
              </>
            )}

            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className="lg:hidden w-10 h-10 flex flex-col items-center
                         justify-center gap-1.5 rounded-full
                         hover:bg-accent active:scale-[0.97] transition-all duration-150"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
            >
              <span className={`
                block w-5 h-0.5 bg-foreground rounded-full
                transition-all duration-200 origin-center
                ${drawerOpen ? "translate-y-2 rotate-45" : ""}
              `} />
              <span className={`
                block w-5 h-0.5 bg-foreground rounded-full
                transition-all duration-200
                ${drawerOpen ? "opacity-0 scale-x-0" : ""}
              `} />
              <span className={`
                block w-5 h-0.5 bg-foreground rounded-full
                transition-all duration-200 origin-center
                ${drawerOpen ? "-translate-y-2 -rotate-45" : ""}
              `} />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`
          fixed inset-0 z-40 bg-black/50 backdrop-blur-sm
          transition-opacity duration-200 lg:hidden
          ${drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed top-0 left-0 h-full w-72 md:w-80 z-50 bg-background border-r border-border
          flex flex-col
          transform transition-transform duration-250 ease-in-out
          lg:hidden shadow-[0_4px_24px_hsl(var(--foreground)/0.08)]
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-medium text-base"
            onClick={() => setDrawerOpen(false)}
          >
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center
                            justify-center text-background text-xs font-bold">
              TD
            </div>
            TaleDen
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full
                       hover:bg-accent transition-colors active:scale-[0.97]"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor"
                 strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {session && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={40}
                height={40}
                className="rounded-full shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent flex items-center
                              justify-center text-sm font-medium shrink-0">
                {session.user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        )}

        <nav
          className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setDrawerOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-full text-sm
                transition-all duration-150 active:scale-[0.97] min-h-[48px]
                ${isActive(link.href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }
              `}
            >
              <span className="text-lg leading-none w-6 text-center" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
              {isActive(link.href) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground" />
              )}
            </Link>
          ))}

          {session && (
            <>
              <div className="h-px bg-border my-2" />
              <Link
                href={profileHref}
                onClick={() => setDrawerOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-full text-sm
                  transition-all duration-150 active:scale-[0.97] min-h-[48px]
                  ${pathname.startsWith("/profile")
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }
                `}
              >
                <span className="text-lg leading-none w-6 text-center" aria-hidden="true">
                  👤
                </span>
                My Profile
              </Link>
            </>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-border shrink-0 pb-safe">
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-full
                         text-sm text-muted-foreground hover:text-destructive
                         hover:bg-destructive/10 transition-all duration-150
                         active:scale-[0.97] min-h-[48px]"
            >
              <span className="text-lg leading-none w-6 text-center" aria-hidden="true">
                🚪
              </span>
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full h-11
                         rounded-full bg-foreground text-background text-sm
                         font-medium active:scale-[0.97] transition-all duration-150"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      <div className="h-14" aria-hidden="true" />
    </>
  );
}
