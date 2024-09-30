const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");


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

