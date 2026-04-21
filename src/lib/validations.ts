import { z } from 'zod';

export const BookAppointmentSchema = z.object({
  branchId: z.string().uuid('Invalid branch ID'),
  scheduledAt: z.string().datetime({ message: 'Invalid date format' }),
});

export const AppointmentIdSchema = z.object({
  id: z.string().uuid('Invalid appointment ID'),
});

export const BranchIdSchema = z.object({
  id: z.string().uuid('Invalid branch ID'),
});

export const SlotDateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export type ValidationInput<T extends z.ZodSchema> = {
  schema: T;
  data: unknown;
};

export function validateInput<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

export function safeValidateInput<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: { field: string; message: string }[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  
  return { success: false, errors };
}