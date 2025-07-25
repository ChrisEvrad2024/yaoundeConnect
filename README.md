# yaoundeConnect

## Vue d'ensemble du projet

yaoundeConnect est une plateforme web et mobile collaborative de découverte et de partage de points d'intérêt (POI) pour la ville de Yaoundé au Cameroun. La plateforme permet aux utilisateurs de découvrir des lieux, de contribuer en ajoutant de nouveaux points d'intérêt, et d'interagir avec la communauté via un système de commentaires et de notations.

### Objectifs principaux

- **Découverte locale** : Faciliter la découverte de restaurants, attractions, services et lieux d'intérêt à Yaoundé
- **Contribution collaborative** : Permettre aux utilisateurs d'enrichir la base de données avec leurs propres découvertes
- **Qualité du contenu** : Assurer la fiabilité des informations via un système de modération et de validation communautaire
- **Engagement social** : Créer une communauté active autour du partage d'expériences locales
- **Accessibilité géographique** : Fournir des outils de géolocalisation et de navigation pour faciliter l'accès aux lieux

## Choix technologiques

### Backend - Node.js avec TypeScript

**Justification du choix :**
- **Performance** : Event-driven, non-blocking I/O adapté aux applications temps réel
- **Écosystème riche** : NPM offre des packages pour géolocalisation, upload d'images, notifications
- **Développement rapide** : JavaScript côté serveur et client facilite la cohérence d'équipe
- **Scalabilité** : Architecture microservices possible avec Node.js clusters
- **Communauté active** : Support long terme et mises à jour régulières

### Framework - Express.js

**Avantages :**
- **Simplicité** : API REST claire et intuitive
- **Flexibilité** : Middleware modulaire pour authentification, validation, upload
- **Maturité** : Framework stable avec documentation extensive
- **Performance** : Léger et rapide pour les applications web

### Base de données - MySQL

**Motivations :**
- **Données relationnelles** : Structure hiérarchique (Pays > Ville > Arrondissement > Quartier > POI)
- **Intégrité référentielle** : Contraintes de clés étrangères pour cohérence des données
- **Requêtes géospatiales** : Support natif des fonctions de géolocalisation
- **Maturité et fiabilité** : Base de données éprouvée pour applications critiques
- **Outils d'administration** : phpMyAdmin et autres outils familiers

### ORM - Sequelize

**Bénéfices :**
- **Sécurité** : Protection automatique contre l'injection SQL
- **Productivité** : Modèles objet pour manipulation intuitive des données
- **Migrations** : Gestion versionnée du schéma de base de données
- **Relations** : Gestion automatique des associations entre modèles
- **Validation** : Contraintes de données au niveau applicatif et base

## Architecture du projet

### Structure des dossiers

```
yaoundeConnect/
├── src/
│   ├── app.js                 # Configuration Express principale
│   ├── config/               # Configurations (DB, JWT, email, upload)
│   │   ├── database.js
│   │   ├── jwt.js
│   │   ├── email.js
│   │   └── upload.js
│   ├── controllers/          # Logique métier des endpoints
│   │   ├── authController.js
│   │   ├── poiController.js
│   │   ├── commentController.js
│   │   ├── ratingController.js
│   │   ├── approvalController.js
│   │   └── osmController.js
│   ├── middlewares/          # Middlewares personnalisés
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── validationMiddleware.js
│   │   ├── errorHandler.js
│   │   └── uploadMiddleware.js
│   ├── models/               # Modèles Sequelize (entités DB)
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── PointInterest.js
│   │   ├── Comment.js
│   │   ├── Rating.js
│   │   ├── Category.js
│   │   ├── Quartier.js
│   │   └── ...
│   ├── routes/               # Définition des routes API
│   │   ├── auth.js
│   │   ├── poi.js
│   │   ├── comments.js
│   │   ├── ratings.js
│   │   ├── approval.js
│   │   └── osm.js
│   ├── services/             # Logique métier complexe
│   │   ├── authService.js
│   │   ├── poiService.js
│   │   ├── commentService.js
│   │   ├── ratingService.js
│   │   ├── approvalService.js
│   │   ├── osmService.js
│   │   ├── emailService.js
│   │   ├── imageService.js
│   │   ├── geoService.js
│   │   ├── notificationService.js
│   │   └── paginationService.js
│   ├── validators/           # Schémas de validation Joi
│   │   ├── authValidator.js
│   │   ├── poiValidator.js
│   │   ├── commentValidator.js
│   │   ├── ratingValidator.js
│   │   ├── approvalValidator.js
│   │   └── osmValidator.js
│   ├── utils/                # Utilitaires et tests
│   │   ├── dbTest.js
│   │   ├── testAuth.js
│   │   ├── testPOI.js
│   │   ├── testSprint2Final.js
│   │   ├── testSprint3.js
│   │   └── ...
│   └── database/             # Migrations et schémas SQL
│       ├── migrations.sql
│       ├── approval_migration.sql
│       └── sprint3_migration.sql
├── uploads/                  # Stockage fichiers uploadés
│   ├── images/
│   │   ├── poi/
│   │   └── temp/
│   └── thumbnails/
│       ├── small/
│       ├── medium/
│       └── large/
├── .env                      # Variables d'environnement
├── .gitignore
├── package.json
├── server.js                 # Point d'entrée de l'application
└── README.md
```

### Flux de données architectural

#### 1. Requête HTTP entrante
```
Client → Express Router → Validation Middleware → Auth Middleware → Controller
```

#### 2. Traitement métier
```
Controller → Service → Model (Sequelize) → Database (MySQL)
```

#### 3. Réponse
```
Database → Model → Service → Controller → JSON Response → Client
```

#### 4. Notifications temps réel
```
Event → NotificationService → Socket.IO → Connected Clients
                           → EmailService → SMTP → Users
```

## Dépendances principales

### Dependencies de production

**Framework et serveur :**
- `express` (5.1.0) : Framework web minimaliste et flexible
- `cors` (2.8.5) : Cross-Origin Resource Sharing pour API
- `helmet` (8.1.0) : Sécurisation des headers HTTP
- `morgan` (1.10.0) : Logger HTTP pour monitoring

**Base de données :**
- `sequelize` (6.37.7) : ORM pour MySQL avec support TypeScript
- `mysql2` (3.14.2) : Driver MySQL optimisé pour Node.js

**Authentification et sécurité :**
- `bcryptjs` (3.0.2) : Hachage sécurisé des mots de passe
- `jsonwebtoken` (9.0.2) : Génération et validation de tokens JWT
- `joi` (17.13.3) : Validation de schémas de données

**Upload et traitement d'images :**
- `multer` (2.0.1) : Middleware multipart/form-data pour upload
- `sharp` (0.34.3) : Traitement d'images haute performance (resize, optimize)

**Communications :**
- `nodemailer` (7.0.5) : Envoi d'emails transactionnels
- `socket.io` (4.8.1) : Communication temps réel bidirectionnelle
- `axios` (1.10.0) : Client HTTP pour appels API externes (OpenStreetMap)

**Configuration :**
- `dotenv` (17.2.0) : Gestion variables d'environnement

### DevDependencies

**Qualité de code :**
- `eslint` (8.56.0) : Linter JavaScript/TypeScript
- `prettier` (3.6.2) : Formateur de code automatique
- `husky` (9.1.7) : Git hooks pour qualité pré-commit

**Tests :**
- `jest` (30.0.4) : Framework de tests unitaires et d'intégration
- `supertest` (7.1.3) : Tests HTTP pour APIs Express

**Développement :**
- `nodemon` (3.1.10) : Redémarrage automatique en développement

## Fonctionnement logique

### 1. Système d'authentification et autorisation

**Flux d'inscription :**
```
User submits registration → Validation → Password hashing → User creation → 
Email verification token → Email sent → User clicks link → Account activated
```

**Hiérarchie des rôles :**
- `membre` : Consultation, commentaires, notation
- `collecteur` : + Création de POI
- `moderateur` : + Approbation/rejet POI et commentaires
- `admin` : + Gestion utilisateurs et statistiques complètes
- `superadmin` : + Configuration système

### 2. Gestion des Points d'Intérêt (POI)

**Cycle de vie d'un POI :**
```
Creation (status: pending) → Moderation → Approved/Rejected → 
Public visibility → User interactions (comments, ratings) → 
Statistics updates
```

**Validation multicouche :**
- Validation Joi côté serveur (format, longueur, types)
- Validation géographique (coordonnées dans Yaoundé)
- Validation OpenStreetMap (cohérence adresse/coordonnées)
- Modération humaine pour qualité du contenu

### 3. Système de géolocalisation

**Services géographiques :**
- Calcul de distances (formule de Haversine)
- Recherche par proximité avec bounding box
- Géocodage et géocodage inverse via OpenStreetMap
- Validation automatique des adresses

**Optimisations performance :**
- Index spatiaux MySQL pour requêtes géographiques
- Cache des résultats OpenStreetMap (24h)
- Pagination cursor-based pour gros volumes

### 4. Système de modération collaborative

**Modération automatique :**
- Auto-approbation des commentaires (modération a posteriori)
- Auto-masquage après 5 signalements utilisateur
- Détection anti-spam (délai entre publications)

**Workflow modérateur :**
```
Content flagged → Moderator notification → Review → Action (approve/reject/delete) → 
Audit log → User notification → Statistics update
```

### 5. Notifications multi-canaux

**Événements déclencheurs :**
- Nouveau POI créé → Notification modérateurs
- POI approuvé/rejeté → Notification créateur
- Nouveau commentaire → Notification propriétaire POI
- Réponse à commentaire → Notification auteur original

**Canaux de diffusion :**
- Socket.IO pour notifications temps réel
- Email HTML pour persistance et engagement
- Notifications in-app pour historique

## Configuration et déploiement

### Variables d'environnement (.env)

```env
# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=explorateur_mboa
DB_PORT=3306

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Application
APP_NAME=yaoundeConnect
APP_URL=http://localhost:3000
PORT=3000
NODE_ENV=development

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Installation et lancement

```bash
# Installation des dépendances
npm install

# Configuration base de données
mysql -u root -p
source src/database/migrations.sql
source src/database/approval_migration.sql
source src/database/sprint3_migration.sql

# Création des dossiers upload
npm run setup:upload-dirs

# Tests de validation
npm run test:connection
npm run test:db
npm run test:auth

# Lancement développement
npm run dev

# Lancement production
npm start
```

### Tests disponibles

```bash
# Tests individuels
npm run test:connection      # Test connexion DB
npm run test:db              # Test modèles et relations
npm run test:auth           # Test système authentification
npm run test:poi            # Test gestion POI
npm run test:approval       # Test workflow approbation
npm run test:sprint2        # Test fonctionnalités Sprint 2
npm run test:sprint3        # Test commentaires et ratings

# Tests endpoints
npm run test:endpoints      # Test API auth
npm run test:poi-endpoints  # Test API POI
npm run test:osm           # Test OpenStreetMap

# Test complet
npm run test:all
```

## API REST - Endpoints principaux

### Authentification
- `POST /api/auth/register` : Inscription utilisateur
- `POST /api/auth/login` : Connexion utilisateur
- `GET /api/auth/verify-email` : Vérification email
- `GET /api/auth/me` : Profil utilisateur connecté

### Points d'Intérêt
- `GET /api/poi` : Liste POI avec filtres et pagination
- `GET /api/poi/:id` : Détail POI avec statistiques
- `GET /api/poi/nearby` : POI à proximité géographique
- `POST /api/poi` : Création POI (collecteur+)
- `PUT /api/poi/:id` : Modification POI
- `DELETE /api/poi/:id` : Suppression POI

### Commentaires et Interactions
- `GET /api/poi/:id/comments` : Commentaires d'un POI
- `POST /api/comments` : Création commentaire ou réponse
- `PUT /api/comments/:id` : Modification commentaire
- `POST /api/comments/:id/like` : Like/unlike commentaire
- `POST /api/comments/:id/report` : Signalement commentaire

### Notations
- `POST /api/poi/:id/rate` : Noter un POI (1-5 étoiles)
- `GET /api/poi/:id/ratings` : Détails notations POI
- `GET /api/ratings/top` : Top POI les mieux notés

### Modération
- `GET /api/moderation/pending` : POI en attente d'approbation
- `POST /api/moderation/poi/:id/approve` : Approuver POI
- `POST /api/moderation/poi/:id/reject` : Rejeter POI
- `GET /api/moderation/stats` : Statistiques modération

### Services géographiques
- `GET /api/osm/geocode` : Géocodage adresse
- `GET /api/osm/reverse` : Géocodage inverse
- `POST /api/osm/validate` : Validation adresse
- `GET /api/osm/nearby` : POI OpenStreetMap à proximité

## Sécurité et bonnes pratiques

### Sécurité implémentée
- Hachage bcrypt pour mots de passe (salt rounds: 12)
- Tokens JWT avec expiration configurable
- Validation Joi exhaustive sur toutes les entrées
- Protection CORS configurée
- Headers sécurisés via Helmet
- Upload sécurisé avec validation MIME type
- Rate limiting sur créations de contenu

### Audit et monitoring
- Audit logs automatiques pour actions de modération
- Logging Morgan pour toutes requêtes HTTP
- Gestion d'erreurs centralisée format RFC 7807
- Monitoring des performances de requêtes
- Historique complet des modifications

### Scalabilité et performance
- Pagination cursor-based pour gros volumes
- Index optimisés pour requêtes fréquentes
- Cache OpenStreetMap pour réduire appels externes
- Compression d'images automatique avec Sharp
- Architecture modulaire pour microservices futurs

## Roadmap et extensions futures

### Phase actuelle (Sprints 1-3) - COMPLETÉ
- Système d'authentification et autorisation complet
- CRUD POI avec upload d'images et géolocalisation
- Workflow de modération avec notifications temps réel
- Système de commentaires hiérarchique et notation sociale
- Intégration OpenStreetMap pour validation géographique

### Phase suivante (Sprint 4)
- Système de transport et calcul d'itinéraires
- Dashboard d'administration et analytics avancées
- Application mobile avec React Native
- Système de recommandations basé sur l'IA

### Extensions
- Support multilingue (français, anglais)
- Intégration paiements mobiles (Mobile Money)
- API publique pour développeurs tiers

## Support et contribution

### Environnement de développement
- Node.js 18+ recommandé
- MySQL 8.0+ pour fonctionnalités géospatiales
- Postman pour tests API
- VS Code avec extensions ESLint/Prettier

### Standards de code
- Format Prettier automatique
- Linting ESLint strict
- Git hooks Husky pour qualité
- Tests obligatoires pour nouvelles fonctionnalités
- Documentation JSDoc pour fonctions complexes

### Architecture extensible
La structure modulaire permet l'ajout facile de nouvelles fonctionnalités :
- Nouveaux services dans `/services`
- Nouveaux endpoints dans `/routes` et `/controllers`
- Nouvelles validations dans `/validators`
- Nouveaux modèles dans `/models`

Cette architecture solide garantit la maintenabilité et l'évolution du projet vers une plateforme complète de découverte locale.