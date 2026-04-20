'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { BranchCard } from '@/components/branch/branch-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Branch } from '@/lib/db/schema';
import { toast } from 'sonner';

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
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
  });
  if (search) {
    params.set('search', search);
  }
  const res = await fetch(`/api/branches?${params}`);
  if (!res.ok) {
    throw new Error('Failed to fetch branches');
  }
  return res.json();
}

export default function BranchesPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push('/login');
    }
  }, [session, sessionPending, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['branches', page, debouncedSearch],
    queryFn: () => fetchBranches(page, debouncedSearch),
    enabled: !!session,
  });

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load branches');
    }
  }, [isError, error]);

  if (sessionPending) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const branches = data?.data?.branches ?? [];
  const pagination = data?.data?.pagination ?? null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Our Branches</h1>
        <p className="text-muted-foreground dark:text-muted-foreground">
          Select a branch to book an appointment
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
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
          <>
            <div className="sm:hidden text-xs text-muted-foreground500">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} branches
            </div>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No branches found</h3>
          <p className="text-muted-foreground dark:text-muted-foreground">
            {search ? 'Try a different search term' : 'No branches available'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-24">
            {branches.map(branch => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev || isLoading}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4 mr-1 hidden sm:inline" />
                <span className="sm:hidden">Prev</span>
                <span className="hidden sm:inline">Previous</span>
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
                      variant={pageNum === pagination.page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext || isLoading}
                className="flex-1 sm:flex-none"
              >
                <span className="sm:hidden">Next</span>
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 ml-1 hidden sm:inline" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
