import { asyncHandler } from "../utils/asyncHandler.js";

//Contains the logic for what happens when someone tries to register //*TEMPORARY
const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "OK",
  });
});

export { registerUser };
