import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//* https//localhost:8000/api/v1/users/register
router.route("/register").post(
  //2 obj as 2 files are acepted: avatar & cover image
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured route
//verifyJWT -> middleware: checks if the user is logged in before logging out
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
