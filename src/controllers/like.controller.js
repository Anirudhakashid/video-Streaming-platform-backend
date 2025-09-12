import { asyncHandler } from "../utils/asyncHandler";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

//toggle like for a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Unauthorized access");
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  //check if like already exists
  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });
  if (existingLike) {
    // If like exists, remove it
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Video unliked successfully"));
  } else {
    // If like doesn't exist, create a new like
    const newLike = await Like.create({ video: videoId, likedBy: userId });
    if (!newLike) {
      throw new ApiError(500, "Failed to like the video");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, newLike, "Video liked successfully"));
  }
});

//toggle like for a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Unauthorized access");
  }
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  //check if like already exists
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (existingLike) {
    // If like exists, remove it
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Comment unliked successfully"));
  } else {
    // if like doesn't exist, create a new like
    const newLike = await Like.create({ comment: commentId, likedBy: userId });
    if (!newLike) {
      throw new ApiError(500, "Failed to like the comment");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, newLike, "Comment liked successfully"));
  }
});

//toggle like for a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Unauthorized access");
  }
  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  //check if like already exists
  const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });
  if (existingLike) {
    // If like exists, remove it
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Tweet unliked successfully"));
  } else {
    // if like doesn't exist, create a new like
    const newLike = await Like.create({ tweet: tweetId, likedBy: userId });
    if (!newLike) {
      throw new ApiError(500, "Failed to like the tweet");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, newLike, "Tweet liked successfully"));
  }
});

//get all liked videos for a user
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Unauthorized access");
  }

  const videos = Like.aggregate([
    // stage:1 match likedBy with current user and video not null
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId), // matches likes by the user
        video: { $ne: null }, // returns only likes that are for videos
      },
    },
    // stage:2 lookup to get video details
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    //stage:3 unwind videoDetails array to object
    {
      $unwind: "$videoDetails",
    },
    // stage:4 replace root to get videoDetails as root
    // $replaceRoot makes the output just the video object, so your result array contains only video documents.
    {
      $replaceRoot: { newRoot: "$videoDetails" },
    },
  ]);

  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No liked videos found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, videos, "Liked videos fetched successfully"));
});

export { getLikedVideos, toggleVideoLike, toggleCommentLike, toggleTweetLike };
