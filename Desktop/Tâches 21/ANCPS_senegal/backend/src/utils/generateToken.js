const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    jwtSecret,
    { expiresIn: "1d" }
  );
}

module.exports = generateToken;