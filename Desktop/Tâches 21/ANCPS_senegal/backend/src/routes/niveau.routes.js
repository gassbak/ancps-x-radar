const express = require("express");

const {
  getAll,
  create,
  update,
  remove
} = require("../controllers/niveau.controller");

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", getAll);

router.post(
  "/",
  protect,
  authorize("admin", "editor"),
  create
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  update
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  remove
);

module.exports = router;