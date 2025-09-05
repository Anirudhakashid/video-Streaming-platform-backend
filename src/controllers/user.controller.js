import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //store refresh token in db
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating access and refresh tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //TODO: registerUser
  // get user details from frontend
  // validation-[not empty]
  // check if user already exits - using email and username
  // check for images and avatar
  // if present upload them to cloudinary, avatar specially
  // create user object - create entry in DB
  // remove password and refresh token from the response
  // check for used creation
  // return response

  const { userName, email, fullName, password } = req.body;
  // console.log("Email: ", email);

  //Validating the fields
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!!");
  }

  //checking if the user already exists
  const existingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existingUser) {
    throw new ApiError(409, "username or email already exists");
  }

  //check for images and avatar in req
  // console.log("request.files :", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;

  //* gives undefined error:
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length() > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is required");
  }

  //upload the images to cloudinary
  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  //again check for avatar
  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }

  //create entry in DB
  const user = await User.create({
    userName: userName.toLowerCase(),
    fullName,
    email,
    password,
    avatar: { url: avatar.url, public_id: avatar.public_id },
    coverImage: coverImage
      ? { url: coverImage.url, public_id: coverImage.public_id }
      : null,
  });

  //user is created or not? and remove the password and refershToken from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // console.log("user created:", createdUser);
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong registering the user");
  }
  //returning the response of created user
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully!"));
});

const loginUser = asyncHandler(async (req, res) => {
  //TODO: loginUser
  //req.body -> data
  //check username and email exists
  //find the user
  //check password
  //generate access and refresh tokens
  //send cookies(access and refresh token)

  const { email, userName, password } = req.body;

  if (!(userName || email)) {
    throw new ApiError(400, "userName or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //sending cookies
  //cookies can be modified by frontend/anyone hence this is the security step to allow only server to modify cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //got the user info from the custom verifyJWT middleware
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  //update the cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

//When an access token expires, instead of forcing the user to log in again, the server can use a refresh token to generate a new access token.
const refreshAccessToken = asyncHandler(async (req, res) => {
  const userRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!userRefreshToken) {
    throw new ApiError(401, "unauthorised access");
  }

  try {
    //verify the token
    const userDecodedToken = jwt.verify(
      userRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(userDecodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (userRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    //new token generation:
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully!"
        )
      );
  } catch (error) {
    console.error(error);
    throw new ApiError(401, "invalid refreshToken");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password");
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "Full name and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        email,
        fullName,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Profile updated successfully!"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file missing");
  }

  //upload the new avatar
  const avatar = await uploadCloudinary(avatarLocalPath);
  if (!avatar.url || !avatar.public_id) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  //old avatar public_id
  const oldAvatarPublic_id = user.avatar?.public_id;

  //update avatar
  user.avatar = {
    url: avatar.url,
    public_id: avatar.public_id,
  };

  await user.save({ validateBeforeSave: false });

  // Delete old avatar if exists
  if (oldAvatarPublic_id) {
    await deleteFromCloudinary(oldAvatarPublic_id);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "avatar updated successfully!"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage missing");
  }

  //upload the new coverImage
  const coverImage = await uploadCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(400, "Error uploading the cover Image");
  }

  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const oldCoverImagePublic_id = user.coverImage?.public_id;

  user.coverImage = {
    url: coverImage.url,
    public_id: coverImage.public_id,
  };

  await user.save({ validateBeforeSave: false });

  //delete the old cover Image if present
  if (oldCoverImagePublic_id) {
    await deleteFromCloudinary(oldCoverImagePublic_id);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Cover Image updated successfully!"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new ApiError(400, "Invalid userName");
  }

  const userChannelProfile = await User.aggregate([
    // Stage 1: Match the user by userName
    {
      $match: { userName: userName?.toLowerCase() },
    },
    // stage 2: Lookup to get subscribers
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    // stage 3: Lookup to get subscribed channels
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedChannels",
      },
    },
    // stage 4: Add computed fields for counts and subscription status
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        subscribedChannelsCount: { $size: "$subscribedChannels" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    // stage 5: Project to include specific fields (here excludes password and refreshToken)
    {
      $project: {
        userName: 1,
        fullName: 1,
        subscribersCount: 1,
        subscribedChannelsCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        createdAt: 1,
      },
    },
  ]);
  console.log("userChannelProfile:", userChannelProfile);

  if (!userChannelProfile || userChannelProfile.length === 0) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userChannelProfile[0],
        "User channel fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserProfile,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};
