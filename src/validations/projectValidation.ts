import { z } from "zod";

export const createProjectSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters").trim(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    isBillable: z.boolean().optional().default(false),
    hourlyRate: z.number().min(1, "Hourly rate must be at least 1").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isBillable) {
      if (typeof data.hourlyRate !== "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hourly rate is required when project is billable",
          path: ["hourlyRate"],
        });
      }
    } else {
      if (data.hourlyRate !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hourly rate is not allowed when project is not billable",
          path: ["hourlyRate"],
        });
      }
    }
  });

export const updateProjectSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters").trim().optional(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    isBillable: z.boolean().optional(),
    hourlyRate: z.number().min(1, "Hourly rate must be at least 1").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isBillable === true) {
      if (typeof data.hourlyRate !== "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hourly rate is required when setting project as billable",
          path: ["hourlyRate"],
        });
      }
    } else if (data.isBillable === false) {
      if (data.hourlyRate !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hourly rate is not allowed when setting project as non-billable",
          path: ["hourlyRate"],
        });
      }
    }
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;