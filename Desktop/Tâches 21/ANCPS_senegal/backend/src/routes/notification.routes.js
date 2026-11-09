const express = require("express");

const {
  getAll,
  read
} = require(
  "../controllers/notification.controller"
);

const protect =
  require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/",
  protect,
  getAll
);

router.put(
  "/:id/read",
  protect,
  read
);

module.exports = router;