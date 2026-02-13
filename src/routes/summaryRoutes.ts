import { Router } from "express";
import { getProjectsSummary, getSummaryOverview } from "../controllers/summaryController";
import { protect } from "../middlewares/authorizationMiddleware";
import { validateQuery } from "../middlewares/validation";
import { summaryQuerySchema } from "../validations/summaryValidation";

const router = Router();

router.use(protect);

router.get("/projects", validateQuery(summaryQuerySchema), getProjectsSummary);
router.get("/overview", validateQuery(summaryQuerySchema), getSummaryOverview);

export default router;
