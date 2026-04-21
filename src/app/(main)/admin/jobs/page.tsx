"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  BriefcaseBusiness,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface JobRun {
  id: string;
  jobName: string;
  status: string;
  triggeredBy: string;
  affectedRows: number | null;
  durationMs: number | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

interface Job {
  name: string;
  label: string;
  schedule: string;
  lastRun: JobRun | null;
  recentRuns: JobRun[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
      <CheckCircle2 className="h-3.5 w-3.5" /> success
    </span>
  );
  if (status === "failed") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
      <XCircle className="h-3.5 w-3.5" /> failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
      <Clock className="h-3.5 w-3.5" /> running
    </span>
  );
}

export default function AdminJobsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ success: boolean; data: Job[] }>({
    queryKey: ["admin-jobs"],
    queryFn: () => fetch("/api/admin/jobs").then((r) => r.json()),
    refetchInterval: 10000,
  });

  const runJobMutation = useMutation({
    mutationFn: (name: string) =>
      fetch(`/api/admin/jobs/${name}`, { method: "POST" }).then((r) => r.json()),
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success(`Job triggered successfully`);
      console.log(`[admin] manually triggered job: ${name}`);
    },
    onError: () => toast.error("Job failed to run"),
  });

  const jobs = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BriefcaseBusiness className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Background Jobs</h1>
          <p className="text-sm text-muted-foreground">Schedule, monitor, and trigger jobs manually</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.name} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between gap-4 border-b border-border">
                <div>
                  <p className="font-semibold">{job.label}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{job.schedule}</p>
                </div>
                <div className="flex items-center gap-4">
                  {job.lastRun && (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Last run</p>
                      <p className="text-xs font-medium">
                        {new Date(job.lastRun.startedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {job.lastRun && <StatusBadge status={job.lastRun.status} />}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={runJobMutation.isPending && runJobMutation.variables === job.name}
                    onClick={() => runJobMutation.mutate(job.name)}
                  >
                    {runJobMutation.isPending && runJobMutation.variables === job.name
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Play className="h-3.5 w-3.5" />
                    }
                    Run now
                  </Button>
                </div>
              </div>

              {job.recentRuns.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No runs yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Triggered by</TableHead>
                      <TableHead>Rows affected</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.recentRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell><StatusBadge status={run.status} /></TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${run.triggeredBy === "manual" ? "text-primary" : "text-muted-foreground"}`}>
                            {run.triggeredBy}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{run.affectedRows ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {run.durationMs != null ? `${run.durationMs}ms` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(run.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-red-600 max-w-xs truncate">
                          {run.error ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
