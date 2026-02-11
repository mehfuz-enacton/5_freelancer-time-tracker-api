import { z } from "zod";

export const createTimeEntrySchema = z
  .object({
    projectId: z.string().min(1, "Project ID is required"),
    startTime: z
      .string()
      .min(1, "Start time is required")
      .datetime("Invalid start time format"),
    endTime: z.string().datetime("Invalid end time format"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(1000, "Description cannot exceed 1000 characters")
      .trim(),
  })
  .superRefine((data, ctx) => {
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);

    // Validate endTime is after startTime
    if (endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["endTime"],
      });
    }

    // Validate endTime is within 5 minutes of current time
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (endDate > fiveMinutesFromNow) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time cannot be more than 5 minutes in the future",
        path: ["endTime"],
      });
    }
  });

export const updateTimeEntrySchema = z
  .object({
    projectId: z.string().min(1, "Project ID is required").optional(),
    startTime: z
      .string()
      .min(1, "Start time is required")
      .datetime("Invalid start time format")
      .optional(),
    endTime: z.string().datetime("Invalid end time format").optional(),
    description: z
      .string()
      .min(1, "Description is required")
      .max(1000, "Description cannot exceed 1000 characters")
      .trim()
      .optional(),
  })
  .superRefine((data, ctx) => {
    // If both startTime and endTime are provided, validate endTime is after startTime
    if (data.startTime && data.endTime) {
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);

      if (endDate <= startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time must be after start time",
          path: ["endTime"],
        });
      }

      // Validate endTime is within 5 minutes of current time
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (endDate > fiveMinutesFromNow) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time cannot be more than 5 minutes in the future",
          path: ["endTime"],
        });
      }
    }
  });

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
