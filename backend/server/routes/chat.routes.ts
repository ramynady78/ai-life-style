import { Router } from "express";
import { auth } from "../middleware/auth.middleware";
import {
  clearChatMessages,
  listChatMessages,
  sendChatMessage,
} from "../controllers/chat.controller";

const router = Router();

router.get("/messages", auth, listChatMessages);
router.post("/messages", auth, sendChatMessage);
router.delete("/messages", auth, clearChatMessages);

export default router;
