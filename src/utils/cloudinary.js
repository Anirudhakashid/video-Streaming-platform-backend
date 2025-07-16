import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//Configuration
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // file uploading
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("file has been uploaded on cloudnary: ", uploadResult);
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

export { uploadCloudinary };
