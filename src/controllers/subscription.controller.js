import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { channelId } = req.params;

  if (
    !userId ||
    !channelId ||
    !mongoose.Types.ObjectId.isValid(channelId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    throw new ApiError(400, "Invalid user or channel ID");
  }

  if (userId.toString() === channelId.toString()) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }

  //check if subscription already exists
  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    // If subscription exists, remove it (unsubscribe)
    await Subscription.deleteOne({ _id: existingSubscription._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Channel Unsubscribed successfully"));
  } else {
    // If subscription doesn't exist, create a new subscription
    const newSubscription = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    if (!newSubscription) {
      throw new ApiError(500, "Failed to subscribe the channel");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, newSubscription, "Channel Subscribed successfully")
      );
  }
});

//controller to return subscriber list of a channel
//Given a channelId, it returns all subscribers (users) for that channel.
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // aggreation pipeline to fetch subscribers with user details

  const subscribers = await Subscription.aggregate([
    //stage 1: match subscriptions for the given channelId
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    //stage 2: lookup to get subscriber details from User collection
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    //stage 3: unwind the subscriberDetails array to get individual user objects
    {
      $unwind: "$subscriberDetails",
    },
    //stage 4: project only necessary fields to return
    {
      $project: {
        _id: 1,
        userName: 1,
        fullName: 1,
        avatar: 1,
        subscriberSince: "$createdAt",
      },
    },
  ]);

  if (!subscribers || subscribers.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No subscribers found"));
  } else {
    return res
      .status(200)
      .json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
      );
  }
});

//controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // aggreation pipeline to fetch subscribed channels with channel details
  const channels = await Subscription.aggregate([
    //stage 1: match subscriptions for the given userId
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(userId),
      },
    },
    //stage 2: lookup to get channel details from User collection
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
      },
    },
    //stage 3: unwind the channelDetails array to get individual user objects
    {
      $unwind: "$channelDetails",
    },
    //stage 4: project only necessary fields to return
    {
      $project: {
        _id: 1,
        userName: 1,
        fullName: 1,
        avatar: 1,
        subscribedSince: "$createdAt",
      },
    },
  ]);

  if (!channels || channels.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No subscribed channels found"));
  } else {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channels,
          "Subscribed channels fetched successfully"
        )
      );
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
