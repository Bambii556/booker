"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Database, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

interface RedisKey {
  key: string;
  type: string;
  value: string | null;
  ttl: number | null;
  ttlReadable: string | null;
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    string: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    list: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    set: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    zset: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    hash: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };
  return map[type] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
}

export default function AdminRedisPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<RedisKey | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useQuery<{ success: boolean; data: RedisKey[] }>({
    queryKey: ["redis-keys"],
    queryFn: () => fetch("/api/admin/redis").then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) =>
      fetch(`/api/admin/redis?key=${encodeURIComponent(key)}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redis-keys"] });
      setSelected(null);
    },
  });

  const keys = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Database className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Redis</h1>
          <p className="text-sm text-muted-foreground">Inspect and manage Redis keys</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{keys.length} keys</span>
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
              <TableHead>Key</TableHead>
              <TableHead className="w-24">Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-32">TTL</TableHead>
              <TableHead className="w-16">{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No Redis keys found</TableCell>
              </TableRow>
            ) : (
              keys.map((item) => (
                <TableRow key={item.key}>
                  <TableCell className="font-mono text-sm max-w-xs truncate">{item.key}</TableCell>
                  <TableCell>
                    <Badge className={typeColor(item.type)}>{item.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-xs truncate text-muted-foreground">{item.value}</TableCell>
                  <TableCell className="text-sm">{item.ttlReadable ?? <span className="text-muted-foreground">No expiry</span>}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => setSelected(item)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Redis Key</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">{selected?.key}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selected && deleteMutation.mutate(selected.key)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
