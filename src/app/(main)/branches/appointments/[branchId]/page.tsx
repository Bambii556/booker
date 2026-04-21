"use client";

import { use, useState, useEffect, useCallback, useRef, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Loader2,
  Calendar as CalendarIcon,
  Check,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SlotGrid } from "@/components/booking/slot-grid";
import { toast } from "sonner";
import Link from "next/link";
import type { Branch } from "@/lib/db/schema";
import type { Slot } from "@/types";

interface BranchResponse {
  success: boolean;
  data: Branch;
}

interface SlotsResponse {
  success: boolean;
  data: {
    date: string;
    slots: Array<{ time: string; available: boolean; locked?: boolean }>;
  };
}

interface BookingResponse {
  success: boolean;
  data: {
    id: string;
  };
  error?: string;
  message?: string;
}

interface LockInfo {
  branchId: string;
  slotTime: string;
  expiresAt: Date;
}

async function fetchBranch(branchId: string): Promise<BranchResponse> {
  const res = await fetch(`/api/branches/${branchId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch branch");
  }
  return data;
}

async function fetchSlots(
  branchId: string,
  date: Date,
): Promise<SlotsResponse> {
  const dateStr = format(date, "yyyy-MM-dd");
  const res = await fetch(`/api/branches/${branchId}/slots?date=${dateStr}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch slots");
  }
  return data;
}

async function acquireLock(
  branchId: string,
  slotTime: Date,
  ttlSeconds?: number,
): Promise<{ success: boolean; ttl?: number; error?: string }> {
  const res = await fetch("/api/locks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      branchId,
      slotTime: slotTime.toISOString(),
      ttlSeconds,
    }),
  });
  const data = await res.json();
  return data;
}

async function releaseLock(branchId: string, slotTime: Date): Promise<void> {
  await fetch(
    `/api/locks?branchId=${branchId}&slotTime=${slotTime.toISOString()}`,
    {
      method: "DELETE",
    },
  );
}

async function getLockInfo(
  branchId: string,
  slotTime: Date,
): Promise<{ locked: boolean; ttl: number; userId?: string }> {
  const res = await fetch(
    `/api/locks/info?branchId=${branchId}&slotTime=${slotTime.toISOString()}`,
  );
  const data = await res.json();
  return data.data;
}

async function createBooking(
  branchId: string,
  scheduledAt: Date,
): Promise<BookingResponse> {
  const res = await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      branchId,
      scheduledAt: scheduledAt.toISOString(),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to book appointment");
  }
  return data;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = useSession();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [lockTTL, setLockTTL] = useState<number>(0);
  const [isRestoring, setIsRestoring] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/login");
    }
  }, [session, sessionPending, router]);

  // Restore state from URL params on mount
  useEffect(() => {
    const dateParam = searchParams.get("date");
    const slotParam = searchParams.get("slot");

    startTransition(() => {
      if (dateParam) {
        const parsedDate = new Date(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);

          if (slotParam) {
            const parsedSlot = new Date(slotParam);
            if (!isNaN(parsedSlot.getTime())) {
              setSelectedSlot({ time: parsedSlot, available: true });
            }
          }
        }
      }

      setIsRestoring(false);
    });
  }, [searchParams]);

  // Sync selections to URL params
  const prevStateRef = useRef<{ date: string | null; slot: string | null }>({ date: null, slot: null });

  useEffect(() => {
    if (isRestoring) return;

    const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
    const slotStr = selectedSlot ? selectedSlot.time.toISOString() : null;

    if (prevStateRef.current.date === dateStr && prevStateRef.current.slot === slotStr) {
      return;
    }

    prevStateRef.current = { date: dateStr, slot: slotStr };

    const params = new URLSearchParams();
    if (dateStr) params.set("date", dateStr);
    if (slotStr) params.set("slot", slotStr);

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [selectedDate, selectedSlot, isRestoring, router]);

  // Restore lock from localStorage on mount
  useEffect(() => {
    const restoreLock = async () => {
      const stored = localStorage.getItem("lockInfo");
      if (stored && session?.user) {
        try {
          const parsed = JSON.parse(stored) as LockInfo & { branchId: string };
          if (parsed.branchId === resolvedParams.branchId) {
            const lockCheck = await getLockInfo(resolvedParams.branchId, new Date(parsed.slotTime));
            if (lockCheck.locked && lockCheck.userId === session.user.id && lockCheck.ttl && lockCheck.ttl > 0) {
              setSelectedSlot({ time: new Date(parsed.slotTime), available: true, locked: true });
              setLockInfo({
                branchId: parsed.branchId,
                slotTime: parsed.slotTime,
                expiresAt: new Date(Date.now() + lockCheck.ttl * 1000),
              });
              setLockTTL(lockCheck.ttl);
            } else {
              localStorage.removeItem("lockInfo");
            }
          }
        } catch {
          localStorage.removeItem("lockInfo");
        }
      }
    };

    if (session && !sessionPending) {
      restoreLock();
    }
  }, [session, sessionPending, resolvedParams.branchId]);

  // Persist lock to localStorage
  useEffect(() => {
    if (lockInfo) {
      localStorage.setItem("lockInfo", JSON.stringify(lockInfo));
    } else {
      localStorage.removeItem("lockInfo");
    }
  }, [lockInfo]);

  // Handle reservation expiration
  const handleExpiration = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    toast.error("Reservation expired", {
      description: "Please select a new time slot.",
    });

    const expiredSlot = lockInfo?.slotTime;
    setSelectedSlot(null);
    setLockInfo(null);

    if (expiredSlot) {
      await releaseLock(resolvedParams.branchId, new Date(expiredSlot));
    }
    queryClient.invalidateQueries({ queryKey: ["slots", resolvedParams.branchId] });
  }, [lockInfo, queryClient, resolvedParams.branchId]);

  // Countdown timer effect
  useEffect(() => {
    if (lockInfo?.expiresAt) {
      const updateTTL = () => {
        const remaining = Math.max(
          0,
          Math.floor((lockInfo.expiresAt.getTime() - Date.now()) / 1000),
        );
        setLockTTL(remaining);

        if (remaining <= 0) {
          handleExpiration();
        }
      };

      updateTTL();
      intervalRef.current = setInterval(updateTTL, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [lockInfo, handleExpiration]);

  const { data: branchData, isLoading: loadingBranch } = useQuery({
    queryKey: ["branch", resolvedParams.branchId],
    queryFn: () => fetchBranch(resolvedParams.branchId),
    enabled: !!session,
  });

  const {
    data: slotsData,
    isLoading: loadingSlots,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: ["slots", resolvedParams.branchId, selectedDate],
    queryFn: () => fetchSlots(resolvedParams.branchId, selectedDate!),
    enabled: !!session && !!selectedDate,
  });

  const slots: Slot[] =
    slotsData?.data?.slots.map((slot) => ({
      time: new Date(slot.time),
      available: slot.available,
      locked: slot.locked,
    })) ?? [];

  const handleSlotSelect = async (slot: Slot) => {
    if (!slot.available) return;

    // If clicking on already selected slot with lock, do nothing
    if (selectedSlot?.time.getTime() === slot.time.getTime() && lockInfo) {
      return;
    }

    // First fetch fresh slot states to ensure slot is still available
    await refetchSlots();

    // Re-check availability after refetch
    const currentSlotsData = queryClient.getQueryData<{ data: { date: string; slots: Array<{ time: string; available: boolean; locked?: boolean }> } }>(
      ["slots", resolvedParams.branchId, selectedDate],
    );
    const currentSlot = currentSlotsData?.data.slots.find(
      (s) => new Date(s.time).getTime() === slot.time.getTime(),
    );
    if (!currentSlot?.available) {
      toast.error("Slot unavailable", {
        description: "This slot is no longer available. Please choose another time.",
      });
      return;
    }

    // Release previous lock if exists
    if (lockInfo) {
      await releaseLock(
        resolvedParams.branchId,
        new Date(lockInfo.slotTime),
      );
    }

    try {
      const result = await acquireLock(resolvedParams.branchId, slot.time);

      if (result.success) {
        const ttl = result.ttl || 300;
        setSelectedSlot(slot);
        setLockInfo({
          branchId: resolvedParams.branchId,
          slotTime: slot.time.toISOString(),
          expiresAt: new Date(Date.now() + ttl * 1000),
        });
        setLockTTL(ttl);

        // Update slots cache: old slot becomes available, new slot becomes locked
        const oldSlotTime = lockInfo?.slotTime;
        queryClient.setQueryData<{ data: { date: string; slots: Array<{ time: string; available: boolean; locked?: boolean }> } }>(
          ["slots", resolvedParams.branchId, selectedDate],
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                slots: oldData.data.slots.map((s) => {
                  const slotDate = new Date(s.time);
                  // Old slot becomes available
                  if (oldSlotTime && slotDate.getTime() === new Date(oldSlotTime).getTime()) {
                    return { ...s, available: true, locked: false };
                  }
                  // New slot becomes locked
                  if (slotDate.getTime() === slot.time.getTime()) {
                    return { ...s, available: false, locked: true };
                  }
                  return s;
                }),
              },
            };
          },
        );
      } else {
        toast.error("Slot unavailable", {
          description:
            "This slot is being booked by another user. Please choose another time.",
        });

        // Update cache to mark slot as locked by another user
        queryClient.setQueryData<{ data: { date: string; slots: Array<{ time: string; available: boolean; locked?: boolean }> } }>(
          ["slots", resolvedParams.branchId, selectedDate],
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                slots: oldData.data.slots.map((s) => {
                  if (new Date(s.time).getTime() === slot.time.getTime()) {
                    return { ...s, available: false, locked: true };
                  }
                  return s;
                }),
              },
            };
          },
        );
      }
    } catch {
      toast.error("Failed to reserve slot");
    }
  };

  // Cleanup lock on unmount — intentionally empty deps to run only once
  useEffect(() => {
    return () => {
      if (lockInfo) {
        releaseLock(lockInfo.branchId, new Date(lockInfo.slotTime));
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot || !branchData?.data) {
        throw new Error("Missing slot or branch");
      }

      // Create booking
      const result = await createBooking(branchData.data.id, selectedSlot.time);

      // Release lock after successful booking
      if (lockInfo) {
        await releaseLock(resolvedParams.branchId, new Date(lockInfo.slotTime));
        setLockInfo(null);
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success("Appointment booked!", {
        description: "Redirecting to confirmation...",
      });
      router.push(`/appointments/${data.data.id}`);
    },
    onError: (error: Error) => {
      if (error.message === "SLOT_TAKEN") {
        toast.error("This slot was just taken", {
          description: "Please choose another time slot.",
        });
        setSelectedSlot(null);
        setLockInfo(null);
        refetchSlots();
      } else {
        toast.error(error.message || "Failed to book appointment");
      }
    },
  });

  if (sessionPending || loadingBranch) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const branch = branchData?.data;

  if (!branch) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold mb-2">Branch not found</p>
        <p className="text-muted-foreground mb-6">The branch you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/branches")}>Browse Branches</Button>
      </div>
    );
  }

  const step = !selectedDate ? 1 : !selectedSlot ? 2 : 3;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Back */}
      <Link
        href="/branches"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to branches
      </Link>

      {/* Branch header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{branch.name}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{branch.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Open {branch.openingTime.slice(0, 5)} – {branch.closingTime.slice(0, 5)}, weekdays</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: "Choose a date" },
          { n: 2, label: "Choose a time" },
          { n: 3, label: "Confirm" },
        ].map(({ n, label }, i) => {
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${active ? "text-foreground" : done ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active ? "bg-primary text-white" : done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : n}
                </div>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px w-8 transition-colors ${step > n ? "bg-primary/40" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>

      {/* Main booking area */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Step 1 — Date picker */}
        <div className={`bg-card border rounded-2xl overflow-hidden transition-all ${step === 1 ? "border-primary/50 shadow-md" : "border-border"}`}>
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > 1 ? "bg-primary/20 text-primary" : "bg-primary text-white"}`}>
              {step > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
            </div>
            <div>
              <p className="font-semibold text-sm">Choose a date</p>
              {selectedDate && (
                <p className="text-xs text-primary font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
              )}
            </div>
          </div>
          <div className="p-5">
            <DatePicker
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              minDate={new Date()}
              maxDaysAhead={30}
            />
          </div>
        </div>

        {/* Step 2 — Slot picker */}
        <div className={`bg-card border rounded-2xl overflow-hidden transition-all ${step === 2 ? "border-primary/50 shadow-md" : "border-border"}`}>
          {loadingSlots && (
            <div className="h-0.5 w-full bg-muted overflow-hidden">
              <div className="h-full w-1/2 bg-primary rounded-full animate-[loading-bar_1s_ease-in-out_infinite]" />
            </div>
          )}
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > 2 ? "bg-primary/20 text-primary" : step === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              {step > 2 ? <Check className="h-3.5 w-3.5" /> : "2"}
            </div>
            <div>
              <p className="font-semibold text-sm">Choose a time</p>
              {selectedDate && (
                <p className="text-xs text-muted-foreground">
                  {selectedDate ? `Slots for ${format(selectedDate, "MMM d")}` : "Select a date first"}
                </p>
              )}
            </div>
          </div>
          <div className="p-5">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <CalendarIcon className="h-8 w-8 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">Select a date on the left to see available times</p>
              </div>
            ) : (
              <SlotGrid
                slots={slots}
                selectedSlot={selectedSlot?.time || null}
                onSlotSelect={handleSlotSelect}
                loading={loadingSlots}
                userLockedSlot={lockInfo ? new Date(lockInfo.slotTime) : null}
              />
            )}
          </div>
        </div>
      </div>

      {/* Reservation timer */}
      {lockInfo && lockTTL > 0 && (
        <div className="my-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">
                Slot reserved — {format(parseISO(lockInfo.slotTime), "EEEE, MMMM d 'at' HH:mm")}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Complete your booking before the timer runs out
              </p>
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 shrink-0">
            {formatTime(lockTTL)}
          </div>
        </div>
      )}

      {/* Step 3 — Confirm booking */}
      {selectedSlot && (
        <div className="mt-6 bg-card border border-primary/40 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold">Ready to confirm</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {branch.name} · {format(selectedSlot.time, "EEEE, MMMM d, yyyy")} at {format(selectedSlot.time, "HH:mm")}
              </p>
              {!lockInfo && (
                <p className="text-xs text-amber-600 mt-1">Waiting for slot to be reserved…</p>
              )}
            </div>
          </div>
          <Button
            onClick={() => bookingMutation.mutate()}
            loading={bookingMutation.isPending}
            disabled={!lockInfo}
            size="lg"
            className="w-full sm:w-auto shrink-0"
          >
            Confirm Booking
          </Button>
        </div>
      )}

    </div>
  );
}
