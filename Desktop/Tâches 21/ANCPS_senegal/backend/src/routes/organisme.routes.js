const express = require("express");

const {
  createOrganisme,
  getOrganismes,
  getOrganisme,
  updateOrganisme,
  deleteOrganisme
} = require("../controllers/organisme.controller");

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", getOrganismes);

router.get("/:id", getOrganisme);

router.post(
  "/",
  protect,
  authorize("admin", "editor","etablissement"),
  createOrganisme
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  updateOrganisme
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteOrganisme
);

module.exports = router;