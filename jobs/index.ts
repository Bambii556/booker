import boss from "../src/lib/pgboss";
import { JOB_DEFINITIONS } from "./config";
import { runJob } from "./runner";

async function setupJob(job: typeof JOB_DEFINITIONS[number]) {
  await boss.createQueue(job.name, {
    retentionSeconds: 60 * 60 * 24,
  });

  await boss.schedule(job.name, job.schedule);

  await boss.work(job.name, async (jobs) => {
    console.log(`[${job.name}] processing job:`, jobs[0]?.id);
    await runJob(job, "scheduled");
  });

  console.log(`[${job.name}] registered — ${job.schedule}`);
}

async function startJobs() {
  await boss.start();
  console.log("[pgboss] started");

  for (const job of JOB_DEFINITIONS) {
    await setupJob(job);
  }

  console.log("[pgboss] all jobs registered, waiting for work...");
}

startJobs().catch((err) => {
  console.error("[pgboss] worker failed:", err);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("[pgboss] shutting down...");
  await boss.stop();
  process.exit(0);
});
