const express = require("express");

const {
  createReconnaissance,
  getReconnaissances,
  getReconnaissance,
  updateReconnaissance,
  deleteReconnaissance
} = require("../controllers/reconnaissance.controller");

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", getReconnaissances);

router.get("/:id", getReconnaissance);

router.post(
  "/",
  protect,
  authorize("admin", "editor"),
  createReconnaissance
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  updateReconnaissance
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteReconnaissance
);

module.exports = router;