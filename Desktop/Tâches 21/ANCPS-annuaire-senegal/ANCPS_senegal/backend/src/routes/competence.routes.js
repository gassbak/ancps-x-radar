const express = require("express");

const {
  createCompetence,
  getCompetences,
  getCompetence,
  updateCompetence,
  deleteCompetence
} = require("../controllers/competence.controller");

const protect = require("../middlewares/auth.middleware");

const authorize = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", getCompetences);

router.get("/:id", getCompetence);

router.post(
  "/",
  protect,
  authorize("admin", "editor","etablissement"),
  createCompetence
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor","etablissement"),
  updateCompetence
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteCompetence
);

module.exports = router;