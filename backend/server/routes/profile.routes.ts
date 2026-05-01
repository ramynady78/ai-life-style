import { Router } from "express";

import { createProfile, getMyProfile, updateMyProfile } from "../controllers/profile.controller";
import { auth } from "../middleware/auth.middleware";

const router = Router();

router.post("/create", auth, createProfile);
router.get("/me", auth, getMyProfile);
router.put("/update", auth, updateMyProfile);

export default router;