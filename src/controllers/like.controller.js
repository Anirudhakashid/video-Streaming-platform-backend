import { asyncHandler } from "../utils/asyncHandler";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

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

export { getLikedVideos };
