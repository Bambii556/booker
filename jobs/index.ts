import boss from "@/lib/pgboss";
import { cleanupOldAppointments } from "./cleanup-appointments";

export const QUEUES = {
  CLEANUP_APPOINTMENTS: "cleanup-appointments",
} as const;

export async function startJobs() {
  await boss.start();
  console.log("pgboss started");

  await boss.createQueue(QUEUES.CLEANUP_APPOINTMENTS, {
    retentionSeconds: 60 * 60 * 24,
  });
  console.log("queue created:", QUEUES.CLEANUP_APPOINTMENTS);

  await boss.schedule(QUEUES.CLEANUP_APPOINTMENTS, "*/5 * * * *");
  console.log("job scheduled:", QUEUES.CLEANUP_APPOINTMENTS);

  await boss.work(QUEUES.CLEANUP_APPOINTMENTS, async (jobs) => {
    console.log("processing job:", jobs[0]?.id);
    await cleanupOldAppointments();
  });
  console.log("worker registered, waiting for jobs...");
}

startJobs().catch((err) => {
  console.error("worker failed:", err);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("shutting down worker...");
  await boss.stop();
  process.exit(0);
});
