import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //store refresh token in db
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "error generating access and refresh tokens");
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
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
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
    $or: [email, userName],
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

  const loggedInUser = User.findById(user._id).select(
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
    .clearCookie(accessToken, options)
    .clearCookie(refreshToken, options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export { registerUser, loginUser, logoutUser };
