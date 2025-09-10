import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller";

const router = Router();

// Middleware to verify JWT for all routes in this router
router.use(verifyJWT);

router.route("/getVideoComments/:videoId").get(getVideoComments);
router.route("/addComment/:videoId").post(addComment);
router.route("/updateComment/:commentId").put(updateComment);
router.route("/deleteComment/:commentId").delete(deleteComment);

export default router;
