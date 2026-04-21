import { db } from "../src/lib/db";
import { jobRuns } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { JobDefinition } from "./config";

export async function runJob(
  job: JobDefinition,
  triggeredBy: "scheduled" | "manual" = "scheduled",
): Promise<void> {
  const startedAt = new Date();

  const [run] = await db
    .insert(jobRuns)
    .values({
      jobName: job.name,
      status: "running",
      triggeredBy,
      startedAt,
    })
    .returning({ id: jobRuns.id });

  try {
    const affectedRows = await job.run();
    const finishedAt = new Date();

    await db
      .update(jobRuns)
      .set({
        status: "success",
        affectedRows,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        finishedAt,
      })
      .where(eq(jobRuns.id, run.id));

    console.log(`[${job.name}] completed in ${finishedAt.getTime() - startedAt.getTime()}ms, ${affectedRows} row(s) affected`);
  } catch (err) {
    const finishedAt = new Date();
    const error = err instanceof Error ? err.message : String(err);

    await db
      .update(jobRuns)
      .set({
        status: "failed",
        error,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        finishedAt,
      })
      .where(eq(jobRuns.id, run.id));

    console.error(`[${job.name}] failed:`, error);
    throw err;
  }
}
