import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Playlist } from "../models/playlists.model.js";

// Create a new playlist
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user?._id;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError("Invalid user ID", 400);
  }

  if (!name || name.trim() === "") {
    throw new ApiError("Playlist name is required", 400);
  }

  const newPlaylist = await Playlist.create({
    name: name.trim(),
    description: description ? description.trim() : "",
    owner: userId,
    videos: [],
  });

  if (!newPlaylist) {
    throw new ApiError("Failed to create playlist", 500);
  }

  return res
    .status(200)
    .json(new ApiResponse(201, newPlaylist, "Playlist created successfully"));
});

export { createPlaylist };
