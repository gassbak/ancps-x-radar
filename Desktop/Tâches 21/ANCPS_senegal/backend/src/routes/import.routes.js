const express = require("express");

const {
  previewImport,
  importData
} = require("../controllers/import.controller");

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const upload =
  require("../middlewares/upload.middleware");

const router = express.Router();

router.post(
  "/preview",
  protect,
  authorize("admin", "editor"),
  upload.single("fichier"),
  previewImport
);

router.post(
  "/",
  protect,
  authorize("admin", "editor"),
  upload.single("fichier"),
  importData
);

module.exports = router;