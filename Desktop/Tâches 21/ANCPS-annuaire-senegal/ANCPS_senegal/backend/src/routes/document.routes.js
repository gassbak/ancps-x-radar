const express = require("express");

const {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument
} = require("../controllers/document.controller");

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", getDocuments);

router.get("/:id", getDocument);

router.post(
  "/",
  protect,
  authorize("admin", "editor"),
  createDocument
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  updateDocument
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteDocument
);

module.exports = router;