import { completeAppointments } from "./complete-appointments";
import { cleanupOldAppointments } from "./cleanup-appointments";

export interface JobDefinition {
  name: string;
  label: string;
  schedule: string;
  run: () => Promise<number>;
}

export const JOB_DEFINITIONS: JobDefinition[] = [
  {
    name: "complete-appointments",
    label: "Complete Appointments",
    schedule: "*/5 * * * *",
    run: completeAppointments,
  },
  {
    name: "cleanup-appointments",
    label: "Cleanup Old Appointments",
    schedule: "0 0 * * *",
    run: cleanupOldAppointments,
  },
];

export function getJob(name: string): JobDefinition | undefined {
  return JOB_DEFINITIONS.find((j) => j.name === name);
}
