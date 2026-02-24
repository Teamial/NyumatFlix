# NyumatFlix Layouts

Layout components that define the application shell: root layout, theme provider, content containers, and navigation.

---

## Root Layout

- **File:** `app/layout.tsx`
- **Description:** The top-level server layout. Wraps the entire app in providers (QueryProvider, AuthSessionProvider, OnboardingProvider, ThemeProvider forced to dark, TooltipProvider, GlobalDockProvider). Renders the navbar (server component), main content area, footer, and Toaster. Uses Inter font.

```tsx
import { NavbarServer } from "@/components/layout/nav/navbar-server";
import { FooterSection } from "@/components/layout/sections/footer";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { OnboardingProvider } from "@/components/providers/onboarding-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { GlobalDockProvider } from "@/components/ui/global-dock";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/lib/query-client";
import { cn, validateEnv } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

if (process.env.NODE_ENV !== "production") {
  validateEnv();
}

export const metadata: Metadata = {
  metadataBase: new URL("https://nyumatflix.com/"),
  title: "NyumatFlix | Watch Movies and TV Shows",
  icons: {
    icon: "/favicon.ico",
  },
  description:
    "Nyumatflix is an open-source, no-cost, and ad-free movie and tv show stream aggregator.",
  openGraph: {
    type: "website",
    url: "https://nyumatflix.com",
    title: "NyumatFlix | Watch Movies and TV Shows",
    description:
      "Nyumatflix is an open-source, no-cost, and ad-free movie and tv show stream aggregator.",
    images: [
      {
        url: "https://nyumatflix.com/og.webp",
        alt: "NyumatFlix | Watch Movies and TV Shows",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "https://nyumatflix.com",
    title: "NyumatFlix | Watch Movies and TV Shows",
    description:
      "Nyumatflix is an open-source, no-cost, and ad-free movie and tv show stream aggregator.",
    images: ["https://nyumatflix.com/og.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {process.env.NODE_ENV === "production" && (
          <Script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id="679411bf-5cd3-4f57-983d-956d67f033cc"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={cn("min-h-screen bg-background", inter.className)}>
        <QueryProvider>
          <AuthSessionProvider>
            <OnboardingProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                forcedTheme="dark"
                disableTransitionOnChange
              >
                <TooltipProvider>
                  <GlobalDockProvider>
                    <NavbarServer />
                    <main className="flex-1">{children}</main>
                    <FooterSection />
                    <Toaster richColors closeButton />
                  </GlobalDockProvider>
                </TooltipProvider>
              </ThemeProvider>
            </OnboardingProvider>
          </AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## ThemeProvider

- **File:** `components/layout/theme-provider.tsx`
- **Description:** Thin client wrapper around `next-themes` ThemeProvider. Dark mode is forced via `forcedTheme="dark"` in the root layout.

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import * as React from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

---

## ContentContainer

- **File:** `components/layout/content-container.tsx`
- **Description:** Reusable content wrapper that provides consistent top spacing (`pt-12`) and optional margin-top. Used inside `PageContainer`.

```tsx
import { ReactNode } from "react";

interface ContentContainerProps {
  children: ReactNode;
  className?: string;
  topSpacing?: boolean;
}

export function ContentContainer({
  children,
  className = "",
  topSpacing = true,
}: ContentContainerProps) {
  return (
    <div className={`w-full pt-12 ${topSpacing ? "mt-4" : ""} ${className}`}>
      {children}
    </div>
  );
}
```

---

## PageContainer

- **File:** `components/layout/page-container.tsx`
- **Description:** Top-level page wrapper providing `min-h-screen` and `bg-background`. Used by most page routes.

```tsx
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>{children}</div>
  );
}
```

---

## Navbar Components

The navbar is split into server and client components in `components/layout/nav/`.

### NavbarServer

- **File:** `components/layout/nav/navbar-server.tsx`
- **Description:** Server component that fetches the auth session and passes it to `NavbarClient`.

```tsx
"use server";

import { auth } from "@/auth";
import { NavbarClient } from "./navbar-client";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const NavbarServer = async () => {
  const session = await auth();
  return (
    <>
      <NavbarClient session={session} />
    </>
  );
};
```

### NavbarClient

- **File:** `components/layout/nav/navbar-client.tsx`
- **Description:** Client-side navbar shell. Renders logo, search bar (desktop), nav links, auth button, and mobile navigation. Positioned `absolute top-0 z-50` to overlay page content.

```tsx
"use client";

import { NavbarSearchClient } from "@/components/search/search";
import { cn } from "@/lib/utils";
import { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "../../ui/back-button";
import { Badge } from "../../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { NavbarAuth } from "./navbar-auth";
import { NavbarLinks } from "./navbar-links";
import { NavbarMobileNavigation } from "./navbar-mobile-navigation";

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

const NAV_LINKS_WITH_HOME: NavLink[] = [
  { label: "Home", href: "/home" },
  { label: "Movies", href: "/movies" },
  { label: "TV Shows", href: "/tvshows" },
  { label: "Search", href: "/search" },
];

const getNavLinks = (session: Session | null): NavLink[] => {
  return [...NAV_LINKS_WITH_HOME];
};

interface NavbarClientProps {
  session: Session | null;
}

export const NavbarClient = ({ session }: NavbarClientProps) => {
  return (
    <>
      <nav className={cn("absolute top-0 z-50 w-full")}>
        <div className="flex justify-between items-center md:max-w-7xl lg:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:pb-8">
          <div className="flex flex-row items-center gap-2 shrink-0">
            <BackButton />
            <Link href="/" className="shrink-0">
              <Image
                src="/logo.svg"
                alt="NyumatFlix Logo"
                width={150}
                height={150}
                className="size-10"
              />
            </Link>
          </div>

          <div className="hidden md:flex flex-1 mx-8">
            <NavbarSearchClient />
          </div>

          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 ml-auto">
            <NavbarLinks links={getNavLinks(session)} />
            <NavbarAuth session={session} />
          </div>

          <div className="flex md:hidden items-center space-x-2">
            <NavbarMobileNavigation
              links={getNavLinks(session)}
              session={session}
            >
              <div className="px-2">
                <NavbarSearchClient />
              </div>
            </NavbarMobileNavigation>
          </div>
        </div>
      </nav>
    </>
  );
};
```

### NavbarLinks

- **File:** `components/layout/nav/navbar-links.tsx`
- **Description:** Renders navigation links (Home, Movies, TV Shows, Search) with active state detection, animated underline on hover, and prefetching on mouse enter/focus.

```tsx
"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

interface NavbarLinksProps {
  links: NavLink[];
  isMobile?: boolean;
  onMobileLinkClick?: () => void;
}

export const NavbarLinks = ({
  links,
  isMobile = false,
  onMobileLinkClick,
}: NavbarLinksProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isActiveLink = (href: string) => {
    if (!isMounted) return false;
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const linkClasses = isMobile
    ? "block px-3 py-3 rounded-md text-base font-medium transition-all duration-200"
    : "relative px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap";

  const activeClasses = isMobile
    ? "bg-primary text-primary-foreground"
    : "text-white font-semibold drop-shadow-lg";

  const inactiveClasses = isMobile
    ? "text-muted-foreground hover:text-foreground hover:bg-accent"
    : "text-white/80 hover:text-white font-medium drop-shadow-md hover:drop-shadow-lg";

  const handleLinkInteraction = (link: NavLink) => {
    router.prefetch(link.href);
    if (link.href === "/movies") {
      router.prefetch("/movies/browse");
      router.prefetch("/home");
    } else if (link.href === "/tvshows") {
      router.prefetch("/tvshows/browse");
      router.prefetch("/home");
    } else if (link.href === "/home") {
      router.prefetch("/movies");
      router.prefetch("/tvshows");
    } else if (link.href === "/search") {
      router.prefetch("/movies");
      router.prefetch("/tvshows");
    }
  };

  const handleMouseEnter = (link: NavLink) => {
    router.prefetch(link.href);
  };

  return (
    <div className={cn(!isMobile && "group flex items-center flex-nowrap")}>
      {links.map((link) => {
        const isHomeLink = link.href === "/home" && !isMobile;
        const isActive = isActiveLink(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              linkClasses,
              isActive ? activeClasses : inactiveClasses,
              !isMobile &&
                "after:absolute after:bottom-0 after:left-1/2 after:w-3/4 after:h-px after:bg-pink-500 after:origin-center after:-translate-x-1/2 after:transition-transform after:duration-300 after:ease-in-out",
              !isMobile &&
                (isActive
                  ? "after:scale-x-100 group-hover:after:scale-x-0"
                  : "after:scale-x-0 hover:after:scale-x-100"),
              isHomeLink && "hidden lg:inline",
            )}
            onMouseEnter={() => handleMouseEnter(link)}
            onFocus={() => handleLinkInteraction(link)}
            onClick={isMobile ? onMobileLinkClick : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
};
```

### NavbarAuth

- **File:** `components/layout/nav/navbar-auth.tsx`
- **Description:** Renders sign-in button or user avatar depending on session state. Supports both desktop and mobile layouts.

```tsx
import { LogIn } from "lucide-react";
import Link from "next/link";
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";

interface NavbarAuthProps {
  session: Session | null;
  isMobile?: boolean;
  onMobileLinkClick?: () => void;
}

export const NavbarAuth = ({
  session,
  isMobile = false,
  onMobileLinkClick,
}: NavbarAuthProps) => {
  if (isMobile) {
    return (
      <>
        {session ? (
          <UserAvatar session={session} />
        ) : (
          <Link
            href="/login"
            className="block px-3 py-3 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
            onClick={onMobileLinkClick}
          >
            <LogIn className="inline mr-2 h-4 w-4" />
            Sign In
          </Link>
        )}
      </>
    );
  }

  return (
    <>
      {session ? (
        <UserAvatar session={session} />
      ) : (
        <Link href="/login">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </Link>
      )}
    </>
  );
};
```

### NavbarMobileNavigation

- **File:** `components/layout/nav/navbar-mobile-navigation.tsx`
- **Description:** Mobile slide-out sheet navigation using Radix Sheet. Contains nav links, search, user profile section with avatar, watchlist link, and sign out.

```tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { List, LogIn, LogOut, Menu } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

interface NavbarMobileNavigationProps {
  links: NavLink[];
  children: React.ReactNode;
  session: Session | null;
}

const getInitials = (email: string, name?: string | null) => {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
};

export const NavbarMobileNavigation = ({
  links,
  children,
  session,
}: NavbarMobileNavigationProps) => {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleLinkClick = () => {
    setOpen(false);
  };

  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name;
  const userImage = session?.user?.image;

  if (!isMounted) {
    return (
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle navigation menu"
          className="h-10 w-10"
        >
          <Menu size={20} />
        </Button>
      </div>
    );
  }

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle navigation menu"
            className="h-10 w-10"
          >
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className={cn(
            "w-[85vw] sm:w-[400px] p-0 flex flex-col",
            "bg-black/95 backdrop-blur-xl border-r border-white/10",
            "shadow-2xl shadow-black/50",
          )}
        >
          <SheetHeader className="px-6 py-5 border-b border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Link href="/" onClick={handleLinkClick} className="shrink-0">
                <Image
                  src="/logo.svg"
                  alt="NyumatFlix Logo"
                  width={150}
                  height={150}
                  className="size-8"
                />
              </Link>
              <SheetTitle className="text-left text-xl font-semibold text-white">
                Menu
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-4 py-6 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "block w-full px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-200",
                    "text-white/90 hover:text-white",
                    "hover:bg-white/10 hover:backdrop-blur-sm",
                    "focus:bg-white/10 focus:text-white focus:outline-none",
                    "active:bg-white/15",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <Separator className="my-4 bg-white/10" />

            <div className="px-4 py-4">{children}</div>
          </div>

          <div className="border-t border-white/10 bg-black/40 backdrop-blur-sm">
            {session ? (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/30 shadow-lg border-2 border-white/20">
                    <AvatarImage
                      src={userImage || ""}
                      alt={userName || userEmail}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold border-2 border-primary/30">
                      {getInitials(userEmail, userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    {userName && (
                      <p className="text-sm font-semibold text-white truncate">
                        {userName}
                      </p>
                    )}
                    <p className="text-xs text-white/70 truncate">
                      {userEmail}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/watchlist"
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-200",
                      "text-white/90 hover:text-white",
                      "hover:bg-white/10 hover:backdrop-blur-sm",
                      "focus:bg-white/10 focus:text-white focus:outline-none",
                      "active:bg-white/15",
                    )}
                  >
                    <List className="h-5 w-5" />
                    <span>Watchlist</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-200",
                      "text-red-400 hover:text-red-300",
                      "hover:bg-red-500/10 hover:backdrop-blur-sm",
                      "focus:bg-red-500/10 focus:text-red-300 focus:outline-none",
                      "active:bg-red-500/15",
                    )}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <Link
                  href="/login"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center justify-center gap-2 w-full px-4 py-3.5 text-base font-semibold rounded-xl transition-all duration-200",
                    "bg-primary text-white shadow-lg shadow-primary/30",
                    "hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black",
                    "active:scale-[0.98]",
                  )}
                >
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
```

### NavbarMobileMenu

- **File:** `components/layout/nav/navbar-mobile-menu.tsx`
- **Description:** Simple toggle-based mobile menu (hamburger/X) with dropdown content area. (Legacy; `NavbarMobileNavigation` with Sheet is the primary mobile nav.)

```tsx
"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavbarMobileMenuProps {
  children: React.ReactNode;
}

export const NavbarMobileMenu = ({ children }: NavbarMobileMenuProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          className="h-10 w-10"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1">{children}</div>
        </div>
      )}
    </>
  );
};
```

### UserAvatar

- **File:** `components/layout/nav/user-avatar.tsx`
- **Description:** Desktop user avatar dropdown with watchlist link and sign-out option. Uses Radix DropdownMenu.

```tsx
"use client";

import { List, LogOut } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserAvatarProps {
  session: Session;
}

export const UserAvatar = ({ session }: UserAvatarProps) => {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const getInitials = (email: string, name?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const userEmail = session.user?.email || "";
  const userName = session.user?.name;
  const userImage = session.user?.image;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 ring-2 ring-white/20 shadow-lg shadow-black/30">
            <AvatarImage src={userImage || ""} alt={userName || userEmail} />
            <AvatarFallback className="bg-white/10 text-white font-semibold border border-white/20">
              {getInitials(userEmail, userName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {userName && (
              <p className="text-sm font-medium leading-none">{userName}</p>
            )}
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/watchlist">
          <DropdownMenuItem className="cursor-pointer">
            <List className="mr-2 h-4 w-4" />
            <span>Watchlist</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### ToggleTheme

- **File:** `components/layout/nav/toogle-theme.tsx`
- **Description:** Theme toggle button (currently dark-only; light mode shows a "coming soon" toast).

```tsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "../../ui/button";

export const ToggleTheme = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    if (theme === "dark") {
      toast("Light mode coming soon!");
      return;
    }
    setTheme("dark");
  };

  return (
    <Button
      onClick={handleThemeToggle}
      size="sm"
      variant="ghost"
      className="w-full justify-start"
    >
      <div className="flex gap-2 dark:hidden">
        <Moon className="size-5" />
        <span className="hidden">Dark</span>
      </div>

      <div className="dark:flex gap-2 hidden">
        <Sun className="size-5" />
        <span className="hidden">Light</span>
      </div>

      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
```
