import express from "express";
import { chat } from "../controllers/chat.controllers";
import { authMiddleware } from "../middleware/middleware";

const router = express.Router();

router.use(authMiddleware);
router.post("/", chat);

export default router;