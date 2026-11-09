const express = require("express");

const {
  createCertification,
  getCertifications,
  getCertification,
  updateCertification,
  deleteCertification
} = require("../controllers/certification.controller");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", getCertifications);

router.get("/:id", getCertification);

router.post(
  "/",
  protect,
  authorize("admin", "editor","etablissement"),
  createCertification
);

router.put(
  "/:id",
  protect,
  authorize("admin", "editor","etablissement"),
  updateCertification
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteCertification
);

module.exports = router;