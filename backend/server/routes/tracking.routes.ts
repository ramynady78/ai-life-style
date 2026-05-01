import { Router } from "express";
import { auth } from "../middleware/auth.middleware";
import {
  createAdherenceLog,
  createMeasurement,
  listAdherenceLogs,
  listMeasurements,
} from "../controllers/tracking.controller";

const router = Router();

router.get("/measurements", auth, listMeasurements);
router.get("/adherence", auth, listAdherenceLogs);
router.post("/measurements", auth, createMeasurement);
router.post("/adherence", auth, createAdherenceLog);

export default router;
