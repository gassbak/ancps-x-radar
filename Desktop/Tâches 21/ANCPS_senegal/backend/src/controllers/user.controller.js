const bcrypt = require("bcryptjs");
const User = require("../models/User");
const permissions = require("../config/permissions");


// ===============================
// LISTE DES UTILISATEURS
// ===============================
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);

  } catch (error) {
    console.error("Erreur utilisateurs :", error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


// ===============================
// VOIR UN UTILISATEUR
// ===============================
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }

    res.json(user);

  } catch (error) {
    console.error("Erreur utilisateur :", error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


// ===============================
// AJOUTER UN UTILISATEUR
// ===============================
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires"
      });
    }

    const roles = [
      "superadmin",
      "admin",
      "editor",
      "verifier",
      "etablissement",
      "visiteur"
    ];

    if (!roles.includes(role)) {
      return res.status(400).json({
        message: "Rôle invalide"
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Cet email existe déjà"
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      }
    });

  } catch (error) {
    console.error(
      "Erreur création utilisateur :",
      error
    );

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


// ===============================
// MODIFIER UN UTILISATEUR
// ===============================
const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role
    } = req.body;

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }

    // Modifier le nom
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Le nom est obligatoire"
        });
      }

      user.name = name.trim();
    }

    // Modifier l'email
    if (email !== undefined) {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          message: "L'email est obligatoire"
        });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: {
          $ne: req.params.id
        }
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Cet email existe déjà"
        });
      }

      user.email = normalizedEmail;
    }

    // Modifier le rôle
    if (role !== undefined) {
      const roles = [
        "superadmin",
        "admin",
        "editor",
        "verifier",
        "etablissement",
        "visiteur"
      ];

      if (!roles.includes(role)) {
        return res.status(400).json({
          message: "Rôle invalide"
        });
      }

      user.role = role;
    }

    // Modifier le mot de passe
    if (
      password !== undefined &&
      password.trim() !== ""
    ) {
      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Le mot de passe doit contenir au moins 6 caractères"
        });
      }

      user.password = await bcrypt.hash(
        password,
        10
      );
    }

    await user.save();

    res.json({
      message: "Utilisateur modifié avec succès",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      }
    });

  } catch (error) {
    console.error(
      "Erreur modification utilisateur :",
      error
    );

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


// ===============================
// MODIFIER LE RÔLE
// ===============================
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;

    const roles = [
      "superadmin",
      "admin",
      "editor",
      "verifier",
      "etablissement",
      "visiteur"
    ];

    if (!roles.includes(role)) {
      return res.status(400).json({
        message: "Rôle invalide"
      });
    }

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }

    user.role = role;

    await user.save();

    res.json({
      message: "Rôle modifié avec succès",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      }
    });

  } catch (error) {
    console.error(
      "Erreur modification rôle :",
      error
    );

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


// ===============================
// MODIFIER LES PERMISSIONS
// ===============================
const updatePermissions = async (req, res) => {
  try {
    const {
      permissions: newPermissions
    } = req.body;

    if (!Array.isArray(newPermissions)) {
      return res.status(400).json({
        message:
          "Les permissions doivent être un tableau"
      });
    }

    const invalidPermissions =
      newPermissions.filter(
        permission =>
          !permissions.includes(permission)
      );

    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        message: "Permission(s) invalide(s)",
        invalidPermissions
      });
    }

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }

    user.permissions = newPermissions;

    await user.save();

    res.json({
      message:
        "Permissions modifiées avec succès",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      }
    });

  } catch (error) {
    console.error(
      "Erreur modification permissions :",
      error
    );

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


// ===============================
// SUPPRIMER UN UTILISATEUR
// ===============================
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }

    // Empêcher la suppression de soi-même
    if (
      req.user &&
      req.user._id &&
      req.user._id.toString() ===
        req.params.id
    ) {
      return res.status(400).json({
        message:
          "Vous ne pouvez pas supprimer votre propre compte"
      });
    }

    await User.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message:
        "Utilisateur supprimé avec succès"
    });

  } catch (error) {
    console.error(
      "Erreur suppression utilisateur :",
      error
    );

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateRole,
  updatePermissions
};