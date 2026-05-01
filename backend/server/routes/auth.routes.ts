import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
  logout,
  updateCurrentUser,
  changePassword,
  deleteCurrentUser,
} from "../controllers/auth.controller";
import { auth } from "../middleware/auth.middleware";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", auth, getCurrentUser);
router.put("/me", auth, updateCurrentUser);
router.post("/change-password", auth, changePassword);
router.delete("/me", auth, deleteCurrentUser);

export default router;
