"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  User,
  Mail,
  Shield,
  Bell,
  Lock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

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
      <div className="w-full h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-border" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        {/* Avatar row */}
        <div className="flex items-end gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-background flex-shrink-0">
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
          <nav className="lg:w-56 flex-shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
              {tabs.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:w-full ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
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
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}

function Toggle({ enabled = false }: { enabled?: boolean }) {
  const [on, setOn] = useState(enabled);
  return (
    <input
      type="checkbox"
      checked={on}
      onChange={() => setOn(!on)}
      className="w-11 h-6 appearance-none rounded-full cursor-pointer transition-colors
        bg-muted checked:bg-primary
        relative before:absolute before:top-1 before:left-1 before:w-4 before:h-4
        before:rounded-full before:bg-white before:shadow before:transition-transform
        checked:before:translate-x-5"
    />
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
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Full name</p>
              <p className="font-medium text-sm truncate">{user.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email address</p>
              <p className="font-medium text-sm truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Account Status">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
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
  return (
    <SectionCard
      title="Notifications"
      description="Configure how you receive notifications"
    >
      <SettingRow
        label="Email Notifications"
        description="Receive email reminders for upcoming appointments"
        action={<Toggle enabled />}
      />
      <SettingRow
        label="SMS Notifications"
        description="Receive SMS reminders 24 hours before appointments"
        action={<Toggle />}
        last
      />
    </SectionCard>
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
