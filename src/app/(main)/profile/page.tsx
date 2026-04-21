"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  User,
  Mail,
  Shield,
  Bell,
  Lock,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Inbox,
  CalendarCheck,
  CalendarX,
  X,
} from "lucide-react";
import type { Notification } from "@/lib/db/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Tab = "profile" | "notifications" | "security" | "privacy";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "privacy", label: "Privacy", icon: Lock },
];

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) ?? "profile"
  );

  useEffect(() => {
    if (!isPending && !session) router.push("/login");
  }, [session, isPending, router]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/profile?tab=${tab}`, { scroll: false });
  };

  if (isPending || !session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const user = session.user;
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="w-full h-32 bg-linear-to-r from-primary/20 via-primary/10 to-transparent border-b border-border" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        {/* Avatar row */}
        <div className="flex items-end gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-background shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={80}
                height={80}
                className="w-20 h-20 rounded-2xl object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="pb-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">
              {user.name || "User"}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 pb-16">
          {/* Sidebar nav — horizontal scroll on mobile, vertical on desktop */}
          <nav className="lg:w-56 shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
              {tabs.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 lg:shrink lg:w-full ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                    {active && (
                      <ChevronRight className="h-4 w-4 ml-auto hidden lg:block" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "profile" && <ProfileTab user={user} />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "privacy" && <PrivacyTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  action,
  last = false,
}: {
  label: string;
  description?: string;
  action: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-4 ${!last ? "border-b border-border" : ""}`}
    >
      <div className="min-w-0">
        <p className="font-medium text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button className="px-4 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
      {label}
    </button>
  );
}

function ProfileTab({ user }: { user: { name?: string | null; email?: string; image?: string | null } }) {
  return (
    <>
      <SectionCard title="Personal Information" description="Your account details">
        <div className="space-y-0 divide-y divide-border -my-1">
          <div className="flex items-center gap-3 py-4">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Full name</p>
              <p className="font-medium text-sm truncate">{user.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email address</p>
              <p className="font-medium text-sm truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Account Status">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="font-medium text-sm">Active account</p>
            <p className="text-xs text-muted-foreground">
              Your account is in good standing
            </p>
          </div>
        </div>
      </SectionCard>
    </>
  );
}

function NotificationsTab() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Notification | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; data: Notification[] }>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleOpen = (n: Notification) => {
    setSelected(n);
    if (!n.read) markRead.mutate(n.id);
  };

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl px-6 py-16 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="font-medium text-sm">No notifications yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Booking confirmations and cancellations will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Inbox</h2>
          {unreadCount > 0 && (
            <Badge variant="blue">{unreadCount} unread</Badge>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">{' '}</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-36">Type</TableHead>
              <TableHead className="w-44">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((n) => {
              const isConfirmation = n.type === 'booking_confirmation';
              const Icon = isConfirmation ? CalendarCheck : CalendarX;

              return (
                <TableRow
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => handleOpen(n)}
                >
                  <TableCell>
                    {!n.read && (
                      <span className="block w-2 h-2 rounded-full bg-primary mx-auto" />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${!n.read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      {n.subject}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      isConfirmation
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                      {isConfirmation ? 'Confirmation' : 'Cancellation'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(n.createdAt), 'MMM d, yyyy · HH:mm')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl mx-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle>{selected?.subject}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {selected && format(new Date(selected.createdAt), 'EEEE, MMMM d, yyyy · HH:mm')}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              Simulated email
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <iframe
                srcDoc={selected?.body}
                className="w-full border-0"
                style={{ height: '600px' }}
                sandbox="allow-same-origin"
                title="Email preview"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SecurityTab() {
  return (
    <SectionCard
      title="Security"
      description="Manage your account security settings"
    >
      <SettingRow
        label="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
        action={<ActionButton label="Enable" />}
      />
      <SettingRow
        label="Change Password"
        description="Update your account password"
        action={<ActionButton label="Change" />}
        last
      />
    </SectionCard>
  );
}

function PrivacyTab() {
  return (
    <SectionCard
      title="Privacy"
      description="Control your privacy settings"
    >
      <SettingRow
        label="Profile Visibility"
        description="Control who can see your profile information"
        action={<ActionButton label="Public" />}
        last
      />
    </SectionCard>
  );
}
