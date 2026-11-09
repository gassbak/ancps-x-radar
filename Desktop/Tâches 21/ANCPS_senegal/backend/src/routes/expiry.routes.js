const express = require("express");

const {
  checkExpirations
} = require(
  "../services/expiry.service"
);

const protect =
  require("../middlewares/auth.middleware");

const authorize =
  require("../middlewares/role.middleware");

const router = express.Router();

router.post(
  "/check",
  protect,
  authorize("admin"),
  async (req, res) => {
    await checkExpirations();

    res.json({
      message:
        "Vérification des expirations terminée"
    });
  }
);

module.exports = router;