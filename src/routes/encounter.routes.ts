import { Router } from "express";
import multer from "multer";
import { createEncounter } from "../controllers/encounters.controllers";
import { authMiddleware } from "../middleware/middleware";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max — Groq's Whisper limit
});

router.use(authMiddleware);

router.post("/", upload.single("audio"), createEncounter);
// router.get("/:personId", getEncountersByPerson);

export default router;