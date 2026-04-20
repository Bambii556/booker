"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { User, Mail, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending || !session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted200 dark:bg-muted800 rounded-lg" />
        </div>
      </div>
    );
  }

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground600 dark:text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-muted900 dark:bg-muted100 flex items-center justify-center text-white dark:text-muted-foreground900 text-2xl font-semibold">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name || "User"}</h2>
              <p className="text-muted-foreground500 dark:text-muted-foreground text-sm">
                Account holder
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 py-3 border-b border-muted100 dark:border-muted800">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground500 dark:text-muted-foreground">
                  Email
                </p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-3 border-b border-muted100 dark:border-muted800">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground500 dark:text-muted-foreground">
                  Account Status
                </p>
                <p className="font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground500 dark:text-muted-foreground">
                  Location
                </p>
                <p className="font-medium">South Africa</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
