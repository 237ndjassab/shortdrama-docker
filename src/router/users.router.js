const express = require("express");
const usersRouter = express.Router();
const multer = require("multer");

const {
  getAllUsers,
  getByIdUsers,
  createUsers,
  updateUsers,
  deleteUsers,
  assignRole,
  getPaginate,
  BanUsers,
  restaureUser,
  modifyInformationController,
  getMeController,
} = require("../controller/users.controller.js");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const { authorize } = require("../middleware/authorize.middleware.js");
const { validate } = require("../middleware/validate.middleware.js");
const { registerSchema } = require("../validation/auth.validation.js");
const { diskStorage } = require("../config/multer.config.js");
const upload = multer({ storage: diskStorage, preservePath: false });


usersRouter.get(
  "/me",
  authenticated,
  getMeController
);
usersRouter.get(
  "/paginate",
  authenticated,
  authorize("USERS:VIEW"),
  getPaginate,
);
usersRouter.get("/", authenticated, authorize("USERS:VIEW"), getAllUsers);

usersRouter.get("/:id", authenticated, authorize("USERS:VIEW"), getByIdUsers);

usersRouter.post("/", authenticated, authorize("USERS:ADD"), createUsers);

//modification du profil
usersRouter.put(
  "/me",
  authenticated,
  upload.single("image"),
  modifyInformationController,
);


usersRouter.put(
  "/:id",
  validate(registerSchema),
  authenticated,
  authorize("USERS:UPDATE"),
  updateUsers,
);

usersRouter.put("/ban/:id", authenticated, authorize("USERS:BLOC"), BanUsers);

usersRouter.put(
  "/restaure/:id",
  authenticated,
  authorize("USERS:RESTAURE"),
  restaureUser,
);
usersRouter.delete(
  "/:id",
  authenticated,
  authorize("USERS:DELETE"),
  deleteUsers,
);
usersRouter.put(
  "/assign/:id",
  authenticated,
  authorize("USERS:ASSIGN_ROLE"),
  assignRole,
);


module.exports = {
  usersRouter,
};
