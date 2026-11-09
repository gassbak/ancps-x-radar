const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  // Réinitialisation du mot de passe
  resetPasswordToken: {
    type: String,
    default: null
  },

  resetPasswordExpires: {
    type: Date,
    default: null
  },

  role: {
    type: String,
    enum: [
      "superadmin",
      "admin",
      "editor",
      "verifier",
      "etablissement",
      "visiteur"
    ],
    default: "visiteur"
  },

  permissions: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model("User", userSchema);