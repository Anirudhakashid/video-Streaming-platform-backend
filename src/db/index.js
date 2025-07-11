import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    //checking the DB host - to check if db is connected to right DB
    console.log(
      `\n Database connected!! DB Host: ${connectionInstance.connection.host} `
    );
  } catch (error) {
    console.error("MongoDB connection Failed: ", error);
    process.exit(1);
  }
};

export default connectDB;
