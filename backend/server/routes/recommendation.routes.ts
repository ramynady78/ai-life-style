import { Router } from "express";
import { auth } from "../middleware/auth.middleware";
import {
  generatePlan,
  getActivePlan,
} from "../controllers/recommendation.controller";

const router = Router();

router.post("/generate-plan", auth, generatePlan);
router.get("/active", auth, getActivePlan);

export default router;
