import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { response } from "express";

//get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Pagination: only 10 comments per page
  const { page = 1, limit = 10 } = req.query;

  // mongoose.Types.ObjectId.isValid(videoId) to check if the videoId is a valid ObjectId
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const pipeline = [
    // stage:1 match videoId
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    // stage:2 lookup to get comment owner details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    // stage:3 lookup to get likes on the comment
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    // stage:4 add fields to get liked user ids
    {
      $addFields: {
        likedUserIds: {
          $map: {
            input: "$likes",
            as: "like",
            in: "$$like.likedBy",
          },
        },
      },
    },
    // stage:5 add fields to check if the current user has liked the comment
    {
      $addFields: {
        isLikedByCurrentUser: {
          $in: [new mongoose.Types.ObjectId(req.user._id), "$likedUserIds"],
        },
        likeCount: { $size: "$likes" },
      },
    },
    // stage:6 add the createdBy field from array to object
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    // stage:7 project to only required fields
    {
      $project: {
        content: 1,
        createdAt: 1,
        createdBy: 1,
        likeCount: 1,
        isLikedByCurrentUser: 1,
      },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    pagination: true,
  };

  const result = await Comment.aggregatePaginate(pipeline, options);

  //* For debugging
  console.log(result);

  if (!result || result.docs.length === 0) {
    throw new ApiError(404, "No comments found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalDocs: result.totalDocs, // total number of comments
        count: result.docs?.length, // number of comments in the current page
        comments: result.docs, // comments in the current page
        totalPages: result.totalPages, // total number of pages
        currentPage: result.page, // current page number
        hasNextPage: result.hasNextPage, // is there a next page
        hasPrevPage: result.hasPrevPage,
        nextPage: result.nextPage, // next page number
        prevPage: result.prevPage, // previous page number
        paginigCounter: result.pagingCounter, // starting serial number of comments in the current page
      },
      "Video comments fetched successfully",
      result
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  // validate videoId and content
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const videoExists = await Video.findById(videoId);
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  if (!content || content?.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to create comment");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  // validate commentId and content
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  if (!content || content?.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Login to update comment");
  }

  // find the comment by id and owner and update it in a single db call
  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: userId,
    },
    {
      content: content.trim(),
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(
      404,
      "Comment not found or you are not authorized to update it"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Login to delete comment");
  }

  //only delete if the comment belongs to the user
  const deletedComment = await Comment.findByIdAndDelete({
    _id: commentId,
    owner: userId,
  });

  if (!deletedComment) {
    throw new ApiError(
      404,
      "Comment not found or you are not authorized to delete this comment"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
