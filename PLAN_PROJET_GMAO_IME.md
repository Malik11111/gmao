# PROJET GMAO - Application de Gestion de Maintenance pour IME

## Contexte

Application GMAO (Gestion de Maintenance Assistee par Ordinateur) destinee a un **IME (Institut Medico-Educatif)**. L'objectif est de permettre a tout le personnel de signaler des pannes/problemes sur le materiel en scannant un code-barre/QR code, et d'envoyer une demande d'intervention au service technique qui pourra suivre et traiter les reparations.

**Applications de reference a etudier :**
- Gammeo (specialise medico-social)
- Bob! Desk (etablissements de sante)
- CARL Source (module sante)
- Mobility Work (approche collaborative)
- Grashjs CMMS (open-source, GitHub : github.com/Grashjs/cmms)

---

## 1. Architecture technique

### Stack recommandee

| Composant | Technologie |
|-----------|------------|
| **Frontend Web** | React.js ou Next.js + Tailwind CSS |
| **Frontend Mobile** | React Native (iOS + Android) OU Flutter |
| **Backend / API** | Node.js (Express/Fastify) ou Django REST Framework |
| **Base de donnees** | PostgreSQL |
| **Authentification** | JWT + refresh tokens |
| **Stockage fichiers** | MinIO (self-hosted) ou S3 |
| **Notifications** | Firebase Cloud Messaging (push mobile) + emails |
| **Scanner QR/Code-barre** | react-native-camera / html5-qrcode (web) |
| **Hebergement** | Docker + Docker Compose (self-hosted possible) |

### Architecture

```
[App Mobile] ----\
                  \
                   --> [API REST / GraphQL] --> [PostgreSQL]
                  /                         --> [Stockage Fichiers]
[App Web]   ----/                           --> [Service Notifications]
```

---

## 2. Roles et permissions

| Role | Droits |
|------|--------|
| **Utilisateur (personnel IME)** | Scanner un QR code, voir la fiche materiel, creer une demande d'intervention, suivre ses demandes |
| **Technicien** | Tout ce que fait l'utilisateur + recevoir les interventions, les traiter, cloturer, ajouter des rapports |
| **Responsable technique** | Tout ce que fait le technicien + assigner les interventions, gerer les priorites, valider les clotures |
| **Administrateur** | Acces complet : gestion des utilisateurs, des equipements, du catalogue, des statistiques, configuration |

---

## 3. Modules fonctionnels

### 3.1 - Module Equipements / Materiel

**Objectif :** Inventorier tout le materiel de l'IME avec un QR code unique par equipement.

**Fonctionnalites :**
- Creer / modifier / supprimer un equipement
- Champs d'un equipement :
  - `id` (auto)
  - `nom` (ex: "Lave-linge Buanderie 2")
  - `categorie` (electromenager, informatique, mobilier, vehicule, chauffage, plomberie, electricite, etc.)
  - `localisation` (batiment, etage, salle)
  - `numero_serie`
  - `marque` / `modele`
  - `date_achat`
  - `date_mise_en_service`
  - `date_fin_garantie`
  - `fournisseur`
  - `photo(s)`
  - `documents_attaches` (notice, facture, contrat maintenance)
  - `statut` (en service, en panne, en reparation, hors service, reforme)
  - `qr_code` (genere automatiquement)
- **Generation et impression de QR codes** (etiquettes a coller sur le materiel)
- **Historique complet** de chaque equipement (toutes les interventions passees)
- Recherche et filtrage (par categorie, localisation, statut)
- Import/export CSV pour inventaire initial

### 3.2 - Module Scanner QR Code / Code-barre

**Objectif :** Permettre a n'importe quel membre du personnel de scanner un QR code avec son telephone pour acceder instantanement a la fiche de l'equipement.

**Fonctionnalites :**
- Scan via camera du telephone (app mobile)
- Scan via webcam (version web)
- Au scan :
  1. Affiche la fiche de l'equipement (nom, photo, localisation, statut)
  2. Affiche l'historique recent des interventions
  3. Bouton bien visible : **"Signaler un probleme"**
- Compatibilite QR codes ET codes-barres classiques (EAN-13, Code 128)
- Mode hors-ligne : stocker le scan et l'envoyer quand la connexion revient

### 3.3 - Module Demande d'Intervention (Signalement)

**Objectif :** Permettre au personnel de signaler un probleme simplement et rapidement.

**Workflow :**
```
[Scan QR] --> [Formulaire simplifie] --> [Envoi] --> [Notification service technique]
```

**Formulaire de signalement (simple et rapide) :**
- Equipement : **pre-rempli automatiquement** grace au scan
- Localisation : pre-remplie, modifiable
- Type de probleme (liste) :
  - Panne complete
  - Dysfonctionnement
  - Bruit anormal
  - Fuite
  - Casse / deterioration
  - Autre
- Description libre (champ texte)
- Photo(s) du probleme (prise directe avec la camera)
- Urgence estimee : Normal / Urgent / Tres urgent
- Bouton "Envoyer"

**Apres l'envoi :**
- Confirmation a l'ecran : "Votre signalement a bien ete envoye au service technique"
- Notification push/email au responsable technique
- L'utilisateur peut suivre le statut de sa demande

### 3.4 - Module Gestion des Interventions (Service Technique)

**Objectif :** Permettre au service technique de recevoir, trier, assigner et suivre les interventions.

**Tableau de bord du service technique :**
- Vue "Kanban" avec colonnes :
  - Nouvelles demandes
  - En attente (pieces, prestataire, etc.)
  - En cours
  - Terminee (a valider)
  - Cloturee
- Vue "Liste" avec filtres (date, priorite, categorie, technicien, statut)
- Vue "Calendrier" pour planifier

**Fiche intervention :**
- Informations du signalement (equipement, description, photos, demandeur)
- **Priorite** (attribuee par le responsable) : Basse / Normale / Haute / Critique
- **Technicien assigne**
- **Date d'echeance**
- **Type d'intervention** : Corrective / Preventive / Ameliorative
- **Actions realisees** (champ texte + photos)
- **Pieces utilisees** (lien avec le stock)
- **Temps passe**
- **Cout** (main d'oeuvre + pieces)
- **Commentaires / echanges** entre demandeur et technicien
- **Statut** avec historique des changements

**Notifications automatiques :**
- Nouvelle demande --> responsable technique
- Assignation --> technicien concerne
- Changement de statut --> demandeur initial
- Intervention en retard --> responsable technique

### 3.5 - Module Maintenance Preventive

**Objectif :** Planifier les maintenances regulieres pour eviter les pannes.

**Fonctionnalites :**
- Creer des plans de maintenance preventive :
  - Equipement ou groupe d'equipements
  - Frequence (tous les X jours/semaines/mois)
  - Checklist d'actions a realiser
  - Technicien par defaut
- Generation automatique des ordres d'intervention a la date prevue
- Calendrier de maintenance preventive
- Alertes avant echeance

### 3.6 - Module Stock / Pieces detachees

**Objectif :** Gerer le stock de pieces et fournitures du service technique.

**Fonctionnalites :**
- Catalogue de pieces (nom, reference, fournisseur, prix, quantite en stock)
- Seuil d'alerte stock bas
- Association piece <-> equipement (quelles pieces pour quel materiel)
- Sortie de stock automatique lors de la cloture d'une intervention
- Historique des mouvements de stock

### 3.7 - Module Statistiques / Reporting

**Objectif :** Avoir une vision claire de l'activite de maintenance.

**Tableaux de bord :**
- Nombre d'interventions par periode (jour/semaine/mois)
- Temps moyen de resolution
- Taux de pannes par categorie d'equipement
- Couts de maintenance par equipement / par batiment
- Equipements les plus problematiques (top pannes)
- Charge de travail par technicien
- Respect des delais d'intervention
- Export PDF / Excel des rapports

---

## 4. Interface utilisateur - Maquettes fonctionnelles

### 4.1 - App Mobile (pour tout le personnel)

```
+----------------------------------+
|  GMAO IME              [profil]  |
+----------------------------------+
|                                  |
|     +----------------------+     |
|     |                      |     |
|     |   [ICONE CAMERA]     |     |
|     |                      |     |
|     |  SCANNER UN QR CODE  |     |
|     |                      |     |
|     +----------------------+     |
|                                  |
|  +----------------------------+  |
|  | Mes demandes recentes      |  |
|  +----------------------------+  |
|  | > Lave-linge B2   EN COURS |  |
|  | > PC Salle 4      TERMINE  |  |
|  | > Radiateur Ch.12  NOUVEAU |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
|  [Accueil] [Scanner] [Demandes] |
+----------------------------------+
```

### 4.2 - Ecran apres scan

```
+----------------------------------+
|  < Retour         Equipement     |
+----------------------------------+
|  [PHOTO EQUIPEMENT]              |
|                                  |
|  Lave-linge Miele W1            |
|  Buanderie - Batiment B - RDC    |
|  Statut: EN SERVICE              |
|  En service depuis: 15/03/2023   |
|                                  |
|  Derniere intervention:          |
|  12/01/2026 - Remplacement joint |
|                                  |
|  +----------------------------+  |
|  |                            |  |
|  |  SIGNALER UN PROBLEME     |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  Historique des interventions >  |
+----------------------------------+
```

### 4.3 - Formulaire de signalement

```
+----------------------------------+
|  < Retour     Signaler           |
+----------------------------------+
|                                  |
|  Equipement: Lave-linge Miele   |
|  Lieu: Buanderie - Bat. B       |
|                                  |
|  Type de probleme:              |
|  [v] Panne complete             |
|  [ ] Dysfonctionnement          |
|  [ ] Fuite                      |
|  [ ] Bruit anormal              |
|  [ ] Casse                      |
|  [ ] Autre                      |
|                                  |
|  Description:                   |
|  +----------------------------+ |
|  | Le lave-linge ne demarre   | |
|  | plus, aucun voyant allume  | |
|  +----------------------------+ |
|                                  |
|  Urgence: [Normal] [Urgent]     |
|           [Tres urgent]         |
|                                  |
|  Photos: [+Ajouter photo]      |
|  [photo1.jpg] [photo2.jpg]     |
|                                  |
|  +----------------------------+ |
|  |     ENVOYER LE SIGNALEMENT | |
|  +----------------------------+ |
+----------------------------------+
```

### 4.4 - Dashboard Web (Service Technique)

```
+------------------------------------------------------------------+
|  GMAO IME - Service Technique                    [user] [config] |
+------------------------------------------------------------------+
|         |                                                        |
| MENU    |  TABLEAU DE BORD                                       |
|         |                                                        |
| Accueil |  [12 Nouvelles] [8 En cours] [3 En attente] [45 Total]|
| Interv. |                                                        |
| Equip.  |  INTERVENTIONS RECENTES                                |
| Stock   |  +------+----------+--------+----------+--------+      |
| Planning|  | Prio | Equip.   | Lieu   | Demandeur| Statut |      |
| Stats   |  +------+----------+--------+----------+--------+      |
| Config  |  | !!!  | Ascenseur| Bat A  | M.Dupont | NOUV.  |      |
|         |  | !!   | PC Salle4| Bat B  | S.Martin | COURS  |      |
|         |  | !    | Radiateur| Bat C  | L.Durand | ATTENT |      |
|         |  +------+----------+--------+----------+--------+      |
|         |                                                        |
|         |  STATISTIQUES RAPIDES                                  |
|         |  Temps moyen resolution: 2.3 jours                     |
|         |  Interventions ce mois: 34                             |
|         |  Taux de resolution: 87%                               |
+------------------------------------------------------------------+
```

---

## 5. Modele de base de donnees

### Tables principales

```sql
-- Utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('utilisateur', 'technicien', 'responsable', 'admin') NOT NULL,
    service VARCHAR(100),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Localisations
CREATE TABLE localisations (
    id SERIAL PRIMARY KEY,
    batiment VARCHAR(100) NOT NULL,
    etage VARCHAR(50),
    salle VARCHAR(100),
    description TEXT
);

-- Categories d'equipement
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    icone VARCHAR(50),
    parent_id INTEGER REFERENCES categories(id)
);

-- Equipements
CREATE TABLE equipements (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    categorie_id INTEGER REFERENCES categories(id),
    localisation_id INTEGER REFERENCES localisations(id),
    numero_serie VARCHAR(100),
    marque VARCHAR(100),
    modele VARCHAR(100),
    date_achat DATE,
    date_mise_en_service DATE,
    date_fin_garantie DATE,
    fournisseur VARCHAR(255),
    statut ENUM('en_service', 'en_panne', 'en_reparation', 'hors_service', 'reforme') DEFAULT 'en_service',
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Photos equipements
CREATE TABLE equipement_photos (
    id SERIAL PRIMARY KEY,
    equipement_id INTEGER REFERENCES equipements(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    principale BOOLEAN DEFAULT false
);

-- Documents equipements
CREATE TABLE equipement_documents (
    id SERIAL PRIMARY KEY,
    equipement_id INTEGER REFERENCES equipements(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- notice, facture, contrat, etc.
    url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Demandes d'intervention (signalements)
CREATE TABLE demandes (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) UNIQUE NOT NULL, -- ex: DI-2026-001
    equipement_id INTEGER REFERENCES equipements(id),
    demandeur_id INTEGER REFERENCES users(id),
    localisation_id INTEGER REFERENCES localisations(id),
    type_probleme ENUM('panne', 'dysfonctionnement', 'bruit', 'fuite', 'casse', 'autre') NOT NULL,
    description TEXT NOT NULL,
    urgence ENUM('normal', 'urgent', 'tres_urgent') DEFAULT 'normal',
    statut ENUM('nouvelle', 'prise_en_compte', 'en_attente', 'en_cours', 'terminee', 'cloturee', 'rejetee') DEFAULT 'nouvelle',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Photos des demandes
CREATE TABLE demande_photos (
    id SERIAL PRIMARY KEY,
    demande_id INTEGER REFERENCES demandes(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL
);

-- Interventions (traitement par le service technique)
CREATE TABLE interventions (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) UNIQUE NOT NULL, -- ex: IT-2026-001
    demande_id INTEGER REFERENCES demandes(id),
    equipement_id INTEGER REFERENCES equipements(id),
    technicien_id INTEGER REFERENCES users(id),
    responsable_id INTEGER REFERENCES users(id),
    type_intervention ENUM('corrective', 'preventive', 'ameliorative') DEFAULT 'corrective',
    priorite ENUM('basse', 'normale', 'haute', 'critique') DEFAULT 'normale',
    description_travaux TEXT,
    actions_realisees TEXT,
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    date_echeance DATE,
    temps_passe_minutes INTEGER,
    cout_main_oeuvre DECIMAL(10,2),
    cout_pieces DECIMAL(10,2),
    cout_externe DECIMAL(10,2),
    statut ENUM('planifiee', 'en_cours', 'en_attente_pieces', 'en_attente_prestataire', 'terminee', 'cloturee') DEFAULT 'planifiee',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Photos des interventions (avant/apres)
CREATE TABLE intervention_photos (
    id SERIAL PRIMARY KEY,
    intervention_id INTEGER REFERENCES interventions(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    type ENUM('avant', 'apres', 'pendant') DEFAULT 'pendant'
);

-- Commentaires / echanges sur une demande
CREATE TABLE commentaires (
    id SERIAL PRIMARY KEY,
    demande_id INTEGER REFERENCES demandes(id) ON DELETE CASCADE,
    auteur_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historique des changements de statut
CREATE TABLE historique_statuts (
    id SERIAL PRIMARY KEY,
    entite_type ENUM('demande', 'intervention') NOT NULL,
    entite_id INTEGER NOT NULL,
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50) NOT NULL,
    utilisateur_id INTEGER REFERENCES users(id),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance preventive (plans)
CREATE TABLE plans_preventifs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    equipement_id INTEGER REFERENCES equipements(id),
    frequence_jours INTEGER NOT NULL,
    checklist JSONB, -- liste des actions a realiser
    technicien_defaut_id INTEGER REFERENCES users(id),
    prochaine_echeance DATE NOT NULL,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Stock / Pieces detachees
CREATE TABLE pieces (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    reference VARCHAR(100),
    fournisseur VARCHAR(255),
    prix_unitaire DECIMAL(10,2),
    quantite_stock INTEGER DEFAULT 0,
    seuil_alerte INTEGER DEFAULT 5,
    localisation_stock VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Association pieces <-> equipements
CREATE TABLE pieces_equipements (
    piece_id INTEGER REFERENCES pieces(id),
    equipement_id INTEGER REFERENCES equipements(id),
    PRIMARY KEY (piece_id, equipement_id)
);

-- Mouvements de stock
CREATE TABLE mouvements_stock (
    id SERIAL PRIMARY KEY,
    piece_id INTEGER REFERENCES pieces(id),
    intervention_id INTEGER REFERENCES interventions(id),
    type_mouvement ENUM('entree', 'sortie') NOT NULL,
    quantite INTEGER NOT NULL,
    utilisateur_id INTEGER REFERENCES users(id),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    destinataire_id INTEGER REFERENCES users(id),
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lue BOOLEAN DEFAULT false,
    type VARCHAR(50), -- demande, intervention, stock, preventif
    lien VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. API REST - Endpoints principaux

### Authentification
```
POST   /api/auth/login          -- Connexion
POST   /api/auth/logout         -- Deconnexion
POST   /api/auth/refresh        -- Rafraichir le token
GET    /api/auth/me             -- Profil utilisateur connecte
```

### Equipements
```
GET    /api/equipements              -- Liste (avec filtres, pagination)
GET    /api/equipements/:id          -- Detail d'un equipement
GET    /api/equipements/qr/:code     -- Recherche par QR code (utilise par le scanner)
POST   /api/equipements              -- Creer un equipement (admin)
PUT    /api/equipements/:id          -- Modifier (admin)
DELETE /api/equipements/:id          -- Supprimer (admin)
GET    /api/equipements/:id/historique  -- Historique des interventions
POST   /api/equipements/:id/qrcode  -- Generer/regenerer QR code
POST   /api/equipements/import       -- Import CSV
GET    /api/equipements/export       -- Export CSV
```

### Demandes d'intervention
```
GET    /api/demandes                 -- Liste (filtres par statut, date, etc.)
GET    /api/demandes/:id             -- Detail
POST   /api/demandes                 -- Creer une demande (tout utilisateur)
PUT    /api/demandes/:id             -- Modifier
PUT    /api/demandes/:id/statut      -- Changer le statut
GET    /api/demandes/mes-demandes    -- Demandes de l'utilisateur connecte
POST   /api/demandes/:id/commentaires -- Ajouter un commentaire
POST   /api/demandes/:id/photos      -- Ajouter des photos
```

### Interventions
```
GET    /api/interventions            -- Liste (filtres)
GET    /api/interventions/:id        -- Detail
POST   /api/interventions            -- Creer (depuis une demande)
PUT    /api/interventions/:id        -- Modifier
PUT    /api/interventions/:id/statut -- Changer le statut
PUT    /api/interventions/:id/assigner -- Assigner un technicien
GET    /api/interventions/planning   -- Vue calendrier
GET    /api/interventions/mes-interventions -- Pour le technicien connecte
```

### Stock
```
GET    /api/pieces                   -- Liste des pieces
POST   /api/pieces                   -- Ajouter une piece
PUT    /api/pieces/:id               -- Modifier
POST   /api/pieces/:id/mouvement    -- Entree/sortie de stock
GET    /api/pieces/alertes           -- Pieces sous le seuil
```

### Statistiques
```
GET    /api/stats/dashboard          -- KPIs du tableau de bord
GET    /api/stats/interventions      -- Stats interventions (par periode)
GET    /api/stats/equipements        -- Stats par equipement
GET    /api/stats/techniciens        -- Charge par technicien
GET    /api/stats/couts              -- Analyse des couts
GET    /api/stats/export             -- Export PDF/Excel
```

### Maintenance preventive
```
GET    /api/preventif                -- Liste des plans
POST   /api/preventif                -- Creer un plan
PUT    /api/preventif/:id            -- Modifier
DELETE /api/preventif/:id            -- Supprimer
GET    /api/preventif/echeances      -- Prochaines echeances
```

---

## 7. Fonctionnalites techniques importantes

### 7.1 - Securite
- Authentification JWT avec refresh tokens
- Hashage des mots de passe (bcrypt)
- Rate limiting sur les endpoints
- Validation des entrees (sanitization)
- CORS configure pour les domaines autorises
- HTTPS obligatoire
- Roles et permissions verifies cote serveur sur chaque endpoint
- Protection CSRF
- Logs d'audit des actions sensibles

### 7.2 - Notifications
- **Push mobile** : Firebase Cloud Messaging
- **Email** : Nodemailer avec templates HTML
- **In-app** : Systeme de notifications internes (cloche en haut a droite)
- **Configurables** : Chaque utilisateur peut choisir quelles notifications recevoir

### 7.3 - Mode hors-ligne (Mobile)
- Cache local des equipements et localisations
- File d'attente des demandes creees hors-ligne
- Synchronisation automatique au retour de la connexion
- Indicateur visuel du mode hors-ligne

### 7.4 - QR Codes
- Generation : bibliotheque `qrcode` (Node.js) ou `python-qrcode`
- Format : QR code contenant l'URL de l'equipement (ex: `https://gmao.monime.fr/scan/EQ-00042`)
- Impression : generation d'etiquettes PDF (format standard, compatible imprimante d'etiquettes)
- Scan : `react-native-camera` + `react-native-qrcode-scanner` (mobile) / `html5-qrcode` (web)

### 7.5 - Accessibilite
- Interface simple et intuitive (le personnel n'est pas forcement technique)
- Gros boutons sur mobile
- Contraste eleve
- Tailles de police adaptees
- Minimum d'etapes pour signaler un probleme (3 clics max : scan > formulaire > envoyer)

---

## 8. Plan de developpement (Phases)

### Phase 1 - MVP (4-6 semaines)
**Objectif : version utilisable minimum**
- [ ] Setup projet (backend + frontend web + app mobile)
- [ ] Authentification (login/logout, gestion des roles)
- [ ] CRUD Equipements (creer, modifier, lister, voir)
- [ ] Generation QR codes
- [ ] Scanner QR code (mobile)
- [ ] Formulaire de signalement (demande d'intervention)
- [ ] Liste des demandes (cote service technique)
- [ ] Changement de statut des demandes
- [ ] Notifications basiques (email)

### Phase 2 - Gestion complete (3-4 semaines)
- [ ] Module interventions complet (assignation, suivi, cloture)
- [ ] Vue Kanban des interventions
- [ ] Commentaires et echanges sur les demandes
- [ ] Photos (upload depuis camera)
- [ ] Notifications push mobile
- [ ] Historique complet des equipements

### Phase 3 - Avance (3-4 semaines)
- [ ] Maintenance preventive (plans, generation automatique)
- [ ] Gestion du stock de pieces
- [ ] Statistiques et tableaux de bord
- [ ] Export PDF/Excel
- [ ] Mode hors-ligne (mobile)

### Phase 4 - Ameliorations (continu)
- [ ] Import CSV d'equipements
- [ ] Scanner code-barres (en plus des QR codes)
- [ ] Multi-sites (si l'IME a plusieurs etablissements)
- [ ] Integration avec un annuaire LDAP/AD
- [ ] Application PWA (Progressive Web App) comme alternative au natif
- [ ] Gestion des prestataires externes

---

## 9. Donnees de test / Seed

Pour demarrer avec des donnees realistes dans un IME :

### Categories d'equipement
- Electromenager (lave-linge, seche-linge, lave-vaisselle, four, refrigerateur)
- Informatique (PC, imprimante, videoprojecteur, tablette)
- Mobilier (bureau, chaise, armoire, lit)
- Chauffage/Climatisation (radiateur, chaudiere, climatiseur)
- Plomberie (robinet, WC, chauffe-eau, ballon d'eau chaude)
- Electricite (eclairage, prises, tableau electrique)
- Vehicules (minibus, voiture de service)
- Espaces verts (tondeuse, taille-haie, arrosage)
- Securite (alarme incendie, extincteur, porte coupe-feu)
- Medical/Paramédical (fauteuil roulant, lit medicalise, materiel kine)

### Localisations types IME
- Batiment administratif (bureau direction, secretariat, salle reunion)
- Batiment pedagogique (salles de classe, salles d'activite, atelier)
- Batiment hebergement (chambres, salles de bain, espaces communs)
- Espaces communs (cantine, cuisine, buanderie, salle de sport)
- Exterieur (parking, jardin, cours, terrain de sport)

---

## 10. Prompt a donner a une IA pour generer le code

Voici un prompt optimise que tu peux donner directement a Claude, ChatGPT, ou Cursor :

---

### PROMPT DE GENERATION

```
Tu es un developpeur fullstack senior. Cree une application GMAO (Gestion de Maintenance
Assistee par Ordinateur) complete pour un IME (Institut Medico-Educatif).

STACK TECHNIQUE :
- Backend : Node.js avec Express.js, PostgreSQL, Prisma ORM
- Frontend Web : Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- Frontend Mobile : React Native avec Expo
- Auth : JWT avec refresh tokens
- Upload fichiers : Multer + stockage local (configurable S3)
- QR Codes : bibliotheque qrcode pour generation, html5-qrcode pour scan web,
  expo-camera + expo-barcode-scanner pour mobile

FONCTIONNALITES A IMPLEMENTER (dans cet ordre) :

1. AUTHENTIFICATION
   - Login par email/mot de passe
   - 4 roles : utilisateur, technicien, responsable, admin
   - Middleware de verification des roles sur chaque route
   - JWT access token (15min) + refresh token (7 jours)

2. GESTION DES EQUIPEMENTS
   - CRUD complet avec photos et documents
   - Champs : nom, categorie, localisation (batiment/etage/salle), numero serie,
     marque, modele, dates (achat, mise en service, fin garantie), fournisseur, statut
   - Generation automatique de QR code unique a la creation
   - Endpoint GET /api/equipements/qr/:code pour le scan
   - Historique de toutes les interventions sur un equipement

3. SCANNER QR CODE
   - Sur mobile : ouvrir la camera, scanner, afficher la fiche equipement
   - Sur web : utiliser la webcam ou saisir le code manuellement
   - Apres scan : afficher fiche + bouton "Signaler un probleme"

4. DEMANDES D'INTERVENTION
   - Formulaire simple : equipement (pre-rempli si scan), type de probleme
     (liste deroulante), description, photos, niveau d'urgence
   - Statuts : nouvelle > prise en compte > en attente > en cours > terminee > cloturee
   - Notifications email au service technique a chaque nouvelle demande
   - L'utilisateur peut suivre le statut de ses demandes

5. GESTION DES INTERVENTIONS (service technique)
   - Vue Kanban drag & drop par statut
   - Assignation a un technicien
   - Priorite, date echeance, temps passe, cout
   - Rapport d'intervention (actions realisees, photos avant/apres)
   - Commentaires entre demandeur et technicien

6. STATISTIQUES
   - Dashboard avec KPIs : nombre interventions, temps moyen resolution,
     equipements les plus problematiques, charge par technicien
   - Graphiques avec Recharts ou Chart.js

CONTRAINTES IMPORTANTES :
- Interface TRES simple et accessible (le personnel n'est pas informaticien)
- Design mobile-first pour l'app mobile
- Maximum 3 etapes pour signaler un probleme (scan > formulaire > envoyer)
- Gros boutons, texte lisible, interface epuree
- Code bien structure, commente, avec gestion d'erreurs
- Validation des donnees cote client ET serveur
- Seeds avec des donnees realistes d'IME

Commence par creer la structure du projet, puis implemente module par module
dans l'ordre indique.
```

---

## 11. Applications existantes a etudier (references)

| Application | Interet | Site |
|-------------|---------|------|
| **Gammeo** | Specialise medico-social, QR code integre | gammeo.com |
| **Bob! Desk** | Simple, adapte sante, bon workflow | bob-desk.fr |
| **CARL Source** | Entreprise, module sante complet | carl-software.com |
| **Mobility Work** | Approche collaborative/social | mobility-work.com |
| **Grashjs CMMS** | Open-source, web + mobile | github.com/Grashjs/cmms |
| **Atlas CMMS** | Open-source, complet | atlas-cmms.com |
| **MaintainX** | Excellente UX mobile, QR code | getmaintainx.com |
| **UpKeep** | Reference GMAO mobile | upkeep.com |

---

## 12. Estimation budgetaire (si developpement externe)

| Option | Description | Cout estime |
|--------|-------------|-------------|
| **Open-source adapte** | Prendre Grashjs/Atlas CMMS et personnaliser | 2 000 - 5 000 EUR |
| **Dev freelance** | Developpeur fullstack, MVP en 2-3 mois | 8 000 - 15 000 EUR |
| **Agence** | Equipe complete, app sur mesure | 20 000 - 50 000 EUR |
| **SaaS existant** | Gammeo, Bob! Desk (abonnement) | 50 - 200 EUR / mois |
| **Dev par IA** | Utiliser Claude/Cursor pour generer le code | Quasi gratuit (temps) |

---

**Document cree pour le projet GMAO IME**
**A utiliser comme cahier des charges pour le developpement**
