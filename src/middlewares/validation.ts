import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";

type ValidationSource = "body" | "query" | "params";

export const validate = (schema: ZodSchema, source: ValidationSource = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];
      const validatedData = schema.parse(dataToValidate);
      
      // Only reassign if it's body (query and params are read-only)
      if (source === "body") {
        req.body = validatedData;
      }
      
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: ZodIssue) => ({
          field: issue.path.length > 0 ? issue.path.join(".") : "unknown",
          message: issue.message,
          code: issue.code,
        }));
        return res.status(400).json({
          msg: "Validation failed",
          success: false,
          errors: errorMessages,
        });
      }

      // Fallback for other errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return res.status(400).json({
        msg: "Validation error",
        success: false,
        error: errorMessage,
      });
    }
  };
};

// Convenience wrappers for better readability
export const validateBody = (schema: ZodSchema) => validate(schema, "body");
export const validateQuery = (schema: ZodSchema) => validate(schema, "query");
export const validateParams = (schema: ZodSchema) => validate(schema, "params");