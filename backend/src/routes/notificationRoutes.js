import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import { listMyNotifications, markAllRead, markRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/me", requireAuth, listMyNotifications);
router.patch("/:id/read", requireAuth, markRead);
router.patch("/read-all", requireAuth, markAllRead);

export default router;
