import {
  EquipmentStatus,
  PrismaClient,
  RequestIssueType,
  RequestStatus,
  RequestUrgency,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.requestComment.deleteMany();
  await prisma.request.deleteMany();
  await prisma.maintenancePlan.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.equipmentCategory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  await prisma.establishment.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // ===== SUPER ADMIN =====
  await prisma.user.create({
    data: {
      email: "superadmin@gmao.fr",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: Role.SUPER_ADMIN,
      service: "Direction generale",
    },
  });

  // ===== ESTABLISHMENTS =====
  const [etab1, etab2] = await Promise.all([
    prisma.establishment.create({
      data: {
        name: "IME Les Cedres",
        slug: "ime-les-cedres",
        address: "12 rue des Cedres, 75012 Paris",
        phone: "01 40 00 00 00",
        email: "contact@ime-cedres.fr",
      },
    }),
    prisma.establishment.create({
      data: {
        name: "Hopital Saint-Louis",
        slug: "hopital-saint-louis",
        address: "1 avenue Claude Vellefaux, 75010 Paris",
        phone: "01 42 49 49 49",
        email: "contact@hopital-stlouis.fr",
      },
    }),
  ]);

  // ===== USERS - Etablissement 1 (IME) =====
  const [admin1, manager1, techPlomberie1, techElec1, techInfo1, user1] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@gmao.fr",
        passwordHash,
        firstName: "Claire",
        lastName: "Bernard",
        role: Role.ADMIN,
        service: "Direction",
        phone: "01 40 00 00 01",
        establishmentId: etab1.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "responsable@gmao.fr",
        passwordHash,
        firstName: "Marc",
        lastName: "Lefevre",
        role: Role.MANAGER,
        service: "Maintenance",
        phone: "01 40 00 00 02",
        establishmentId: etab1.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "tech.plomberie@gmao.fr",
        passwordHash,
        firstName: "Sonia",
        lastName: "Petit",
        role: Role.TECHNICIAN,
        service: "Maintenance",
        phone: "01 40 00 00 03",
        establishmentId: etab1.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "tech.elec@gmao.fr",
        passwordHash,
        firstName: "Karim",
        lastName: "Bensaid",
        role: Role.TECHNICIAN,
        service: "Maintenance",
        phone: "01 40 00 00 05",
        establishmentId: etab1.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "tech.info@gmao.fr",
        passwordHash,
        firstName: "Thomas",
        lastName: "Nguyen",
        role: Role.TECHNICIAN,
        service: "Informatique",
        phone: "01 40 00 00 06",
        establishmentId: etab1.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "personnel@gmao.fr",
        passwordHash,
        firstName: "Julie",
        lastName: "Martin",
        role: Role.USER,
        service: "Hebergement",
        phone: "01 40 00 00 04",
        establishmentId: etab1.id,
      },
    }),
  ]);

  // ===== USERS - Etablissement 2 (Hopital) =====
  const [admin2, manager2, techHop1, userHop1] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@hopital-stlouis.fr",
        passwordHash,
        firstName: "Philippe",
        lastName: "Dupont",
        role: Role.ADMIN,
        service: "Direction technique",
        phone: "01 42 49 00 01",
        establishmentId: etab2.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "responsable@hopital-stlouis.fr",
        passwordHash,
        firstName: "Nathalie",
        lastName: "Garcia",
        role: Role.MANAGER,
        service: "Services generaux",
        phone: "01 42 49 00 02",
        establishmentId: etab2.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "tech@hopital-stlouis.fr",
        passwordHash,
        firstName: "Ahmed",
        lastName: "Khelil",
        role: Role.TECHNICIAN,
        service: "Maintenance",
        phone: "01 42 49 00 03",
        establishmentId: etab2.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "personnel@hopital-stlouis.fr",
        passwordHash,
        firstName: "Sophie",
        lastName: "Rousseau",
        role: Role.USER,
        service: "Cardiologie",
        phone: "01 42 49 00 04",
        establishmentId: etab2.id,
      },
    }),
  ]);

  // ===== LOCATIONS - Etablissement 1 =====
  const [accueil, salle4, chambre12, buanderie, sousol, urgences] = await Promise.all([
    prisma.location.create({ data: { building: "Batiment administratif", floor: "RDC", room: "Bureau accueil", establishmentId: etab1.id } }),
    prisma.location.create({ data: { building: "Batiment pedagogique", floor: "1er", room: "Salle 4", establishmentId: etab1.id } }),
    prisma.location.create({ data: { building: "Hebergement", floor: "RDC", room: "Chambre 12", establishmentId: etab1.id } }),
    prisma.location.create({ data: { building: "Espaces communs", floor: "RDC", room: "Buanderie", establishmentId: etab1.id } }),
    prisma.location.create({ data: { building: "Batiment principal", floor: "Sous-sol", room: "Local technique", establishmentId: etab1.id } }),
    prisma.location.create({ data: { building: "Batiment principal", floor: "RDC", room: "Urgences", establishmentId: etab1.id } }),
  ]);

  // ===== LOCATIONS - Etablissement 2 =====
  const [hallHop, cardio, bloc, pharmacie] = await Promise.all([
    prisma.location.create({ data: { building: "Batiment A", floor: "RDC", room: "Hall principal", establishmentId: etab2.id } }),
    prisma.location.create({ data: { building: "Batiment B", floor: "2eme", room: "Cardiologie", establishmentId: etab2.id } }),
    prisma.location.create({ data: { building: "Batiment A", floor: "1er", room: "Bloc operatoire 1", establishmentId: etab2.id } }),
    prisma.location.create({ data: { building: "Batiment C", floor: "RDC", room: "Pharmacie", establishmentId: etab2.id } }),
  ]);

  // ===== CATEGORIES - Etablissement 1 =====
  const [plomberie, electricite, climatisation, chauffage, ascenseurs, informatique, electromenager, mobilierMedical, securiteIncendie, menuiserie] = await Promise.all([
    prisma.equipmentCategory.create({ data: { name: "Plomberie", icon: "droplets", isExternal: false, establishmentId: etab1.id } }),
    prisma.equipmentCategory.create({ data: { name: "Electricite", icon: "zap", isExternal: false, establishmentId: etab1.id } }),
    prisma.equipmentCategory.create({ data: { name: "Climatisation", icon: "wind", isExternal: true, contractorName: "Daikin France Services", contractorPhone: "01 55 12 34 56", contractorEmail: "maintenance@daikin-services.fr", establishmentId: etab1.id } }),
    prisma.equipmentCategory.create({ data: { name: "Chauffage", icon: "heater", isExternal: false, establishmentId: etab1.id } }),
    prisma.equipmentCategory.create({ data: { name: "Ascenseurs", icon: "arrow-up-down", isExternal: true, contractorName: "Otis France", contractorPhone: "01 49 78 90 00", contractorEmail: "urgences@otis.fr", establishmentId: etab1.id } }),
    prisma.equipmentCategory.create({ data: { name: "Informatique", icon: "monitor", isExternal: false, establishmentId: etab1.id } }),
    prisma.equipmentCategory.create({ data: { name: "Electromenager", icon: "washing-machine", isExternal: false, establishmentId: etab1.id } }),
    prisma.equipmentCategory.create({ data: { name: "Mobilier medical", icon: "bed", isExternal: true, contractorName: "Hill-Rom SAS", contractorPhone: "01 41 22 33 44", contractorEmail: "sav@hill-rom.fr", establishmentId: etab1.id } }),
    prisma.equipmentCategory.create({ data: { name: "Securite incendie", icon: "flame", isExternal: true, contractorName: "Siemens Fire Safety", contractorPhone: "01 60 44 55 66", contractorEmail: "intervention@siemens-fire.fr", establishmentId: etab1.id } }),
    prisma.equipmentCategory.create({ data: { name: "Menuiserie", icon: "door-open", isExternal: false, establishmentId: etab1.id } }),
  ]);

  // ===== CATEGORIES - Etablissement 2 =====
  const [plomberieHop, elecHop, climHop, biomedical] = await Promise.all([
    prisma.equipmentCategory.create({ data: { name: "Plomberie", icon: "droplets", isExternal: false, establishmentId: etab2.id } }),
    prisma.equipmentCategory.create({ data: { name: "Electricite", icon: "zap", isExternal: false, establishmentId: etab2.id } }),
    prisma.equipmentCategory.create({ data: { name: "Climatisation", icon: "wind", isExternal: true, contractorName: "Carrier France", contractorPhone: "01 39 56 78 00", contractorEmail: "sav@carrier.fr", establishmentId: etab2.id } }),
    prisma.equipmentCategory.create({ data: { name: "Biomedical", icon: "heart-pulse", isExternal: true, contractorName: "Philips Healthcare", contractorPhone: "01 47 28 50 00", contractorEmail: "service@philips-medical.fr", establishmentId: etab2.id } }),
  ]);

  // Connect specialists to categories - Etab 1
  await Promise.all([
    prisma.equipmentCategory.update({ where: { id: plomberie.id }, data: { specialists: { connect: [{ id: techPlomberie1.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: electricite.id }, data: { specialists: { connect: [{ id: techElec1.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: chauffage.id }, data: { specialists: { connect: [{ id: techPlomberie1.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: informatique.id }, data: { specialists: { connect: [{ id: techInfo1.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: electromenager.id }, data: { specialists: { connect: [{ id: techElec1.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: menuiserie.id }, data: { specialists: { connect: [{ id: techPlomberie1.id }] } } }),
  ]);

  // Connect specialists to categories - Etab 2
  await Promise.all([
    prisma.equipmentCategory.update({ where: { id: plomberieHop.id }, data: { specialists: { connect: [{ id: techHop1.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: elecHop.id }, data: { specialists: { connect: [{ id: techHop1.id }] } } }),
  ]);

  // ===== EQUIPMENTS - Etablissement 1 =====
  const machine = await prisma.equipment.create({
    data: {
      code: "EQ-00001", qrCode: "EQ-00001", name: "Lave-linge Miele W1",
      categoryId: electromenager.id, locationId: buanderie.id, establishmentId: etab1.id,
      serialNumber: "MIE-W1-2237", brand: "Miele", model: "W1",
      purchaseDate: new Date("2023-03-15"), commissioningDate: new Date("2023-03-20"),
      warrantyEndDate: new Date("2026-03-20"), supplier: "Equip'Service",
      status: EquipmentStatus.IN_REPAIR, notes: "Utilisation intensive par l'hebergement.",
    },
  });

  await prisma.equipment.create({
    data: {
      code: "EQ-00002", qrCode: "EQ-00002", name: "PC Salle 4",
      categoryId: informatique.id, locationId: salle4.id, establishmentId: etab1.id,
      serialNumber: "LEN-440-998", brand: "Lenovo", model: "ThinkCentre M70",
      purchaseDate: new Date("2024-09-01"), commissioningDate: new Date("2024-09-05"),
      supplier: "MediaPro", status: EquipmentStatus.IN_SERVICE,
    },
  });

  const radiator = await prisma.equipment.create({
    data: {
      code: "EQ-00003", qrCode: "EQ-00003", name: "Radiateur Chambre 12",
      categoryId: chauffage.id, locationId: chambre12.id, establishmentId: etab1.id,
      brand: "Atlantic", model: "Confort 1500",
      purchaseDate: new Date("2022-11-10"), commissioningDate: new Date("2022-11-12"),
      status: EquipmentStatus.OUT_OF_ORDER,
    },
  });

  const faucet = await prisma.equipment.create({
    data: {
      code: "EQ-00004", qrCode: "EQ-00004", name: "Robinet accueil",
      categoryId: plomberie.id, locationId: accueil.id, establishmentId: etab1.id,
      brand: "Grohe", model: "QuickFix", purchaseDate: new Date("2021-06-21"),
      status: EquipmentStatus.IN_SERVICE,
    },
  });

  await prisma.equipment.create({
    data: {
      code: "EQ-00005", qrCode: "EQ-00005", name: "Ascenseur principal",
      categoryId: ascenseurs.id, locationId: sousol.id, establishmentId: etab1.id,
      brand: "Otis", model: "Gen2", purchaseDate: new Date("2019-06-01"),
      commissioningDate: new Date("2019-06-15"), status: EquipmentStatus.IN_SERVICE,
      notes: "Contrat maintenance Otis - visite trimestrielle.",
    },
  });

  await prisma.equipment.create({
    data: {
      code: "EQ-00006", qrCode: "EQ-00006", name: "Climatisation Urgences",
      categoryId: climatisation.id, locationId: urgences.id, establishmentId: etab1.id,
      brand: "Daikin", model: "FTXM35", purchaseDate: new Date("2023-05-10"),
      warrantyEndDate: new Date("2026-05-10"), status: EquipmentStatus.IN_SERVICE,
    },
  });

  await prisma.equipment.create({
    data: {
      code: "EQ-00007", qrCode: "EQ-00007", name: "Lit medicalise Chambre 12",
      categoryId: mobilierMedical.id, locationId: chambre12.id, establishmentId: etab1.id,
      brand: "Hill-Rom", model: "Centrella", purchaseDate: new Date("2022-01-15"),
      status: EquipmentStatus.IN_SERVICE,
    },
  });

  await prisma.equipment.create({
    data: {
      code: "EQ-00008", qrCode: "EQ-00008", name: "Extincteur Hall RDC",
      categoryId: securiteIncendie.id, locationId: accueil.id, establishmentId: etab1.id,
      brand: "Sicli", model: "GP6", purchaseDate: new Date("2024-01-10"),
      warrantyEndDate: new Date("2029-01-10"), status: EquipmentStatus.IN_SERVICE,
      notes: "Verification annuelle obligatoire.",
    },
  });

  // ===== EQUIPMENTS - Etablissement 2 =====
  const ecgHop = await prisma.equipment.create({
    data: {
      code: "EQ-00009", qrCode: "EQ-00009", name: "ECG Philips PageWriter",
      categoryId: biomedical.id, locationId: cardio.id, establishmentId: etab2.id,
      brand: "Philips", model: "PageWriter TC70", serialNumber: "PHI-ECG-4521",
      purchaseDate: new Date("2023-01-15"), warrantyEndDate: new Date("2026-01-15"),
      status: EquipmentStatus.IN_SERVICE,
    },
  });

  const climBloc = await prisma.equipment.create({
    data: {
      code: "EQ-00010", qrCode: "EQ-00010", name: "Climatisation Bloc Op 1",
      categoryId: climHop.id, locationId: bloc.id, establishmentId: etab2.id,
      brand: "Carrier", model: "AquaForce 30XA", serialNumber: "CAR-30XA-112",
      purchaseDate: new Date("2022-06-01"), status: EquipmentStatus.IN_SERVICE,
      notes: "Temperature regulee a 19C obligatoire.",
    },
  });

  await prisma.equipment.create({
    data: {
      code: "EQ-00011", qrCode: "EQ-00011", name: "Armoire refrigeree Pharmacie",
      categoryId: elecHop.id, locationId: pharmacie.id, establishmentId: etab2.id,
      brand: "Liebherr", model: "LKPv 6523", serialNumber: "LIE-6523-087",
      purchaseDate: new Date("2024-03-01"), status: EquipmentStatus.IN_SERVICE,
      notes: "Surveillance temperature 2-8C.",
    },
  });

  await prisma.equipment.create({
    data: {
      code: "EQ-00012", qrCode: "EQ-00012", name: "Eclairage Hall Principal",
      categoryId: elecHop.id, locationId: hallHop.id, establishmentId: etab2.id,
      brand: "Philips", model: "CoreLine Panel", purchaseDate: new Date("2023-09-01"),
      status: EquipmentStatus.IN_SERVICE,
    },
  });

  // ===== REQUESTS - Etablissement 1 =====
  const request1 = await prisma.request.create({
    data: {
      number: "DI-2026-001",
      equipmentId: machine.id, requesterId: user1.id, assignedToId: techElec1.id,
      locationId: buanderie.id, establishmentId: etab1.id,
      issueType: RequestIssueType.COMPLETE_FAILURE,
      description: "Le lave-linge ne demarre plus. Aucun voyant ne s'allume.",
      urgency: RequestUrgency.CRITICAL, status: RequestStatus.IN_PROGRESS,
      dueDate: new Date("2026-03-20"), technicalPriority: "Haute",
      comments: { create: [{ authorId: techElec1.id, message: "Controle electrique lance. Attente de la piece de verrouillage." }] },
      history: {
        create: [
          { fromStatus: null, toStatus: RequestStatus.NEW, actorId: user1.id, comment: "Signalement cree." },
          { fromStatus: RequestStatus.NEW, toStatus: RequestStatus.ACKNOWLEDGED, actorId: manager1.id, comment: "Pris en compte." },
          { fromStatus: RequestStatus.ACKNOWLEDGED, toStatus: RequestStatus.IN_PROGRESS, actorId: techElec1.id, comment: "Diagnostic en cours." },
        ],
      },
    },
  });

  const request2 = await prisma.request.create({
    data: {
      number: "DI-2026-002",
      equipmentId: radiator.id, requesterId: user1.id, assignedToId: techPlomberie1.id,
      locationId: chambre12.id, establishmentId: etab1.id,
      issueType: RequestIssueType.MALFUNCTION,
      description: "Le radiateur reste froid malgre le thermostat au maximum.",
      urgency: RequestUrgency.URGENT, status: RequestStatus.WAITING,
      dueDate: new Date("2026-03-22"), technicalPriority: "Normale",
      history: {
        create: [
          { fromStatus: null, toStatus: RequestStatus.NEW, actorId: user1.id, comment: "Creation de la demande." },
          { fromStatus: RequestStatus.NEW, toStatus: RequestStatus.WAITING, actorId: manager1.id, comment: "Commande de resistance en cours." },
        ],
      },
    },
  });

  const request3 = await prisma.request.create({
    data: {
      number: "DI-2026-003",
      equipmentId: faucet.id, requesterId: manager1.id, assignedToId: techPlomberie1.id,
      locationId: accueil.id, establishmentId: etab1.id,
      issueType: RequestIssueType.LEAK,
      description: "Fuite legere sous le robinet de l'accueil.",
      urgency: RequestUrgency.NORMAL, status: RequestStatus.NEW,
      history: { create: [{ fromStatus: null, toStatus: RequestStatus.NEW, actorId: manager1.id, comment: "Demande en attente d'affectation." }] },
    },
  });

  // ===== REQUESTS - Etablissement 2 =====
  const requestHop1 = await prisma.request.create({
    data: {
      number: "DI-2026-004",
      equipmentId: ecgHop.id, requesterId: userHop1.id, assignedToId: techHop1.id,
      locationId: cardio.id, establishmentId: etab2.id,
      issueType: RequestIssueType.MALFUNCTION,
      description: "L'ECG affiche des artefacts sur les derivations precordiales.",
      urgency: RequestUrgency.URGENT, status: RequestStatus.IN_PROGRESS,
      dueDate: new Date("2026-03-21"), technicalPriority: "Haute",
      history: {
        create: [
          { fromStatus: null, toStatus: RequestStatus.NEW, actorId: userHop1.id, comment: "Signalement par le service cardio." },
          { fromStatus: RequestStatus.NEW, toStatus: RequestStatus.IN_PROGRESS, actorId: techHop1.id, comment: "Verification des cables en cours." },
        ],
      },
    },
  });

  const requestHop2 = await prisma.request.create({
    data: {
      number: "DI-2026-005",
      equipmentId: climBloc.id, requesterId: manager2.id,
      locationId: bloc.id, establishmentId: etab2.id,
      issueType: RequestIssueType.MALFUNCTION,
      description: "Temperature du bloc operatoire monte a 23C au lieu de 19C.",
      urgency: RequestUrgency.CRITICAL, status: RequestStatus.NEW,
      history: { create: [{ fromStatus: null, toStatus: RequestStatus.NEW, actorId: manager2.id, comment: "Urgence bloc operatoire." }] },
    },
  });

  // ===== NOTIFICATIONS =====
  await prisma.notification.createMany({
    data: [
      // Etab 1
      { recipientId: manager1.id, title: "Nouvelle demande critique", message: `${request1.number} sur ${machine.name}`, link: `/demandes/${request1.id}` },
      { recipientId: techPlomberie1.id, title: "Demande assignee automatiquement", message: `${request2.number} - ${radiator.name} (Chauffage)`, link: `/demandes/${request2.id}` },
      { recipientId: techPlomberie1.id, title: "Nouvelle demande assignee", message: `${request3.number} - ${faucet.name} (Plomberie)`, link: `/demandes/${request3.id}` },
      { recipientId: techElec1.id, title: "Demande assignee automatiquement", message: `${request1.number} - ${machine.name} (Electromenager)`, link: `/demandes/${request1.id}` },
      { recipientId: admin1.id, title: "Nouvelle demande a affecter", message: `${request3.number} sur ${faucet.name}`, link: `/demandes/${request3.id}` },
      // Etab 2
      { recipientId: admin2.id, title: "Urgence bloc operatoire", message: `${requestHop2.number} - Climatisation bloc op.`, link: `/demandes/${requestHop2.id}` },
      { recipientId: techHop1.id, title: "Demande assignee", message: `${requestHop1.number} - ${ecgHop.name}`, link: `/demandes/${requestHop1.id}` },
      { recipientId: manager2.id, title: "Nouvelle demande critique", message: `${requestHop1.number} sur ${ecgHop.name}`, link: `/demandes/${requestHop1.id}` },
    ],
  });

  console.log("=== Seed termine ===");
  console.log("\n--- Super Admin ---");
  console.log("superadmin@gmao.fr / demo1234 (Super administrateur)");
  console.log("\n--- Etablissement 1 : IME Les Cedres ---");
  console.log({
    comptes: [
      "admin@gmao.fr / demo1234 (Administrateur)",
      "responsable@gmao.fr / demo1234 (Responsable)",
      "tech.plomberie@gmao.fr / demo1234 (Technicien)",
      "tech.elec@gmao.fr / demo1234 (Technicien)",
      "tech.info@gmao.fr / demo1234 (Technicien)",
      "personnel@gmao.fr / demo1234 (Personnel)",
    ],
    equipements: "8", demandes: "3", categories: "10",
  });
  console.log("\n--- Etablissement 2 : Hopital Saint-Louis ---");
  console.log({
    comptes: [
      "admin@hopital-stlouis.fr / demo1234 (Administrateur)",
      "responsable@hopital-stlouis.fr / demo1234 (Responsable)",
      "tech@hopital-stlouis.fr / demo1234 (Technicien)",
      "personnel@hopital-stlouis.fr / demo1234 (Personnel)",
    ],
    equipements: "4", demandes: "2", categories: "4",
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
