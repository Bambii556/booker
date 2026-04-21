'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-foreground" />
            <span className="font-semibold text-lg">Booker</span>
          </div>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Bank Branch Appointments
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Schedule appointments at your nearest bank branch in just a few clicks. 
            Simple, fast, and available 24/7.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/branches">
              <Button size="lg">
                Browse Branches
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
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
