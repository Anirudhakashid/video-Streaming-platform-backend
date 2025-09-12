import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  getChannelVideos,
  getChannelStats,
} from "../controllers/dashboard.controller.js";

const router = Router();

// All routes defined here will be protected and will require a valid JWT token
router.use(verifyJWT);

router.route("/stats/:userId").get(getChannelStats);
router.route("/channel-videos/:userId").get(getChannelVideos);

export default router;
