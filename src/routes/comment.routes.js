import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { getVideoComments } from "../controllers/comment.controller";

const router = Router();

// Middleware to verify JWT for all routes in this router
router.use(verifyJWT);

export default router;
