'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2, Search, ChevronLeft, ChevronRight, MapPin, Timer } from 'lucide-react';
import { BranchCard } from '@/components/branch/branch-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Branch } from '@/lib/db/schema';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface ActiveLock {
  locked: boolean;
  branchId?: string;
  branchName?: string;
  branchAddress?: string;
  slotTime?: string;
  ttl?: number;
}

async function fetchMyLock(): Promise<{ success: boolean; data: ActiveLock }> {
  const res = await fetch('/api/locks/mine');
  if (!res.ok) return { success: false, data: { locked: false } };
  return res.json();
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface BranchesResponse {
  success: boolean;
  data: {
    branches: Branch[];
    pagination: PaginationInfo;
  };
}

async function fetchBranches(page: number, search: string): Promise<BranchesResponse> {
  const params = new URLSearchParams({ page: page.toString(), limit: '20' });
  if (search) params.set('search', search);
  const res = await fetch(`/api/branches?${params}`);
  if (!res.ok) throw new Error('Failed to fetch branches');
  return res.json();
}

export default function BranchesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionPending } = useSession();
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') ?? '');
  const [page, setPage] = useState(() => Number(searchParams.get('page') ?? 1));

  useEffect(() => {
    if (!sessionPending && !session) router.push('/login');
  }, [session, sessionPending, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', '1');
      router.replace(`/branches?${params}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('page', page.toString());
    router.replace(`/branches?${params}`, { scroll: false });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['branches', page, debouncedSearch],
    queryFn: () => fetchBranches(page, debouncedSearch),
    enabled: !!session,
  });

  const { data: myLockData } = useQuery({
    queryKey: ['my-lock'],
    queryFn: fetchMyLock,
    enabled: !!session,
    staleTime: 0,
    refetchInterval: 15000,
  });

  const activeLock = myLockData?.data?.locked ? myLockData.data : null;

  useEffect(() => {
    if (isError) toast.error('Failed to load branches');
  }, [isError, error]);

  if (sessionPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const branches = data?.data?.branches ?? [];
  const pagination = data?.data?.pagination ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Branches</h1>
            <p className="text-sm text-muted-foreground">
              {pagination ? `${pagination.total} branches across South Africa` : 'Find your nearest branch'}
            </p>
          </div>
        </div>
      </div>

      {/* In-progress reservation banner */}
      {activeLock && activeLock.slotTime && (activeLock.ttl ?? 0) > 0 && (
        <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-amber-800 dark:text-amber-200 truncate">
                Slot reserved — {activeLock.branchName}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {format(toZonedTime(parseISO(activeLock.slotTime), 'Africa/Johannesburg'), "EEEE, MMMM d 'at' HH:mm")}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => {
              const slotDate = parseISO(activeLock.slotTime!);
              const dateStr = format(slotDate, 'yyyy-MM-dd');
              router.push(
                `/branches/appointments/${activeLock.branchId}?date=${dateStr}&slot=${encodeURIComponent(activeLock.slotTime!)}`,
              );
            }}
          >
            Continue Booking
          </Button>
        </div>
      )}

      {/* Search + count */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {pagination && (
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="font-medium">No branches found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? 'Try a different search term' : 'No branches available'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-8">
            {branches.map(branch => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev || isLoading}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className="w-9 h-9 p-0 rounded-lg"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <span className="sm:hidden text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext || isLoading}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
