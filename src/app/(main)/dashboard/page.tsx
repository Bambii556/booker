"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  CalendarPlus, Clock, MapPin, Loader2,
  Trash2, CheckCircle2, XCircle, Check, Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CancelAppointmentDialog } from "@/components/booking/cancel-appointment-dialog";
import { toast } from "sonner";

interface ActiveLock {
  locked: boolean;
  branchId?: string;
  branchName?: string;
  branchAddress?: string;
  slotTime?: string;
  ttl?: number;
}

async function fetchMyLock(): Promise<{ success: boolean; data: ActiveLock }> {
  const res = await fetch("/api/locks/mine");
  if (!res.ok) return { success: false, data: { locked: false } };
  return res.json();
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface Appointment {
  id: string;
  bookingReference: string;
  scheduledAt: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "archived";
  branch: {
    id: string;
    name: string;
    address: string;
  };
}

async function fetchAppointments(): Promise<{ success: boolean; data: Appointment[] }> {
  const res = await fetch("/api/appointments");
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch appointments");
  return {
    ...data,
    data: data.data.map((apt: Appointment) => ({
      ...apt,
      scheduledAt: new Date(apt.scheduledAt),
    })),
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [lockTTL, setLockTTL] = useState<number>(0);
  const lockExpiresAtRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!sessionPending && !session) router.push("/login");
  }, [session, sessionPending, router]);

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
    enabled: !!session,
    staleTime: 0,
  });

  const { data: myLockData } = useQuery({
    queryKey: ["my-lock"],
    queryFn: fetchMyLock,
    enabled: !!session,
    refetchInterval: 15000,
  });

  const activeLock = myLockData?.data?.locked ? myLockData.data : null;

  // Countdown for the active lock
  useEffect(() => {
    if (activeLock?.ttl && activeLock.ttl > 0) {
      lockExpiresAtRef.current = new Date(Date.now() + activeLock.ttl * 1000);
      setLockTTL(activeLock.ttl);
    }
  }, [activeLock?.ttl]);

  useEffect(() => {
    if (!lockExpiresAtRef.current) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((lockExpiresAtRef.current!.getTime() - Date.now()) / 1000),
      );
      setLockTTL(remaining);
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lockExpiresAtRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (appointmentsData?.data) setAppointments(appointmentsData.data);
  }, [appointmentsData]);

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    setCancellingId(appointmentToDelete);
    setShowDeleteDialog(false);
    try {
      const res = await fetch(`/api/appointments/${appointmentToDelete}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Appointment cancelled");
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentToDelete ? { ...apt, status: "cancelled" as const } : apt,
          ),
        );
      } else {
        toast.error(data.message || "Failed to cancel appointment");
      }
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
      setAppointmentToDelete(null);
    }
  };

  if (sessionPending || isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 w-56 bg-muted rounded-xl animate-pulse" />
        <div className="h-4 w-32 bg-muted rounded-xl animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) return null;

  const now = new Date();
  const greeting = now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening";
  const firstName = session.user?.name?.split(" ")[0] || "there";

  const upcomingAppointments = [...appointments]
    .filter((apt) => apt.status === "confirmed" && isAfter(new Date(apt.scheduledAt), now))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const pastAppointments = [...appointments]
    .filter((apt) =>
      apt.status === "cancelled" ||
      apt.status === "completed" ||
      (apt.status === "confirmed" && !isAfter(new Date(apt.scheduledAt), now)),
    )
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good {greeting}, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {upcomingAppointments.length === 0
              ? "No upcoming appointments"
              : `${upcomingAppointments.length} upcoming appointment${upcomingAppointments.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => router.push("/branches")} className="gap-2 shrink-0">
          <CalendarPlus className="h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      {/* In-progress reservation banner */}
      {activeLock && activeLock.slotTime && lockTTL > 0 && (
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
                {format(toZonedTime(parseISO(activeLock.slotTime), "Africa/Johannesburg"), "EEEE, MMMM d 'at' HH:mm")}
                {" · "}
                {formatTime(lockTTL)} remaining
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => {
              const slotDate = parseISO(activeLock.slotTime!);
              const dateStr = format(slotDate, "yyyy-MM-dd");
              router.push(
                `/branches/appointments/${activeLock.branchId}?date=${dateStr}&slot=${encodeURIComponent(activeLock.slotTime!)}`,
              );
            }}
          >
            Continue Booking
          </Button>
        </div>
      )}

      {/* Empty state */}
      {appointments.length === 0 && (
        <div className="border border-dashed border-border rounded-2xl flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarPlus className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg">No appointments yet</p>
            <p className="text-muted-foreground text-sm mt-1">Find a branch and book your first appointment</p>
          </div>
          <Button onClick={() => router.push("/branches")}>Browse Branches</Button>
        </div>
      )}

      {/* Upcoming */}
      {upcomingAppointments.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Upcoming</span>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {upcomingAppointments.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onCancel={() => { setAppointmentToDelete(apt.id); setShowDeleteDialog(true); }}
                isCancelling={cancellingId === apt.id}
                onView={() => router.push(`/appointments/${apt.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past & cancelled */}
      {pastAppointments.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Past & Cancelled</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onCancel={() => {}}
                isCancelling={false}
                onView={() => router.push(`/appointments/${apt.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      <CancelAppointmentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        bookingReference={appointments.find((a) => a.id === appointmentToDelete)?.bookingReference}
        loading={!!cancellingId}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function AppointmentCard({
  appointment,
  onCancel,
  isCancelling,
  onView,
}: {
  appointment: Appointment;
  onCancel: () => void;
  isCancelling: boolean;
  onView: () => void;
}) {
  const zonedTime = toZonedTime(new Date(appointment.scheduledAt), "Africa/Johannesburg");
  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";
  const isPast = !isCancelled && !isCompleted && !isAfter(new Date(appointment.scheduledAt), new Date());
  const canCancel = !isCancelled && !isCompleted && !isPast;

  const STATUS = {
    confirmed: { label: "Confirmed", icon: <CheckCircle2 className="h-3.5 w-3.5" />, pill: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    completed: { label: "Completed", icon: <Check className="h-3.5 w-3.5" />, pill: "bg-muted text-muted-foreground" },
    cancelled: { label: "Cancelled", icon: <XCircle className="h-3.5 w-3.5" />, pill: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    pending:   { label: "Pending",   icon: <Clock className="h-3.5 w-3.5" />,  pill: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    archived:  { label: "Archived",  icon: <XCircle className="h-3.5 w-3.5" />, pill: "bg-muted text-muted-foreground" },
  };
  const s = STATUS[appointment.status] ?? STATUS.pending;

  return (
    <div className={`group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-col ${isPast || isCancelled || isCompleted ? "opacity-70" : ""}`}>
      {/* Top accent */}
      <div className={`h-1 w-full ${appointment.status === "confirmed" ? "bg-gradient-to-r from-primary/40 via-primary to-primary/40" : "bg-border"}`} />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Date + status + cancel */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex flex-col items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase leading-none">
                {format(zonedTime, "MMM")}
              </span>
              <span className="text-xl font-extrabold leading-tight">
                {format(zonedTime, "d")}
              </span>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.pill}`}>
              {s.icon}{s.label}
            </span>
          </div>

          {canCancel && (
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:ring-1 hover:ring-red-200 dark:hover:ring-red-800 transition-all"
              title="Cancel appointment"
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Branch info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="font-bold truncate">{appointment.branch.name}</p>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/50" />
            <span className="leading-snug line-clamp-2">{appointment.branch.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary/50" />
            <span>{format(zonedTime, "EEE, MMM d 'at' HH:mm")}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-muted-foreground truncate">{appointment.bookingReference}</span>
          <button
            onClick={onView}
            className="text-xs font-semibold text-primary hover:underline shrink-0"
          >
            View →
          </button>
        </div>
      </div>
    </div>
  );
}
