import { Router } from "express";
import { listUsers, setUserRole, setUserStatus } from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/users", requireAuth, requireRole("admin"), listUsers);
router.patch("/users/:id/role", requireAuth, requireRole("admin"), setUserRole);
router.patch("/users/:id/status", requireAuth, requireRole("admin"), setUserStatus);

export default router;
