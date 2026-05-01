import { Router } from "express";
import { auth } from "../middleware/auth.middleware";
import { getTodayNutrition } from "../controllers/nutrition.controller";

const router = Router();

router.get("/today", auth, getTodayNutrition);

export default router;
