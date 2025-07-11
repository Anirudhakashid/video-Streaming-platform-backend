//* configure dotenv to make the variables available to all the files as soom as possible
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

//* 2nd approach - connection code in db folder
connectDB();

//** */ 1st Approach - it makes index.js too crowded
/*
import express from "express";
const app = express();

//* Connect to MongoDB via IIFE
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    //* this line listens for the error event emitted by the Express app object
    app.on("error", (error) => {
      console.error("Connection error:", error);
      throw error;
    });

    //* listen after successfull connection
    app.listen(process.env.PORT, () => {
      console.log(`App listing on port: ${process.env.PORT} `);
    });
  } catch (error) {
    console.error("ERROR: ", error);
    throw error;
  }
})();
*/
