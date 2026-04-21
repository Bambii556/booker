"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !appointment) {
    const title = error?.includes("someone else") || error?.includes("just booked")
      ? "Slot Already Booked"
      : error?.includes("expired")
        ? "Appointment Expired"
        : "Something Went Wrong";

    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl font-bold mb-3">{title}</p>
        <p className="text-muted-foreground mb-8">
          {error || "The appointment you are looking for does not exist."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>My Appointments</Button>
          <Button onClick={() => router.push("/branches")}>Book New Appointment</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

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
        <div className="mt-4">
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
