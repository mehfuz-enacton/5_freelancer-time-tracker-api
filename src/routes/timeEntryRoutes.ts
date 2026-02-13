import { Router } from "express";
import {
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeEntriesByProject,
  getTimeEntryById,
} from "../controllers/timeEntryController";
import { protect } from "../middlewares/authorizationMiddleware";
import { validateBody } from "../middlewares/validation";
import { createTimeEntrySchema, updateTimeEntrySchema } from "../validations/timeEntryValidation";

const router = Router();

router.use(protect);

router.get("/project/:projectId", getTimeEntriesByProject);
router.get("/:id", getTimeEntryById);
router.post("/", validateBody(createTimeEntrySchema), createTimeEntry);
router.patch("/:id", validateBody(updateTimeEntrySchema), updateTimeEntry);
router.delete("/:id", deleteTimeEntry);

export default router;
