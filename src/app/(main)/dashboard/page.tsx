"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  CalendarPlus,
  Clock,
  MapPin,
  AlertTriangle,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Appointment {
  id: string;
  bookingReference: string;
  scheduledAt: Date;
  status: "pending" | "confirmed" | "cancelled" | "archived";
  branch: {
    id: string;
    name: string;
    address: string;
  };
}

interface AppointmentsResponse {
  success: boolean;
  data: Appointment[];
}

async function fetchAppointments(): Promise<AppointmentsResponse> {
  const res = await fetch("/api/appointments");
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch appointments");
  }
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
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(
    null,
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/login");
    }
  }, [session, sessionPending, router]);

  const {
    data: appointmentsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
    enabled: !!session,
  });

  useEffect(() => {
    if (appointmentsData?.data) {
      setAppointments(appointmentsData.data);
    }
  }, [appointmentsData]);

  const handleCancelClick = (id: string) => {
    setAppointmentToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    setCancellingId(appointmentToDelete);
    setShowDeleteDialog(false);

    try {
      const res = await fetch(`/api/appointments/${appointmentToDelete}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Appointment cancelled");
        setAppointments((prev) =>
          prev.filter((apt) => apt.id !== appointmentToDelete),
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
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-64 bg-muted200 dark:bg-muted800 rounded" />
          <div className="h-4 w-32 bg-muted200 dark:bg-muted800 rounded" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "morning"
      : now.getHours() < 18
        ? "afternoon"
        : "evening";

  const upcomingAppointments = [...appointments]
    .filter(
      (apt) =>
        (apt.status === "confirmed" || apt.status === "pending") &&
        isAfter(new Date(apt.scheduledAt), now),
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

  const pastAppointments = [...appointments]
    .filter(
      (apt) =>
        apt.status === "cancelled" || !isAfter(new Date(apt.scheduledAt), now),
    )
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Good {greeting}, {session.user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {upcomingAppointments.length === 0
              ? "No upcoming appointments"
              : `${upcomingAppointments.length} upcoming`}
          </p>
        </div>
        <Button
          onClick={() => router.push("/branches")}
          className="sm:order-last"
        >
          Book Appointment
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted100 dark:bg-muted800 flex items-center justify-center mb-4">
              <CalendarPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground600 dark:text-muted-foreground mb-4">
              No appointments yet
            </p>
            <Button onClick={() => router.push("/branches")}>
              Book an Appointment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcomingAppointments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Upcoming Appointments
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {upcomingAppointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onCancel={() => handleCancelClick(apt.id)}
                    isCancelling={cancellingId === apt.id}
                    onView={() =>
                      router.push(`/appointments/confirmation/${apt.id}`)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Past & Cancelled
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pastAppointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onCancel={() => {}}
                    isCancelling={false}
                    onView={() =>
                      router.push(`/appointments/confirmation/${apt.id}`)
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Appointment?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={!!cancellingId}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              loading={!!cancellingId}
            >
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const zonedTime = toZonedTime(
    new Date(appointment.scheduledAt),
    "Africa/Johannesburg",
  );
  const isCancelled = appointment.status === "cancelled";
  const isPending = appointment.status === "pending";
  const isPast =
    !isCancelled && !isAfter(new Date(appointment.scheduledAt), new Date());

  const statusColor = isCancelled
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    : isPending
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

  return (
    <Card className={`group relative ${isPast ? "opacity-60" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-muted100 dark:bg-muted800 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {format(zonedTime, "MMM")}
              </span>
              <span className="text-xl font-bold">
                {format(zonedTime, "d")}
              </span>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
              >
                {isCancelled
                  ? "Cancelled"
                  : isPending
                    ? "Pending"
                    : "Confirmed"}
              </span>
            </div>
          </div>
          {!isCancelled && !isPast && (
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer"
              title="Cancel appointment"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <h3 className="font-semibold text-lg mb-2">
          {appointment.branch.name}
        </h3>

        <div className="space-y-2 text-sm text-muted-foreground600 dark:text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.branch.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(zonedTime, "EEEE, MMMM d, yyyy 'at' HH:mm")}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-muted100 dark:border-muted800 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {appointment.bookingReference}
          </span>
          <Button variant="ghost" size="sm" onClick={onView} className="-mr-2">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
