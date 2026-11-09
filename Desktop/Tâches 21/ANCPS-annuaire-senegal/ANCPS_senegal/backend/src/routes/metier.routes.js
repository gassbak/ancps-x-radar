const express = require("express");

const {
  createMetier,
  getMetiers,
  getMetier,
  updateMetier,
  deleteMetier
} = require("../controllers/metier.controller");

const protect = require("../middlewares/auth.middleware");

const authorize = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", getMetiers);

router.get("/:id", getMetier);

router.post(
  "/",
  protect,
  authorize("admin", "editor","etablissement"),
  createMetier
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor","etablissement"),
  updateMetier
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteMetier
);

module.exports = router;