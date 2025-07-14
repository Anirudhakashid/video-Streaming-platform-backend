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

export { app };
