import { z } from "zod";
import { dateRangeFormatRegex } from "../utils/dateTimeFormat";

export const summaryQuerySchema = z.object({
  from: z
    .string()
    .regex(dateRangeFormatRegex, "Invalid 'from' date format. Use DD-MM-YYYY")
    .optional(),
  to: z
    .string()
    .regex(dateRangeFormatRegex, "Invalid 'to' date format. Use DD-MM-YYYY")
    .optional(),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
