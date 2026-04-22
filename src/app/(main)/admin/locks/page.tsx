"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Lock, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

interface LockInfo {
  key: string;
  branchId: string;
  slotTime: string;
  userId: string;
  ttlReadable: string;
}

export default function AdminLocksPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<LockInfo | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useQuery<{ success: boolean; data: LockInfo[] }>({
    queryKey: ["locks"],
    queryFn: () => fetch("/api/admin/locks").then((r) => r.json()),
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) =>
      fetch(`/api/admin/redis?key=${encodeURIComponent(key)}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locks"] });
      setSelected(null);
    },
  });

  const locks = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Slot Locks</h1>
          <p className="text-sm text-muted-foreground">Active distributed booking locks</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{locks.length} active</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading || isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 rounded-xl bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {(error as Error).message}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch ID</TableHead>
              <TableHead>Slot Time</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead className="w-32">TTL</TableHead>
              <TableHead className="w-16">{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : locks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No active locks</TableCell>
              </TableRow>
            ) : (
              locks.map((lock) => (
                <TableRow key={lock.key}>
                  <TableCell className="font-mono text-sm">{lock.branchId}</TableCell>
                  <TableCell className="text-sm">{lock.slotTime}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{lock.userId}</TableCell>
                  <TableCell className="text-sm">{lock.ttlReadable}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => setSelected(lock)}
                      disabled={deleteMutation.isPending}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Release Lock</DialogTitle>
            <DialogDescription>
              This will immediately free the slot for other users.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">{selected?.key}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selected && deleteMutation.mutate(selected.key)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Releasing..." : "Release Lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
