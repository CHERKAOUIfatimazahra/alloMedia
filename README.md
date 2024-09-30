# alloMedia

## Description
AlloMedia est une application de livraison de produits, développée avec **Node.js** et **Express**, utilisant **MongoDB** comme base de données. L'application prend en charge l'authentification des utilisateurs, l'envoi d'e-mails, et utilise **EJS** comme moteur de templates pour rendre des vues dynamiques. L'application est également sécurisée grâce à **JWT** pour la gestion des tokens et **bcryptjs** pour le cryptage des mots de passe.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Routes API](#routes-api)
- [Structure du projet](#structure-du-projet)
- [Tests](#tests)
- [Contributions](#contributions)
- [License](#license)

## Fonctionnalités

- **Inscription** : Permet aux utilisateurs de s'inscrire avec un e-mail et un mot de passe.
- **Vérification d'e-mail** : Envoie un e-mail de vérification après l'inscription.
- **Connexion** : Authentification des utilisateurs avec vérification par mot de passe.
- **Réinitialisation de mot de passe** : Permet aux utilisateurs de réinitialiser leur mot de passe via un lien envoyé par e-mail.
- **Authentification par OTP** : Envoie un code OTP pour valider la connexion des utilisateurs.

## Technologies

- **Node.js** : Environnement d'exécution JavaScript côté serveur.
- **Express** : Framework web pour Node.js.
- **MongoDB** : Base de données NoSQL pour stocker les utilisateurs et leurs informations.
- **Mongoose** : ODM (Object Data Modeling) pour MongoDB et Node.js.
- **JWT (JSON Web Tokens)** : Pour la gestion des sessions et l'authentification.
- **Nodemailer** : Pour l'envoi d'e-mails.
- **bcryptjs** : Pour le hachage sécurisé des mots de passe.
- **dotenv** : Pour gérer les variables d'environnement.
- **Jest** : Framework de test pour JavaScript.

## Installation

1. **Cloner le dépôt** :

   ```bash
   https://github.com/CHERKAOUIfatimazahra/alloMedia.git