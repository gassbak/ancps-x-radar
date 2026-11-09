
const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword
} = require("../controllers/auth.controller");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

const router = express.Router();
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // maximum 5 demandes
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message:
      "Trop de demandes. Veuillez réessayer dans 15 minutes."
  }
});

// Inscription
router.post("/register", register);


// Connexion
router.post("/login", login);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPassword
);
router.post("/reset-password", resetPassword);


// Utilisateur connecté
router.get("/me", protect, (req, res) => {
  res.json({
    message: "Accès autorisé",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});


// Profil
router.get("/profile", protect, getProfile);


// Test admin
router.get(
  "/admin-test",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({
      message: "Accès admin autorisé"
    });
  }
);


module.exports = router;
