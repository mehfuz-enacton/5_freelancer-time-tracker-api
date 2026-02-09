import { z } from "zod";

export const createProjectSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters").trim(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    isBillable: z.boolean().optional().default(false),
    hourlyRate: z.number().min(1, "Hourly rate must be at least 1").optional(),
  })
  .refine((data) => !data.isBillable || typeof data.hourlyRate === "number", {
    message: "Hourly rate is required when project is billable",
    path: ["hourlyRate"],
  });

export const updateProjectSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters").trim().optional(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    isBillable: z.boolean().optional(),
    hourlyRate: z.number().min(1, "Hourly rate must be at least 1").optional(),
  })
  .refine((data) => !data.isBillable || typeof data.hourlyRate === "number", {
    message: "Hourly rate is required when project is billable",
    path: ["hourlyRate"],
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
