import { Router } from "express";
import { getMe, updateMe, uploadAvatar } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";
import { uploadAvatar as uploadAvatarMiddleware, setUploadType } from "../middlewares/upload.js";

const router = Router();

// Get current user profile
router.get("/me", requireAuth, getMe);

// Update current user profile
router.patch("/me", requireAuth, updateMe);

// Upload avatar
router.post("/me/avatar", requireAuth, setUploadType("avatars"), uploadAvatarMiddleware.single("avatar"), uploadAvatar);

export default router;
