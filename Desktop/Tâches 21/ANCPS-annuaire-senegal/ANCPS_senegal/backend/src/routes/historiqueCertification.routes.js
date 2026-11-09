const express =
  require("express");

const {
  getHistorique,
  createHistorique
} = require(
  "../controllers/historiqueCertification.controller"
);

const protect =
  require(
    "../middlewares/auth.middleware"
  );

const authorize =
  require(
    "../middlewares/role.middleware"
  );

const router =
  express.Router();

router.get(
  "/:certificationId",
  protect,
  getHistorique
);

router.post(
  "/:certificationId",
  protect,
  authorize(
    "admin",
    "editor",
    "verifier"
    
  ),
  createHistorique
);

module.exports = router;