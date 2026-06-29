import { Router } from "express";
import { matchFace, getPersonById, getAllPeople } from "../controllers/people.controllers";
import { authMiddleware } from "../middleware/middleware"; 

const router = Router();

router.use(authMiddleware);

router.post("/match", matchFace);
router.get("/", getAllPeople);
router.get("/:id", getPersonById);

export default router;