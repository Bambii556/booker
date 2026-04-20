"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Calendar, LayoutDashboard, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/ui/user-dropdown";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/branches", label: "Branches", icon: Building2 },
  ];

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-foreground" />
              <span className="font-semibold text-lg">Booker</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-foreground" />
            <span className="font-semibold text-lg">Booker</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <UserDropdown user={session.user} />
        </div>

        <nav className="md:hidden border-t border border-border px-4 py-2 flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-border500 dark:text-border400">
          &copy; {new Date().getFullYear()} Booker. All rights reserved.
          <Link
            href="/admin"
            className="ml-2 text-border400 hover:text-border600 dark:hover:text-border200 transition-colors text-xs"
          >
            ...
          </Link>
        </div>
      </footer>
    </div>
  );
}
