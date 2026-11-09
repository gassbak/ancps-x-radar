const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtSecret } = require("../config/env");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token manquant"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token manquant"
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "Utilisateur introuvable"
      });
    }

    req.user = user;

    next();

  } catch (error) {
    console.error("Erreur auth :", error.message);

    return res.status(401).json({
      message: "Token invalide"
    });
  }
};

module.exports = protect;