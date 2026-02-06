import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      const errorMessages = error.errors?.map((err: any) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return res.status(400).json({
        msg: "Validation error",
        errors: errorMessages,
      });
    }
  };
};
