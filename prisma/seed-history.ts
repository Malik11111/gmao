import { PrismaClient, RequestIssueType, RequestStatus, RequestUrgency } from "@prisma/client";

const prisma = new PrismaClient();

// Equipements IME (etab1)
const ETAB1 = "cmmxejqbs0001gqlc4whzp512";
const ETAB2 = "cmmxejq790000gqlciofg95oe";

const equipments = [
  { id: "cmmxejrbn001zgqlct74u5hq0", name: "Lave-linge Miele W1", locationId: "cmmxejqob000pgqlcla9wn19r", etab: ETAB1, freq: 6 },
  { id: "cmmxejrdn0021gqlclbmgl3an", name: "PC Salle 4", locationId: "cmmxejqob000sgqlcuxsculn6", etab: ETAB1, freq: 3 },
  { id: "cmmxejrf20023gqlcdxdm2zcb", name: "Radiateur Chambre 12", locationId: "cmmxejqob000rgqlcq78sdzzp", etab: ETAB1, freq: 8, seasonal: "winter" },
  { id: "cmmxejrh10025gqlcyfyd0rqw", name: "Robinet accueil", locationId: "cmmxejqob000vgqlcfdoiz2p3", etab: ETAB1, freq: 4 },
  { id: "cmmxejrin0027gqlcxs3f655p", name: "Ascenseur principal", locationId: "cmmxejqob000xgqlcy79o1s0y", etab: ETAB1, freq: 5 },
  { id: "cmmxejrl70029gqlcufobev5a", name: "Climatisation Urgences", locationId: "cmmxejqob000ugqlcjn8j8jcb", etab: ETAB1, freq: 7, seasonal: "summer" },
  { id: "cmmxejrml002bgqlcoy1vowro", name: "Lit medicalise Chambre 12", locationId: "cmmxejqob000rgqlcq78sdzzp", etab: ETAB1, freq: 2 },
  { id: "cmmxejrnj002dgqlc4gaus1e6", name: "Extincteur Hall RDC", locationId: "cmmxejqob000vgqlcfdoiz2p3", etab: ETAB1, freq: 1 },
  { id: "cmn27xfwa0003md1ydxsihrie", name: "Climatiseur Salle Reunion A", locationId: "cmn27xfve0001md1yt5fxwjpf", etab: ETAB1, freq: 5, seasonal: "summer" },
  { id: "cmmxejrov002fgqlc9gfzczvl", name: "ECG Philips PageWriter", locationId: "cmmxejqpu0011gqlc3jr2hii5", etab: ETAB2, freq: 4 },
  { id: "cmmxejrqa002hgqlctnzcu2bm", name: "Climatisation Bloc Op 1", locationId: "cmmxejqpu0015gqlcb31dob30", etab: ETAB2, freq: 6, seasonal: "summer" },
  { id: "cmmxejrta002jgqlccnzrrcsi", name: "Armoire refrigeree Pharmacie", locationId: "cmmxejqpu0013gqlcwo0yzciv", etab: ETAB2, freq: 3 },
];

const techsEtab1 = [
  "cmmxejqd10005gqlcb8tg1xt0", // Karim - elec
  "cmmxejqhr0009gqlckkxan6q4", // Thomas - info
  "cmmxejqli000dgqlc3w5g10qs", // Sonia - plomberie
];
const techsEtab2 = ["cmmxejqni000lgqlcjhtvdc95"]; // Ahmed

const requestersEtab1 = [
  "cmmxejqd10004gqlcnq15e13m", // Julie
  "cmmxejqhs000bgqlcdhvi09fr", // Marc
];
const requestersEtab2 = [
  "cmmxejqni000igqlc78wm0ki6", // Sophie
  "cmmxejqni000jgqlcdiyznxne", // Nathalie
];

const issueTypes: RequestIssueType[] = ["COMPLETE_FAILURE", "MALFUNCTION", "ABNORMAL_NOISE", "LEAK", "BREAKAGE", "OTHER"];

const descriptions: Record<string, string[]> = {
  "Lave-linge Miele W1": [
    "Le tambour ne tourne plus, bruit metallique au demarrage.",
    "Fuite d'eau importante sous la machine pendant le cycle.",
    "L'essorage ne fonctionne plus, le linge reste trempe.",
    "Odeur de brule lors du lancement du programme 60C.",
    "Le hublot ne se verrouille plus, impossible de lancer un cycle.",
    "Erreur E04 sur l'ecran, la machine s'arrete en plein cycle.",
  ],
  "PC Salle 4": [
    "Ecran bleu au demarrage, impossible d'acceder au bureau.",
    "L'ordinateur est extremement lent, les applications ne repondent plus.",
    "Le clavier ne repond plus, touches bloquees.",
  ],
  "Radiateur Chambre 12": [
    "Le radiateur reste froid malgre le thermostat au maximum.",
    "Bruit de claquement dans le radiateur la nuit.",
    "Fuite au niveau du raccord du radiateur.",
    "Le thermostat semble decalibre, surchauffe dans la piece.",
    "Le radiateur chauffe par intermittence, s'arrete tout seul.",
    "Odeur inhabituelle quand le radiateur est en marche.",
    "Le radiateur fuit au niveau de la purge.",
    "Pas de chauffage dans la chambre depuis ce matin.",
  ],
  "Robinet accueil": [
    "Le robinet goutte en permanence meme quand il est ferme.",
    "Debit d'eau tres faible, presque pas de pression.",
    "Eau chaude ne fonctionne plus au robinet.",
    "Le mitigeur est bloque, impossible de regler la temperature.",
  ],
  "Ascenseur principal": [
    "L'ascenseur s'arrete entre deux etages, les portes ne s'ouvrent pas.",
    "Bruit anormal de grincement dans la cage d'ascenseur.",
    "Le bouton d'appel du RDC ne repond plus.",
    "Les portes se ferment trop rapidement, dangeureux pour les residents.",
    "L'eclairage de la cabine ne fonctionne plus.",
  ],
  "Climatisation Urgences": [
    "La climatisation ne demarre plus, temperature monte dans le service.",
    "Bruit de vibration important au niveau de l'unite exterieure.",
    "Fuite de condensat sous l'unite interieure.",
    "La climatisation souffle de l'air chaud au lieu de refroidir.",
    "Mauvaise odeur quand la climatisation est en marche.",
    "La temperature ne descend pas en dessous de 26C malgre la consigne a 22C.",
    "L'unite exterieure givre anormalement.",
  ],
  "Lit medicalise Chambre 12": [
    "Le moteur de relevage du dossier ne repond plus.",
    "Les freins des roues ne bloquent plus correctement.",
  ],
  "Extincteur Hall RDC": [
    "Le manometre indique une pression insuffisante.",
  ],
  "Climatiseur Salle Reunion A": [
    "Le climatiseur fait un bruit de claquement au demarrage.",
    "Pas de froid, l'air souffle a temperature ambiante.",
    "La telecommande ne repond plus, impossible de changer les reglages.",
    "Fuite d'eau au niveau du bac de condensation.",
    "Le climatiseur s'arrete tout seul apres 10 minutes.",
  ],
  "ECG Philips PageWriter": [
    "L'ecran affiche des artefacts sur les derivations precordiales.",
    "Le papier d'impression se bloque regulierement.",
    "L'appareil ne s'allume plus, meme sur secteur.",
    "Les cables des electrodes sont uses, mauvais contact.",
  ],
  "Climatisation Bloc Op 1": [
    "Temperature monte a 23C au lieu de 19C dans le bloc.",
    "L'unite fait un bruit anormal de vibration.",
    "Variation de temperature non maitrisee pendant les interventions.",
    "Debit d'air insuffisant, les chirurgiens se plaignent.",
    "Filtre encrasse, air de mauvaise qualite.",
    "Panne complete de la climatisation du bloc.",
  ],
  "Armoire refrigeree Pharmacie": [
    "La temperature est montee a 12C, medicaments a risque.",
    "L'alarme de temperature sonne sans raison apparente.",
    "Le compresseur fait un bruit anormal.",
  ],
};

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isSeason(date: Date, season: string): boolean {
  const month = date.getMonth(); // 0-11
  if (season === "winter") return month >= 10 || month <= 2; // Nov-Mar
  if (season === "summer") return month >= 5 && month <= 8; // Jun-Sep
  return true;
}

async function main() {
  const startDate = new Date("2023-01-01");
  const endDate = new Date("2026-03-15");

  // Get current max request number
  const lastReq = await prisma.request.findFirst({ orderBy: { number: "desc" } });
  let counter = lastReq ? parseInt(lastReq.number.replace(/\D/g, "")) : 0;

  const requests: any[] = [];

  for (const eq of equipments) {
    // Calculate number of requests based on frequency and time span
    const monthsSpan = 39; // ~3+ years (2023-2026)
    const totalRequests = Math.round((eq.freq / 12) * monthsSpan * (0.7 + Math.random() * 0.6));

    for (let i = 0; i < totalRequests; i++) {
      let date: Date;
      let attempts = 0;

      // Generate date, biased toward seasonal if applicable
      do {
        date = randomDate(startDate, endDate);
        attempts++;
      } while ((eq as any).seasonal && !isSeason(date, (eq as any).seasonal) && Math.random() > 0.15 && attempts < 20);

      counter++;
      const year = date.getFullYear();
      const number = `DI-${year}-${String(counter).padStart(3, "0")}`;

      const techs = eq.etab === ETAB1 ? techsEtab1 : techsEtab2;
      const requesters = eq.etab === ETAB1 ? requestersEtab1 : requestersEtab2;

      const desc = pick(descriptions[eq.name] || ["Probleme signale sur l'equipement."]);
      const issueType = pick(issueTypes);
      const urgency: RequestUrgency = Math.random() < 0.15 ? "CRITICAL" : Math.random() < 0.35 ? "URGENT" : "NORMAL";

      // Old requests are mostly resolved
      const ageInDays = (endDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      let status: RequestStatus;
      if (ageInDays > 60) {
        const r = Math.random();
        status = r < 0.65 ? "DONE" : r < 0.85 ? "CLOSED" : r < 0.92 ? "REJECTED" : "ARCHIVED";
      } else if (ageInDays > 14) {
        const r = Math.random();
        status = r < 0.4 ? "IN_PROGRESS" : r < 0.7 ? "DONE" : r < 0.85 ? "ACKNOWLEDGED" : "WAITING";
      } else {
        const r = Math.random();
        status = r < 0.5 ? "NEW" : r < 0.7 ? "ACKNOWLEDGED" : "IN_PROGRESS";
      }

      // Resolution time (1-30 days for resolved, proportional to urgency)
      const baseResolution = urgency === "CRITICAL" ? 2 : urgency === "URGENT" ? 5 : 10;
      const resolutionDays = Math.max(1, Math.round(baseResolution + Math.random() * baseResolution * 2));
      const resolvedAt = new Date(date.getTime() + resolutionDays * 24 * 60 * 60 * 1000);

      requests.push({
        number,
        equipmentId: eq.id,
        requesterId: pick(requesters),
        assignedToId: ["NEW"].includes(status) ? null : pick(techs),
        locationId: eq.locationId,
        establishmentId: eq.etab,
        issueType,
        description: desc,
        urgency,
        status,
        createdAt: date,
        updatedAt: ["DONE", "CLOSED", "REJECTED", "ARCHIVED"].includes(status) ? resolvedAt : date,
      });
    }
  }

  // Sort by date
  requests.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Renumber properly
  let num = counter - requests.length;
  for (const r of requests) {
    num++;
    r.number = `DI-${r.createdAt.getFullYear()}-${String(num).padStart(3, "0")}`;
  }

  // Status flow for history generation
  const statusFlow: Record<string, RequestStatus[]> = {
    NEW: ["NEW"],
    ACKNOWLEDGED: ["NEW", "ACKNOWLEDGED"],
    IN_PROGRESS: ["NEW", "ACKNOWLEDGED", "IN_PROGRESS"],
    WAITING: ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "WAITING"],
    DONE: ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "DONE"],
    CLOSED: ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "DONE", "CLOSED"],
    REJECTED: ["NEW", "REJECTED"],
    ARCHIVED: ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "DONE", "ARCHIVED"],
  };

  // Insert requests + StatusHistory
  let inserted = 0;
  for (const r of requests) {
    try {
      const request = await prisma.request.create({ data: r });
      inserted++;

      // Generate StatusHistory entries
      const flow = statusFlow[r.status] || ["NEW"];
      const totalDuration = r.updatedAt.getTime() - r.createdAt.getTime();

      for (let j = 0; j < flow.length; j++) {
        // Spread transitions evenly across the duration
        const fraction = flow.length > 1 ? j / (flow.length - 1) : 0;
        const transitionDate = new Date(r.createdAt.getTime() + totalDuration * fraction);

        await prisma.statusHistory.create({
          data: {
            requestId: request.id,
            fromStatus: j === 0 ? null : flow[j - 1],
            toStatus: flow[j],
            actorId: r.requesterId,
            createdAt: transitionDate,
          },
        });
      }
    } catch (e: any) {
      if (e.code === "P2002") continue; // duplicate
      throw e;
    }
  }

  console.log(`\n=== Historique genere ===`);
  console.log(`${inserted} demandes creees sur la periode ${startDate.toLocaleDateString("fr")} - ${endDate.toLocaleDateString("fr")}`);
  console.log(`\nRepartition par equipement:`);
  for (const eq of equipments) {
    const count = requests.filter(r => r.equipmentId === eq.id).length;
    console.log(`  ${eq.name}: ${count} demandes`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
