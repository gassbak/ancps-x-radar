const express = require("express");

const {
  createDomaine,
  getDomaines,
  getDomaine,
  updateDomaine,
  deleteDomaine
} = require("../controllers/domaine.controller");

const {
  createSousDomaine,
  getSousDomaines,
  getSousDomaine,
  updateSousDomaine,
  deleteSousDomaine
} = require("../controllers/sousDomaine.controller");

const protect = require("../middlewares/auth.middleware");

const authorize = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", getDomaines);

router.get("/sous-domaines", getSousDomaines);

router.get("/:id", getDomaine);

router.get(
  "/sous-domaines/:id",
  getSousDomaine
);

router.post(
  "/",
  protect,
  authorize("admin", "editor"),
  createDomaine
);

router.post(
  "/sous-domaines",
  protect,
  authorize("admin", "editor"),
  createSousDomaine
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor"),
  updateDomaine
);

router.put(
  "/sous-domaines/:id",
  protect,
  authorize("admin", "editor"),
  updateSousDomaine
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteDomaine
);

router.delete(
  "/sous-domaines/:id",
  protect,
  authorize("admin"),
  deleteSousDomaine
);

module.exports = router;