import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller";

const router = Router();

router.use(verifyJWT);

// Toggle subscription for a channel
router.route("/toggleSubscription/:channelId").post(toggleSubscription);

// Get all subscribers for a channel
router.route("/getSubscriptions/:channelId").get(getUserChannelSubscribers);

// get channels the user has subscribed to
router.route("/subscribedChannels").get(getSubscribedChannels);

export default router;
