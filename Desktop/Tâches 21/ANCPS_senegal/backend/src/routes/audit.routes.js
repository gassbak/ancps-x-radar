const express = require("express");

const {
  getAuditLogs,
  getAuditLog
} = require(
  "../controllers/audit.controller"
);

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin"),
  getAuditLogs
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getAuditLog
);

module.exports = router;