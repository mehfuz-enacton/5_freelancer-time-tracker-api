import { Router } from "express";
import {
  getProjectsSummary,
  getSummaryOverview,
  exportProjectsSummaryPDF,
  exportOverviewSummaryPDF,
} from "../controllers/summaryController";
import { protect } from "../middlewares/authorizationMiddleware";
import { validateQuery } from "../middlewares/validation";
import { summaryQuerySchema } from "../validations/summaryValidation";

const router = Router();

router.use(protect);

router.get("/projects", validateQuery(summaryQuerySchema), getProjectsSummary);
router.get("/overview", validateQuery(summaryQuerySchema), getSummaryOverview);
router.get("/projects/export/pdf", validateQuery(summaryQuerySchema), exportProjectsSummaryPDF);
router.get("/overview/export/pdf", validateQuery(summaryQuerySchema), exportOverviewSummaryPDF);

export default router;
