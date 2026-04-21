"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Database,
  Lock,
  BriefcaseBusiness,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface JobRun {
  status: string;
  startedAt: string;
}

interface Job {
  name: string;
  label: string;
  schedule: string;
  lastRun: JobRun | null;
}

function StatusDot({ status }: { status: string }) {
  if (status === "success") return <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />;
  if (status === "failed") return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block animate-pulse" />;
}

export default function AdminPage() {
  const { data: jobsData } = useQuery<{ success: boolean; data: Job[] }>({
    queryKey: ["admin-jobs"],
    queryFn: () => fetch("/api/admin/jobs").then((r) => r.json()),
  });

  const { data: locksData } = useQuery<{ success: boolean; data: unknown[] }>({
    queryKey: ["locks"],
    queryFn: () => fetch("/api/admin/locks").then((r) => r.json()),
  });

  const { data: redisData } = useQuery<{ success: boolean; data: unknown[] }>({
    queryKey: ["redis-keys"],
    queryFn: () => fetch("/api/admin/redis").then((r) => r.json()),
  });

  const jobs = jobsData?.data ?? [];
  const lockCount = (locksData?.data ?? []).length;
  const redisKeyCount = (redisData?.data ?? []).length;
  const failedJobs = jobs.filter((j) => j.lastRun?.status === "failed").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground">System monitoring and management</p>
        </div>
        <Badge variant="outline" className="ml-auto">Internal</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/jobs" className="group block">
          <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-all h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BriefcaseBusiness className="h-5 w-5 text-primary" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h2 className="font-semibold mb-1">Background Jobs</h2>
            <p className="text-sm text-muted-foreground mb-4">Schedule, monitor, and manually trigger background jobs.</p>
            <div className="space-y-2">
              {jobs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : (
                jobs.map((job) => (
                  <div key={job.name} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{job.label}</span>
                    {job.lastRun ? (
                      <span className="flex items-center gap-1.5">
                        <StatusDot status={job.lastRun.status} />
                        <span className="text-muted-foreground">
                          {new Date(job.lastRun.startedAt).toLocaleDateString()}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never run</span>
                    )}
                  </div>
                ))
              )}
              {failedJobs > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs text-red-600 font-medium">{failedJobs} job{failedJobs > 1 ? 's' : ''} failed</span>
                </div>
              )}
            </div>
          </div>
        </Link>

        <Link href="/admin/redis" className="group block">
          <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-all h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-orange-500" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h2 className="font-semibold mb-1">Redis</h2>
            <p className="text-sm text-muted-foreground mb-4">Inspect and manage Redis keys and cached data.</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{redisKeyCount}</span>
              <span className="text-sm text-muted-foreground">active keys</span>
            </div>
          </div>
        </Link>

        <Link href="/admin/locks" className="group block">
          <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-all h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-violet-500" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h2 className="font-semibold mb-1">Slot Locks</h2>
            <p className="text-sm text-muted-foreground mb-4">View and release active distributed booking locks.</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{lockCount}</span>
              <span className="text-sm text-muted-foreground">active lock{lockCount !== 1 ? 's' : ''}</span>
              {lockCount > 0 && (
                <span className="ml-auto flex items-center gap-1 text-xs text-amber-600">
                  <Clock className="h-3.5 w-3.5" /> live
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-6 p-4 bg-muted/40 border border-border rounded-xl flex items-center gap-3 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        Admin tools are for internal use only. Changes here directly affect production data.
      </div>
    </div>
  );
}
