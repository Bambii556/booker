'use client';

import Link from 'next/link';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Zap,
  MapPin,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Building2,
  Lock,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    number: '01',
    icon: '🏦',
    title: 'Find your branch',
    description: 'Browse 880+ bank branches across South Africa and select the one closest to you.',
  },
  {
    number: '02',
    icon: '📅',
    title: 'Pick a time slot',
    description: 'View real-time availability and choose a 30-minute slot that works for you.',
  },
  {
    number: '03',
    icon: '🔒',
    title: 'Reserve your slot',
    description: 'Your slot is held with a time-limited lock so no one else can grab it while you book.',
  },
  {
    number: '04',
    icon: '✅',
    title: 'You\'re confirmed',
    description: 'Receive a confirmation with your booking reference and add it straight to your calendar.',
  },
];

const FEATURES = [
  {
    icon: <Zap className="h-5 w-5 text-primary" />,
    title: 'Real-time availability',
    description: 'Slots update instantly. No stale calendars, no double bookings.',
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    title: 'Race condition safe',
    description: 'Redis locking and a database-level unique index guarantee one booking per slot.',
  },
  {
    icon: <MapPin className="h-5 w-5 text-primary" />,
    title: '880+ branches',
    description: 'Full coverage across South Africa — every major bank branch in one place.',
  },
  {
    icon: <Clock className="h-5 w-5 text-primary" />,
    title: '30-minute slots',
    description: 'Weekdays 08:00 – 17:00. Slots open up immediately when someone cancels.',
  },
  {
    icon: <RefreshCw className="h-5 w-5 text-primary" />,
    title: 'Instant cancellation',
    description: 'Cancel any time and the slot is freed instantly for the next customer.',
  },
  {
    icon: <Lock className="h-5 w-5 text-primary" />,
    title: 'Secure by default',
    description: 'Session-based auth, revocable tokens, and no sensitive data in the browser.',
  },
];

const STATS = [
  { value: '880+', label: 'Bank branches' },
  { value: '30 min', label: 'Slot duration' },
  { value: '24/7', label: 'Online booking' },
  { value: '0', label: 'Double bookings' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">Booker</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#branches" className="hover:text-foreground transition-colors">Branches</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Real-time slot availability across South Africa
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Book your bank branch{' '}
              <span className="text-primary">appointment</span>{' '}
              in seconds
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Skip the queue. Choose your branch, pick a time slot, and secure your appointment — all online, all in under a minute.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link href="/signup">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Book an appointment <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  See how it works
                </Button>
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              No credit card required · Free to use · Instant confirmation
            </p>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {[
                { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'No double bookings' },
                { icon: <ShieldCheck className="h-4 w-4 text-blue-500" />, label: 'Secure sessions' },
                { icon: <Building2 className="h-4 w-4 text-primary" />, label: '880+ branches covered' },
              ].map(({ icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-border bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">From branch to booking in 4 steps</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div key={step.number} className="relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-all">
                <span className="text-xs font-bold text-primary/40 font-mono">{step.number}</span>
                <div className="text-3xl my-3">{step.icon}</div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-muted/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Features</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Built for reliability at scale</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Every edge case handled — from race conditions to timezone conversions.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-sm transition-all">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Branches CTA */}
        <section id="branches" className="py-24 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
            <Users className="h-3.5 w-3.5" />
            880+ branches ready to book
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Your nearest branch is waiting
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Every major bank branch across South Africa — searchable, bookable, and confirmed in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-foreground">Booker</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Booker. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
