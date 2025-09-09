import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// app.use is used for Middleware setup and other configurations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
//* configuration to accept data in form of json with a limit
app.use(express.json({ limit: "16kb" }));
//* configuration to accept data in form of url-encoded
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
//* configuration to static/publically available files
app.use(express.static("public"));
//* configuration to parse cookies-to perform curd operations on user cookies
app.use(cookieParser());

//Routes:
import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";

//Router declaration: https//localhost:8000/api/v1/users = on hiting this the control will be passed to userRouter
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);

export { app };
