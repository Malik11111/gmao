# CONTEXT - Projet GMAO IME

> Lis ce fichier pour tout savoir sur le projet avant d'intervenir.

---

## 1. Presentation generale

Application **GMAO (Gestion de Maintenance Assistee par Ordinateur)** destinee a un **IME (Institut Medico-Educatif)**. Elle permet :
- Au **personnel** de signaler des pannes en scannant un QR code sur un equipement
- Au **service technique** de recevoir, traiter et suivre les interventions
- Aux **responsables** de piloter la maintenance et consulter les statistiques

Le projet est heberge sur **Railway** (PostgreSQL + Next.js).

---

## 2. Stack technique

| Element | Technologie |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| ORM | Prisma 6 |
| Base de donnees | PostgreSQL (Railway) |
| Auth | JWT via `jose`, cookie `gmao_session` (24h), bcryptjs |
| Icons | lucide-react |
| Charts | recharts |
| QR Code | bibliotheque `qrcode` |
| 3D | three.js (page QR scan) |
| Export | exceljs |
| Validation | zod 4 |
| Deploiement | Railway (nixpacks, `npm run build` / `npm run start`) |

> IMPORTANT : Ce projet utilise **Next.js 16** avec des breaking changes. Lire `node_modules/next/dist/docs/` avant toute modification.

---

## 3. Structure des dossiers

```
/gmao
├── prisma/
│   ├── schema.prisma        # Schema BDD complet
│   ├── seed.ts              # Donnees initiales
│   └── seed-history.ts      # Historique de seed
├── src/
│   ├── app/
│   │   ├── actions.ts       # TOUTES les Server Actions (auth, CRUD, etc.)
│   │   ├── globals.css
│   │   ├── layout.tsx       # Layout racine
│   │   ├── login/           # Page de connexion
│   │   ├── scan/[code]/     # Page publique apres scan QR
│   │   ├── api/             # Routes API (voir section 6)
│   │   └── (portal)/        # Pages protegees (voir section 5)
│   ├── components/          # Composants UI (voir section 7)
│   ├── lib/
│   │   ├── session.ts       # Auth JWT, requireUser(), requireRole()
│   │   ├── db.ts            # Instance Prisma singleton
│   │   ├── labels.ts        # Labels FR pour tous les enums Prisma
│   │   ├── ids.ts           # Generation codes equipements et numeros demandes
│   │   ├── uploads.ts       # Gestion upload fichiers/photos
│   │   ├── excel.ts         # Export Excel
│   │   └── utils.ts         # Utilitaires divers
│   └── middleware.ts        # Middleware Next.js (protection routes)
├── PLAN_PROJET_GMAO_IME.md  # Cahier des charges complet
├── CONTEXT.md               # Ce fichier
├── railway.toml             # Config deploiement Railway
├── next.config.ts
└── package.json
```

---

## 4. Schema de base de donnees (Prisma)

### Enums

| Enum | Valeurs |
|---|---|
| `Role` | USER, TECHNICIAN, MANAGER, ADMIN, SUPER_ADMIN |
| `EquipmentStatus` | IN_SERVICE, OUT_OF_ORDER, IN_REPAIR, OUT_OF_SERVICE, RETIRED |
| `RequestIssueType` | COMPLETE_FAILURE, MALFUNCTION, ABNORMAL_NOISE, LEAK, BREAKAGE, OTHER |
| `RequestUrgency` | NORMAL, URGENT, CRITICAL |
| `RequestStatus` | NEW, ACKNOWLEDGED, WAITING, IN_PROGRESS, DONE, CLOSED, REJECTED, ARCHIVED |
| `TaskType` | RONDE, PREVENTIF, TACHE_LIBRE, ACCOMPAGNEMENT_EXTERNE |
| `TaskStatus` | A_FAIRE, EN_COURS, FAIT |
| `TimeSlot` | MATIN, APRES_MIDI |

### Modeles principaux

- **Establishment** : etablissement (multi-sites), relie a tout le reste
- **User** : utilisateur avec role, rattache a un etablissement
- **Location** : localisation (batiment / etage / salle), unique par etablissement
- **EquipmentCategory** : categorie d'equipement, peut etre `isExternal` (prestataire externe avec nom/tel/email), peut avoir des `specialists` (techniciens)
- **Equipment** : equipement avec `code` unique, `qrCode` unique, statut, photos (JSON), documents (JSON)
- **Request** : demande d'intervention, peut etre liee a un equipement OU etre une anomalie libre (`anomalyLabel`), avec assignation automatique au technicien specialiste de la categorie
- **RequestComment** : commentaires sur une demande
- **StatusHistory** : historique des changements de statut d'une demande
- **Notification** : notifications in-app par utilisateur
- **MaintenancePlan** : plan de maintenance preventive (intervalle en jours, prochaine echeance)
- **Task** : tache planifiee (ronde, preventif, tache libre, accompagnement externe) avec creneau matin/apres-midi

---

## 5. Pages (portal)

Toutes les pages sous `src/app/(portal)/` sont protegees par `requireUser()`.

| Route | Description | Roles |
|---|---|---|
| `/` | Tableau de bord (KPIs) | TECHNICIAN, MANAGER, ADMIN, SUPER_ADMIN |
| `/equipements` | Liste des equipements | Tous |
| `/equipements/new` | Creer un equipement | MANAGER, ADMIN, SUPER_ADMIN |
| `/equipements/[id]` | Detail equipement | Tous |
| `/equipements/[id]/edit` | Modifier equipement | MANAGER, ADMIN, SUPER_ADMIN |
| `/equipements/[id]/qr-print` | Impression QR code | MANAGER, ADMIN, SUPER_ADMIN |
| `/demandes` | Liste des demandes | Tous |
| `/demandes/[id]` | Detail d'une demande | Tous |
| `/demandes/kanban` | Vue kanban | TECHNICIAN, MANAGER, ADMIN, SUPER_ADMIN |
| `/demandes/archives` | Archives | MANAGER, ADMIN, SUPER_ADMIN |
| `/signaler/[equipmentId]` | Signaler un probleme sur un equipement | Tous |
| `/signaler/anomalie` | Signaler une anomalie libre (sans equipement) | Tous |
| `/planning` | Planning general | MANAGER, ADMIN |
| `/planning/today` | Mon planning du jour | TECHNICIAN |
| `/maintenance` | Plans de maintenance preventive | MANAGER, ADMIN |
| `/maintenance/new` | Nouveau plan preventif | MANAGER, ADMIN |
| `/maintenance/planning` | Planning annuel maintenance | MANAGER, ADMIN |
| `/statistiques` | Stats generales | TECHNICIAN, MANAGER, ADMIN, SUPER_ADMIN |
| `/statistiques/analytics` | Analytics avancees | MANAGER, ADMIN, SUPER_ADMIN |
| `/notifications` | Notifications | Tous |
| `/admin/utilisateurs` | Gestion utilisateurs | ADMIN, SUPER_ADMIN |
| `/admin/utilisateurs/new` | Creer utilisateur | ADMIN, SUPER_ADMIN |
| `/admin/utilisateurs/[id]/edit` | Modifier utilisateur | ADMIN, SUPER_ADMIN |
| `/admin/categories` | Gestion categories | ADMIN |
| `/admin/categories/new` | Creer categorie | ADMIN |
| `/admin/categories/[id]/edit` | Modifier categorie | ADMIN |
| `/admin/etablissements` | Gestion etablissements | SUPER_ADMIN |
| `/admin/etablissements/new` | Creer etablissement | SUPER_ADMIN |
| `/admin/etablissements/[id]/edit` | Modifier etablissement | SUPER_ADMIN |

### Pages publiques
- `/login` : connexion
- `/scan/[code]` : page publique apres scan QR (affiche fiche equipement + bouton signaler)

---

## 6. Routes API

| Route | Description |
|---|---|
| `GET /api/search` | Recherche globale (equipements + demandes) |
| `GET /api/equipment-info/[id]` | Info equipement (pour le scan QR) |
| `GET /api/qrcode/[code]` | Generation image QR code |
| `POST /api/comments` | Ajouter un commentaire sur une demande |
| `POST /api/notifications/read` | Marquer notifications comme lues |
| `POST /api/kanban-update` | Mise a jour statut depuis kanban (drag & drop) |
| `POST /api/planning-update` | Mise a jour tache depuis planning |
| `GET /api/demandes/export` | Export Excel des demandes |
| `GET /api/equipements/export` | Export Excel des equipements |
| `GET /api/cron/archive` | Archivage automatique des demandes terminees (cron) |

---

## 7. Composants principaux

| Composant | Role |
|---|---|
| `app-shell.tsx` | Shell principal : sidebar desktop + topbar mobile, navigation selon role |
| `kanban-board.tsx` | Vue kanban drag & drop des demandes |
| `planning-grid.tsx` | Grille planning semaine avec drag & drop |
| `planning-sidebar.tsx` | Sidebar du planning |
| `daily-task-list.tsx` | Liste des taches du jour (technicien) |
| `create-task-form.tsx` | Formulaire creation tache |
| `stat-card.tsx` | Carte KPI pour tableaux de bord |
| `stats-charts.tsx` | Graphiques statistiques (recharts) |
| `analytics-charts.tsx` | Graphiques analytics avances |
| `qr-scanner.tsx` | Scanner QR code via webcam |
| `qr-mobile-small.tsx` | Bouton scanner QR (mobile) |
| `qr-particles.tsx` | Animation 3D Three.js sur page scan |
| `comment-form.tsx` | Formulaire ajout commentaire |
| `category-form.tsx` | Formulaire categorie |
| `status-badge.tsx` | Badge statut colore |
| `global-search.tsx` | Barre de recherche globale |
| `notification-link.tsx` | Lien notification avec badge |
| `page-header.tsx` | En-tete de page standard |
| `mobile-menu.tsx` | Menu navigation mobile |
| `nav-link.tsx` | Lien sidebar actif/inactif |

---

## 8. Logique metier importante

### Authentification
- Cookie `gmao_session` (JWT HS256, 24h)
- `requireUser()` : redirige vers `/login` si non connecte ou compte inactif
- `requireRole(roles[])` : redirige vers `/` si role non autorise
- `canManageEquipment(role)` : SUPER_ADMIN, ADMIN, MANAGER
- `canOperateRequests(role)` : SUPER_ADMIN, ADMIN, MANAGER, TECHNICIAN

### Navigation selon role
- **USER** : Equipements, Demandes, Notifications (pas de tableau de bord)
- **TECHNICIAN** : + Mon planning, Vue Kanban, Statistiques
- **MANAGER** : + Planning, Maintenance preventive, Planning annuel, Archives, Analytics
- **ADMIN** : + Categories, Utilisateurs
- **SUPER_ADMIN** : seulement Etablissements + Utilisateurs (pas d'acces aux modules operationnels)

### Creation d'une demande (signalement)
1. Scan QR code → page `/scan/[code]` → bouton "Signaler"
2. Formulaire `/signaler/[equipmentId]`
3. A la creation : assignation automatique au technicien specialiste de la categorie de l'equipement
4. Si categorie `isExternal` → pas d'assignation interne, note "prestataire externe"
5. Notifications crees automatiquement (technicien assigne + tous les MANAGER/ADMIN)

### Codes et numeros
- Equipements : format `EQ-[etablissement]-XXXX` (genere par `lib/ids.ts`)
- Demandes : format `DI-YYYY-XXXXX` (genere par `lib/ids.ts`)

### Multi-etablissements
- Chaque entite (User, Equipment, Location, Category, Request, Task...) est rattachee a un `establishmentId`
- SUPER_ADMIN gere les etablissements mais n'a pas acces aux donnees operationnelles

---

## 9. Variables d'environnement requises

```
DATABASE_URL=postgresql://...  # URL Railway PostgreSQL
JWT_SECRET=...                 # Secret JWT (obligatoire)
```

---

## 10. Commandes utiles

```bash
npm run dev          # Developpement local
npm run build        # Build production
npm run start        # Start prod (fait prisma db push avant)
npm run db:push      # Synchroniser schema Prisma → BDD
npm run db:seed      # Peupler la BDD avec des donnees de test
npm run db:studio    # Interface graphique Prisma Studio
```

---

## 11. Deploiement Railway

- Builder : Nixpacks
- Build : `npm run build`
- Start : `prisma db push && next start`
- Restart : ON_FAILURE, max 3 retries
- Fichier config : `railway.toml`

---

## 12. Branche de travail Git

Branche de developpement : `claude/review-gmao-folder-2euVC`
Repository : `malik11111/gmao`

---

## 13. Points d'attention / A savoir

- Next.js 16 a des breaking changes vs les versions precedentes → toujours lire `node_modules/next/dist/docs/` avant de coder
- Les Server Actions sont toutes dans `src/app/actions.ts`
- Les uploads de photos sont geres par `lib/uploads.ts` (stockage local)
- Les labels FR de tous les enums sont dans `lib/labels.ts`
- Le style utilise Tailwind CSS 4 (syntaxe differente de Tailwind 3)
- Pas de module Stock/Pieces dans l'implementation actuelle (prevu dans le plan mais non code)
- Les photos et documents des equipements sont stockes en `Json` dans Prisma (pas de table separee)
