const express = require("express");

const {
  createEtablissement,
  getEtablissements,
  getEtablissement,
  updateEtablissement,
  deleteEtablissement
} = require("../controllers/etablissement.controller");

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", getEtablissements);

router.get("/:id", getEtablissement);

router.post(
  "/",
  protect,
  authorize("admin", "editor","etablissement"),
  createEtablissement
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  updateEtablissement
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteEtablissement
);

module.exports = router;