import { z } from "zod";
import {
  parseUserDateTime,
  dateTimeFormatRegex,
} from "../utils/dateTimeFormat";

export const createTimeEntrySchema = z
  .object({
    projectId: z.string().min(1, "Project ID is required"),
    startTime: z
      .string()
      .min(1, "Start time is required")
      .regex(
        dateTimeFormatRegex,
        "Invalid start time format. Use DD-MM-YYYY HH:MM AM/PM (e.g., 10-02-2026 1:19 PM)",
      ),
    endTime: z
      .string()
      .min(1, "End time is required")
      .regex(
        dateTimeFormatRegex,
        "Invalid end time format. Use DD-MM-YYYY HH:MM AM/PM (e.g., 10-02-2026 1:19 PM)",
      ),
    description: z
      .string()
      .min(1, "Description is required")
      .max(1000, "Description cannot exceed 1000 characters")
      .trim(),
  })
  .superRefine((data, ctx) => {
    // Parse dates in IST (UTC+5:30)
    const startDate = parseUserDateTime(data.startTime);
    const endDate = parseUserDateTime(data.endTime);

    if (!startDate || !endDate) {
      return;
    }

    // Validate endTime is after startTime
    if (endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["endTime"],
      });
    }
    // Validate endTime is within 5 minutes of current time (in UTC)
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
      .regex(
        dateTimeFormatRegex,
        "Invalid start time format. Use DD-MM-YYYY HH:MM AM/PM (e.g., 10-02-2026 1:19 PM)",
      )
      .optional(),
    endTime: z
      .string()
      .regex(
        dateTimeFormatRegex,
        "Invalid end time format. Use DD-MM-YYYY HH:MM AM/PM (e.g., 10-02-2026 1:19 PM)",
      )
      .optional(),
    description: z
      .string()
      .min(1, "Description is required")
      .max(1000, "Description cannot exceed 1000 characters")
      .trim()
      .optional(),
  })
  .superRefine((data, ctx) => {
    // If both startTime and endTime are provided, validate endTime is after startTime
    if (data.startTime || data.endTime) {
      const startDate = data.startTime
        ? parseUserDateTime(data.startTime)
        : null;
      const endDate = data.endTime ? parseUserDateTime(data.endTime) : null;

      if (endDate) {
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

      if (startDate && endDate) {
        if (endDate <= startDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End time must be after start time",
            path: ["endTime"],
          });
        }
      }
    }
  });

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
