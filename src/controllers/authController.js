const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// fonction d'envoyer un e-mail de vérification
async function sendVerificationEmail(user) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: user.email,
    subject: "Vérification de votre e-mail",
    html: `<a href="${process.env.BASE_URL}/verify/${user._id}">Vérifiez votre e-mail ici</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("E-mail de vérification envoyé à " + user.email);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail : ", error);
  }
}

// fonction de vérification de l'e-mail
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "E-mail vérifié avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Contrôleur pour l'inscription
exports.register = [
  // Valider les données d'inscription
  check("name", "Le nom est requis").not().isEmpty(),
  check("email", "Veuillez fournir un email valide").isEmail(),
  check(
    "password",
    "Le mot de passe doit contenir au moins 6 caractères"
  ).isLength({ min: 6 }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      // Vérifier si l'utilisateur existe déjà
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "Utilisateur déjà existant" });
      }

      // Créer un nouvel utilisateur
      user = new User({ name, email, password });

      // Hacher le mot de passe
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Sauvegarder l'utilisateur
      await user.save();

      // Envoyer un e-mail de vérification
      await sendVerificationEmail(user);

      res.status(201).json({
        message: "Utilisateur enregistré. Veuillez vérifier votre e-mail.",
      });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
];

// Envoyer le code OTP par e-mail
async function sendOTPEmail(user, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: user.email,
    subject: "Votre code OTP",
    text: `Votre code OTP est : ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("E-mail OTP envoyé à " + user.email);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail OTP : ", error);
  }
}

// Function to generate a random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
}

// Login Controller
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const now = Date.now();
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Identifiants invalides" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Identifiants invalides" });

    const threeDaysInMs = 3 * 60 * 60 * 1000;
    const threeMinutesInMs = 3 * 60 * 1000;

    if (user.lastLogin && now - user.lastLogin < threeDaysInMs) {
      // User can log in directly
      res.status(200).json({ message: "Connexion réussie" });
    } else {
      // User needs to validate OTP
      const otp = user.otp && now < user.otpExpiresAt ? user.otp : generateOTP();
      user.otp = otp;
      user.otpExpiresAt = now + threeMinutesInMs;
      await user.save();
      await sendOTPEmail(user, otp);
      res.status(200).json({ message: "Code OTP envoyé à votre e-mail." });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Verify OTP Controller
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ message: "Code OTP invalide ou expiré" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    user.otp = null; 
    user.lastLogin = Date.now(); 
    await user.save();

    res.status(200).json({ token });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message || "Une erreur est survenue." });
  }
};

// Route pour demander la réinitialisation du mot de passe
const sendEmail = async ({ email, subject, message }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: subject,
    text: message,
  };

  await transporter.sendMail(mailOptions);
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 

    await user.save();

    const resetUrl = `${process.env.BASE_URL}/resetpassword/${resetToken}`;
    const message = `Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur ce lien pour le réinitialiser : ${resetUrl}`;

    await sendEmail({
      email: user.email,
      subject: "Réinitialisation du mot de passe",
      message,
    });

    res.status(200).json({ message: "E-mail de réinitialisation envoyé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Route pour réinitialiser le mot de passe
exports.resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
