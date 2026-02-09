import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
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
