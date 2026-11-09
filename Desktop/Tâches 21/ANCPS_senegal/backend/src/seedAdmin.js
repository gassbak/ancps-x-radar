require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@ancps.sn";

    const password = await bcrypt.hash("admin123", 10);

    let user = await User.findOne({ email });

    if (user) {
      user.role = "superadmin";
      user.permissions = [];

      await user.save();

      console.log("Compte transformé en superadmin");
    } else {
      user = await User.create({
        name: "Super Administrateur",
        email,
        password,
        role: "superadmin",
        permissions: []
      });

      console.log("Superadmin créé");
    }

    console.log("Email : admin@ancps.sn");
    console.log("Mot de passe : admin123");

  } catch (error) {
    console.error("Erreur :", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createSuperAdmin();