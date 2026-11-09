const express = require("express");

const {
  create,
  getAll,
  getOne,
  updateStatus
} = require(
  "../controllers/contribution.controller"
);

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const router = express.Router();
router.post(
  "/",
  protect,
  authorize(
    "admin",
    "editor",
    "etablissement"
  ),
  create
);
router.get(
  "/",
  protect,
  authorize(
    "admin",
    "editor",
    "verifier"
  ),
  getAll
);
router.get(
  "/:id",
  protect,
  authorize(
    "admin",
    "editor",
    "verifier"
  ),
  getOne
);
router.put(
  "/:id/status",
  protect,
  authorize("admin", "verifier"),
  updateStatus
);
module.exports = router;