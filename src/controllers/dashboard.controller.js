import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscription.model.js";

// Controller to get channel statistics
// like total views, total subscribers, total videos, etc.
const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "unauthorized access");
  }

  //total videos uploaded by the user
  const totalVideos = await Video.countDocuments({ owner: userId });

  //total views on all videos uploaded by the user
  const viewsAggregation = await Video.aggregate([
    //stage 1: match videos by owner
    {
      $match: { owner: new mongoose.Types.ObjectId(userId), isPublished: true },
    },
    //stage 2: group and sum views
    {
      $group: {
        _id: null,
        totalViews: { $sum: { $ifNull: ["$views", 0] } }, // if views is null, consider it as 0
      },
    },
  ]);
  // if no videos found, totalViews will be 0
  const totalViews = viewsAggregation[0]?.totalViews || 0;

  //total subscribers to the user's channel
  //to count a user's (channels) subscribers we count the number of documents where that channel is present in our subscriptions collection
  const totalSubscribers = await Subscription.countDocuments({
    channel: mongoose.Types.ObjectId(userId),
  });

  //total channels the user is subscribed to
  const totalSubscriptions = await Subscription.countDocuments({
    subscriber: mongoose.Types.ObjectId(userId),
  });

  //total likes received on all videos uploaded by the user
  const likesAggregation = await Like.aggregate([
    //stage1: lookup to join each like document with its corresponding video document
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    //stage2: unwind the videoDetails array to deconstruct it
    {
      $unwind: "$videoDetails",
    },
    //stage3: match only those likes where the video's owner is the current user
    {
      $match: {
        "videoDetails.owner": new mongoose.Types.ObjectId(userId),
        "videoDetails.isPublished": true, // consider only published videos
      },
    },
    //stage4: count total likes
    {
      $count: "totalLikes",
    },
  ]);

  // if no likes found, totalLikes will be 0
  const totalLikes =
    likesAggregation.length > 0 ? likesAggregation[0].totalLikes : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos,
        totalViews,
        totalSubscribers,
        totalSubscriptions,
        totalLikes,
      },
      "Channel statistics fetched successfully"
    )
  );
});

export { getChannelStats };
