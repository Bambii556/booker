import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <Calendar className="h-6 w-6 text-foreground" />
            <span className="font-semibold text-lg">Booker</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Booker. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
