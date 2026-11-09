
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendMail } = require("../config/mailer");

// REGISTER
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "Cet email existe déjà",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// PROFILE
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "L'adresse email est obligatoire",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Ne jamais révéler si l'adresse existe.
    if (!user) {
      return res.json({
        message:
          "Si cette adresse correspond à un compte, un lien de réinitialisation a été envoyé.",
      });
    }

    // Token sécurisé
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash du token stocké dans MongoDB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Expiration : 15 minutes
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      console.log("Envoi du mail de récupération vers :", user.email);

      await sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Réinitialisation de votre mot de passe - ANCPS",

        text: `
Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe ANCPS.

Cliquez sur le lien suivant pour définir un nouveau mot de passe :

${resetUrl}

Ce lien expire dans 15 minutes et ne peut être utilisé qu'une seule fois.

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.

L'équipe ANCPS
        `,

        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Réinitialisation de votre mot de passe</h2>

            <p>Bonjour,</p>

            <p>
              Vous avez demandé la réinitialisation de votre mot de passe ANCPS.
            </p>

            <p>
              Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
            </p>

            <p>
              <a
                href="${resetUrl}"
                style="
                  display: inline-block;
                  padding: 12px 20px;
                  background: #2563eb;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                "
              >
                Réinitialiser mon mot de passe
              </a>
            </p>

            <p>
              Ce lien expire dans <strong>15 minutes</strong> et ne peut être
              utilisé qu'une seule fois.
            </p>

            <p>
              Si vous n'êtes pas à l'origine de cette demande, vous pouvez
              ignorer cet email.
            </p>

            <p>L'équipe ANCPS</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Password reset email error:", emailError);

      // Le lien ne doit pas rester actif si l'email n'a pas été envoyé
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;

      await user.save();

      return res.status(500).json({
        message: "Impossible d'envoyer l'email de réinitialisation",
      });
    }

    return res.json({
      message:
        "Si cette adresse correspond à un compte, un lien de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Le token et le nouveau mot de passe sont obligatoires",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
    }

    // Hash du token reçu
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Recherche du compte + vérification expiration
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Le lien est invalide ou a expiré",
      });
    }

    // Hash du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // Token utilisable une seule fois
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.json({
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Erreur serveur",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
};

