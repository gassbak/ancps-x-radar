const express = require("express");

const {
  createSource,
  getSources,
  getSource,
  updateSource,
  deleteSource
} = require("../controllers/source.controller");

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", getSources);

router.get("/:id", getSource);

router.post(
  "/",
  protect,
  authorize("admin", "editor","etablissement"),
  createSource
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  updateSource
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteSource
);

module.exports = router;