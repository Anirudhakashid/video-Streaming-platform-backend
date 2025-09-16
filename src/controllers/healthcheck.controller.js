import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(
  async(async (req, res) => {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { status: "OK", timeStamp: new Date() },
          "Server is healthy"
        )
      );
  })
);

export { healthcheck };
