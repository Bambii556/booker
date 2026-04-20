"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Trash2,
  RefreshCw,
  AlertCircle,
  Database,
  Activity,
  Lock,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface RedisKey {
  key: string;
  type: string;
  value: string | null;
  ttl: number | null;
  ttlReadable: string | null;
}

interface LockInfo {
  key: string;
  branchId: string;
  slotTime: string;
  userId: string;
  ttlReadable: string;
}

interface AdminResponse {
  success: boolean;
  data: RedisKey[] | LockInfo[];
}

async function fetchRedisKeys(): Promise<AdminResponse> {
  const res = await fetch("/api/admin/redis");
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch Redis keys");
  return data;
}

async function fetchLocks(): Promise<AdminResponse> {
  const res = await fetch("/api/admin/locks");
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch locks");
  return data;
}

async function deleteRedisKey(key: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/admin/redis?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete key");
  return data;
}

async function deleteLock(key: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/admin/redis?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete lock");
  return data;
}

function getTypeColor(type: string): string {
  switch (type) {
    case "string":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "list":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "set":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "zset":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "hash":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

type TabId = "redis" | "locks";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("redis");
  const [selectedRedisKey, setSelectedRedisKey] = useState<RedisKey | null>(null);
  const [selectedLock, setSelectedLock] = useState<LockInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"redis" | "lock">("redis");

  const { data: redisData, isLoading: redisLoading, error: redisError, refetch: refetchRedis, isRefetching: redisRefetching } = useQuery({
    queryKey: ["redis-keys"],
    queryFn: fetchRedisKeys,
  });

  const { data: locksData, isLoading: locksLoading, error: locksError, refetch: refetchLocks, isRefetching: locksRefetching } = useQuery({
    queryKey: ["locks"],
    queryFn: fetchLocks,
  });

  const deleteMutation = useMutation({
    mutationFn: (payload: { key: string; type: "redis" | "lock" }) =>
      payload.type === "redis" ? deleteRedisKey(payload.key) : deleteLock(payload.key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redis-keys"] });
      queryClient.invalidateQueries({ queryKey: ["locks"] });
      setDeleteDialogOpen(false);
      setSelectedRedisKey(null);
      setSelectedLock(null);
    },
  });

  const handleDelete = (key: string, type: "redis" | "lock") => {
    setDeleteType(type);
    if (type === "redis") {
      setSelectedRedisKey((redisData?.data as RedisKey[])?.find((k) => k.key === key) || null);
    } else {
      setSelectedLock((locksData?.data as LockInfo[])?.find((l) => l.key === key) || null);
    }
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    const key = deleteType === "redis" ? selectedRedisKey?.key : selectedLock?.key;
    if (key) {
      deleteMutation.mutate({ key, type: deleteType });
    }
  };

  const redisKeys = (redisData?.data as RedisKey[]) || [];
  const locks = (locksData?.data as LockInfo[]) || [];

  const isLoading = activeTab === "redis" ? redisLoading : locksLoading;
  const isRefetching = activeTab === "redis" ? redisRefetching : locksRefetching;
  const error = activeTab === "redis" ? redisError : locksError;
  const dataLength = activeTab === "redis" ? redisKeys.length : locks.length;

  const refetch = activeTab === "redis" ? refetchRedis : refetchLocks;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Admin</h1>
        <Badge variant="outline" className="ml-2">
          Debug Only
        </Badge>
      </div>

      <div className="flex gap-1 mb-6 border-b">
        <Button
          variant={activeTab === "redis" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("redis")}
          className="gap-2 rounded-b-none"
        >
          <Database className="h-4 w-4" />
          Redis
        </Button>
        <Button
          variant={activeTab === "locks" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("locks")}
          className="gap-2 rounded-b-none"
        >
          <Lock className="h-4 w-4" />
          Locks
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          variant="outline"
          size="sm"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefetching && "animate-spin"}`}
          />
          Refresh
        </Button>
        <span className="text-sm text-muted-500">
          {activeTab === "redis" ? `${redisKeys.length} keys` : `${locks.length} locks`}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200">
          <AlertCircle className="h-4 w-4" />
          {error.message}
        </div>
      )}

      {activeTab === "redis" ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redisLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : redisKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-500">
                    No Redis keys found
                  </TableCell>
                </TableRow>
              ) : (
                redisKeys.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {item.key}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-xs truncate text-muted-500">
                      {item.value}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.ttlReadable ?? <span className="text-muted-400">No expiry</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.key, "redis")}
                          disabled={deleteMutation.isPending}
                          title="Delete"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>Slot Time</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locksLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : locks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-500">
                    No active locks
                  </TableCell>
                </TableRow>
              ) : (
                locks.map((lock) => (
                  <TableRow key={lock.key}>
                    <TableCell className="font-mono text-sm">{lock.branchId}</TableCell>
                    <TableCell className="text-sm">{lock.slotTime}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-500">
                      {lock.userId}
                    </TableCell>
                    <TableCell className="text-sm">{lock.ttlReadable}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(lock.key, "lock")}
                        disabled={deleteMutation.isPending}
                        title="Delete Lock"
                        className="text-red-600 hover:text-red-700"
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
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === "redis" ? "Redis Key" : "Lock"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {(deleteType === "redis" ? selectedRedisKey : selectedLock) && (
            <div className="p-3 bg-muted100 dark:bg-muted800 rounded font-mono text-sm break-all">
              {deleteType === "redis" ? selectedRedisKey?.key : selectedLock?.key}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}