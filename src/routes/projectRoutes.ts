import { Router } from "express";
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import { protect } from "../middlewares/authorizationMiddleware";
import { validateBody } from "../middlewares/validation";
import { createProjectSchema, updateProjectSchema } from "../validations/projectValidation";

const router = Router();

router.use(protect);

router.get("/", getAllProjects);
router.get("/:id", getProjectById);
router.post("/", validateBody(createProjectSchema), createProject);
router.patch("/:id", validateBody(updateProjectSchema), updateProject);
router.delete("/:id", deleteProject);

export default router;
