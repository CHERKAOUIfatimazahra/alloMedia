const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware pour analyser le corps des requêtes
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// Configuration du moteur de template EJS
app.set("view engine", "ejs"); 
app.set("views", path.join(__dirname, "views")); 

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connecté à MongoDB"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

// Route pour rendre la vue 
app.get("/", (req, res) => {
  res.render("index"); 
});

// Routes
app.use("/api/auth", authRoutes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Quelque chose s'est mal passé !");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
