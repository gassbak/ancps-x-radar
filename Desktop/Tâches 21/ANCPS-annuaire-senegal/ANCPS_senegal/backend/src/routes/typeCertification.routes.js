const express = require("express");

const controller =
  require(
    "../controllers/typeCertification.controller"
  );

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", controller.getAll);

router.post(
  "/",
  protect,
  authorize("admin", "editor"),
  controller.create
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  controller.update
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  controller.remove
);

module.exports = router;