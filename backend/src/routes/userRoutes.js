import { Router } from "express";
import { updateMe } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.patch("/me", requireAuth, updateMe);

export default router;
