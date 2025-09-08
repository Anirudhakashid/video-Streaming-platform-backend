import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

//Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//upload utility
const uploadCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // file uploading
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // console.log("file has been uploaded on cloudnary: ", uploadResult);
    fs.unlinkSync(localFilePath);
    return uploadResult;
  } catch (error) {
    //removing the locally saved file as the upload operation got failed
    try {
      fs.unlinkSync(localFilePath);
      console.log("Local file deleted due to upload failure.");
    } catch (unlinkError) {
      console.error("Error deleting local file:", unlinkError);
    }
    return null;
  }
};

//delete utility
const deleteFromCloudinary = async (public_id) => {
  if (!public_id) return null;

  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    throw new ApiError(500, "Error deleting the old file");
  }
};

export { uploadCloudinary, deleteFromCloudinary };
