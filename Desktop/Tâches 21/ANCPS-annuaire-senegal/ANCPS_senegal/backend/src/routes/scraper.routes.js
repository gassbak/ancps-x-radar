const express = require("express");
const router = express.Router();

const {
  scrapeAmieFpt,
  collectCertifications,
  importCertifications
} = require("../controllers/scraper.Controller");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

router.post("/amie-fpt", protect, authorize("admin", "editor"), scrapeAmieFpt);
router.post(
  "/collect-certifications",
  protect,
  authorize("admin", "editor"),
  collectCertifications
);
router.post(
  "/import-certifications",
  protect,
  authorize("admin", "editor"),
  importCertifications
);

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Module scraper ANCPS opérationnel"
  });
});

module.exports = router;