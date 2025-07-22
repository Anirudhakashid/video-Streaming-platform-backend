//* configure dotenv to make the variables available to all the files as soon as possible
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app
      .on("errors", (error) => {
        console.log("Error: ", error);
        throw error;
      })
      .listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
      });
  })
  .catch((err) => {
    console.log("MongoDB connection Failed: ", err);
  });
