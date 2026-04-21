"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { ConfirmationCard } from "@/components/booking/confirmation-card";
import { CancelAppointmentDialog } from "@/components/booking/cancel-appointment-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Appointment {
  id: string;
  bookingReference: string;
  scheduledAt: Date;
  updatedAt: Date | null;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "archived";
  branch: {
    id: string;
    name: string;
    address: string;
  };
}


export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const appointmentId = params.appointmentId as string;

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
          updatedAt: data.data.updatedAt ? new Date(data.data.updatedAt) : null,
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
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

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

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
        updatedAt={appointment.updatedAt}
        status={appointment.status}
        userEmail={session?.user?.email || ""}
        isProcessing={false}
      />

      {appointment.status === "confirmed" && (
        <div className="max-w-2xl mx-auto mt-6">
          <Button
            variant="destructive-outline"
            className="w-full"
            onClick={() => setShowDeleteDialog(true)}
          >
            Cancel Appointment
          </Button>
        </div>
      )}

      <CancelAppointmentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        bookingReference={appointment?.bookingReference}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
