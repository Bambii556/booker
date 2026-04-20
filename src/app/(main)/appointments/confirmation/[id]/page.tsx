"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2, Calendar, Clock, AlertTriangle } from "lucide-react";
import { ConfirmationCard } from "@/components/booking/confirmation-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
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

interface AlternativeSlot {
  time: Date;
  available: boolean;
  isBooking?: boolean;
}

async function fetchAlternativeSlots(
  branchId: string,
  date: string,
): Promise<AlternativeSlot[]> {
  const res = await fetch(`/api/branches/${branchId}/slots?date=${date}`);
  const data = await res.json();
  if (!res.ok) return [];
  return data.data.slots
    .filter((s: { available: boolean }) => s.available)
    .slice(0, 3)
    .map((s: { time: string }) => ({
      time: new Date(s.time),
      available: true,
    }));
}

async function bookAlternativeSlot(
  branchId: string,
  time: Date,
): Promise<{ id: string } | null> {
  const res = await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      branchId,
      scheduledAt: time.toISOString(),
    }),
  });
  const data = await res.json();
  if (!res.ok) return null;
  return data.data;
}

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alternativeSlots, setAlternativeSlots] = useState<AlternativeSlot[]>(
    [],
  );
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const appointmentId = params.id as string;

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/login");
    }
  }, [session, sessionPending, router]);

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`);
      const data = await res.json();

      if (data.success) {
        setAppointment({
          ...data.data,
          scheduledAt: new Date(data.data.scheduledAt),
        });
      } else {
        setError(data.message || "Failed to load appointment");
      }
    } catch {
      setError("Failed to load appointment");
    } finally {
      setLoading(false);
    }
  };

  const loadAlternativeSlots = async () => {
    if (!appointment?.branch?.id) return;
    setLoadingAlternatives(true);
    try {
      const dateStr = format(appointment.scheduledAt, "yyyy-MM-dd");
      const slots = await fetchAlternativeSlots(appointment.branch.id, dateStr);
      setAlternativeSlots(slots);
    } catch {
      setAlternativeSlots([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleBookAlternative = async (slot: AlternativeSlot) => {
    if (!appointment?.branch?.id) return;

    setAlternativeSlots((prev) =>
      prev.map((s) =>
        s.time.getTime() === slot.time.getTime()
          ? { ...s, isBooking: true }
          : s,
      ),
    );

    const result = await bookAlternativeSlot(appointment.branch.id, slot.time);

    if (result) {
      toast.success("Appointment booked!", {
        description: "Redirecting to confirmation...",
      });
      router.push(`/appointments/confirmation/${result.id}`);
    } else {
      toast.error("Failed to book. Please try another time.");
      setAlternativeSlots((prev) =>
        prev.map((s) =>
          s.time.getTime() === slot.time.getTime()
            ? { ...s, isBooking: false }
            : s,
        ),
      );
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Appointment cancelled");
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Failed to cancel appointment");
        setShowDeleteDialog(false);
      }
    } catch {
      toast.error("Failed to cancel appointment");
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAppointment();
    }
  }, [session]);

  if (sessionPending || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    const isSlotTaken =
      error?.includes("someone else") || error?.includes("just booked");
    const isArchived = error?.includes("expired");

    const title = isSlotTaken
      ? "Slot Already Booked"
      : isArchived
        ? "Appointment Expired"
        : "Something Went Wrong";

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">{title}</h1>
          <p className="text-muted-foreground600 dark:text-muted-foreground mb-6">
            {error || "The appointment you are looking for does not exist."}
          </p>

          {isSlotTaken && (
            <div className="mb-8">
              <p className="text-muted-foreground600 dark:text-muted-foreground mb-4">
                Here are some other available times for the same day:
              </p>
              {loadingAlternatives ? (
                <div className="flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : alternativeSlots.length > 0 ? (
                <div className="flex flex-wrap gap-3 justify-center">
                  {alternativeSlots.map((slot, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      onClick={() => handleBookAlternative(slot)}
                      disabled={slot.isBooking}
                      className="gap-2"
                    >
                      {slot.isBooking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      {format(slot.time, "HH:mm")}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground500 dark:text-muted-foreground">
                  No other times available today.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 bg-muted100 dark:bg-muted800 text-muted-foreground900 dark:text-muted-foreground100 rounded-lg hover:bg-muted200 dark:hover:bg-muted700"
            >
              View Your Appointments
            </a>
            <a
              href="/branches"
              className="inline-flex items-center justify-center px-4 py-2 bg-muted900 text-white rounded-lg hover:bg-muted800"
            >
              Book New Appointment
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Booking Confirmation</h1>
        <p className="text-muted-foreground600 dark:text-muted-foreground">
          Your appointment details are below
        </p>
      </div>

      <ConfirmationCard
        bookingReference={appointment.bookingReference}
        branchName={appointment.branch.name}
        branchAddress={appointment.branch.address}
        scheduledAt={appointment.scheduledAt}
        status={appointment.status}
        userEmail={session?.user?.email || ""}
        isProcessing={false}
      />

      {(appointment.status === "confirmed" || appointment.status === "pending") && (
        <div className="max-w-2xl mx-auto mt-6">
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            onClick={() => setShowDeleteDialog(true)}
          >
            Cancel Appointment
          </Button>
        </div>
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
              cannot be undone and the appointment will be removed from your
              list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleting}
            >
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
