import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller";

const router = Router();

// Middleware to verify JWT for all routes in this router
router.use(verifyJWT);

router.route("/toggleLike/v/:videoId").post(toggleVideoLike);
router.route("/toggleLike/c/:commentId").post(toggleCommentLike);
router.route("/toggleLike/t/:tweetId").post(toggleTweetLike);
router.route("/Liked/videos").get(getLikedVideos);

export default router;
