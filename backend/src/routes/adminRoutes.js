import { Router } from "express";
import { listUsers, setUserRole, setUserStatus, listCourses } from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/users", requireAuth, requireRole("admin"), listUsers);
router.patch("/users/:id/role", requireAuth, requireRole("admin"), setUserRole);
router.patch("/users/:id/status", requireAuth, requireRole("admin"), setUserStatus);

router.get("/courses", requireAuth, requireRole("admin"), listCourses);
export default router;
