import { Router } from "express";
import {
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeEntriesByProject,
  getTimeEntryById,
} from "../controllers/timeEntryController";
import { protect } from "../middlewares/authorizationMiddleware";
import { validateRequest } from "../middlewares/validation";
import { createTimeEntrySchema, updateTimeEntrySchema } from "../validations/timeEntryValidation";

const router = Router();

router.use(protect);

// Get time entries by project
router.get("/project/:projectId", getTimeEntriesByProject);

// Get single time entry by id
router.get("/:id", getTimeEntryById);

// Create time entry
router.post("/", validateRequest(createTimeEntrySchema), createTimeEntry);

// Update time entry
router.patch("/:id", validateRequest(updateTimeEntrySchema), updateTimeEntry);

// Delete time entry
router.delete("/:id", deleteTimeEntry);

export default router;
