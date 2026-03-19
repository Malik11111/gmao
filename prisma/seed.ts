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
  await prisma.equipment.deleteMany();
  await prisma.equipmentCategory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // ===== USERS =====
  const [admin, manager, techPlomberie, techElec, techInfo, user] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@gmao.fr",
        passwordHash,
        firstName: "Claire",
        lastName: "Bernard",
        role: Role.ADMIN,
        service: "Direction",
        phone: "01 40 00 00 01",
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
      },
    }),
  ]);

  // ===== LOCATIONS =====
  const [accueil, salle4, chambre12, buanderie, sousol, urgences] = await Promise.all([
    prisma.location.create({ data: { building: "Batiment administratif", floor: "RDC", room: "Bureau accueil" } }),
    prisma.location.create({ data: { building: "Batiment pedagogique", floor: "1er", room: "Salle 4" } }),
    prisma.location.create({ data: { building: "Hebergement", floor: "RDC", room: "Chambre 12" } }),
    prisma.location.create({ data: { building: "Espaces communs", floor: "RDC", room: "Buanderie" } }),
    prisma.location.create({ data: { building: "Batiment principal", floor: "Sous-sol", room: "Local technique" } }),
    prisma.location.create({ data: { building: "Batiment principal", floor: "RDC", room: "Urgences" } }),
  ]);

  // ===== 10 CATEGORIES (hopital) =====
  const [plomberie, electricite, climatisation, chauffage, ascenseurs, informatique, electromenager, mobilierMedical, securiteIncendie, menuiserie] = await Promise.all([
    prisma.equipmentCategory.create({ data: { name: "Plomberie", icon: "droplets", isExternal: false } }),
    prisma.equipmentCategory.create({ data: { name: "Electricite", icon: "zap", isExternal: false } }),
    prisma.equipmentCategory.create({ data: { name: "Climatisation", icon: "wind", isExternal: true, contractorName: "Daikin France Services", contractorPhone: "01 55 12 34 56", contractorEmail: "maintenance@daikin-services.fr" } }),
    prisma.equipmentCategory.create({ data: { name: "Chauffage", icon: "heater", isExternal: false } }),
    prisma.equipmentCategory.create({ data: { name: "Ascenseurs", icon: "arrow-up-down", isExternal: true, contractorName: "Otis France", contractorPhone: "01 49 78 90 00", contractorEmail: "urgences@otis.fr" } }),
    prisma.equipmentCategory.create({ data: { name: "Informatique", icon: "monitor", isExternal: false } }),
    prisma.equipmentCategory.create({ data: { name: "Electromenager", icon: "washing-machine", isExternal: false } }),
    prisma.equipmentCategory.create({ data: { name: "Mobilier medical", icon: "bed", isExternal: true, contractorName: "Hill-Rom SAS", contractorPhone: "01 41 22 33 44", contractorEmail: "sav@hill-rom.fr" } }),
    prisma.equipmentCategory.create({ data: { name: "Securite incendie", icon: "flame", isExternal: true, contractorName: "Siemens Fire Safety", contractorPhone: "01 60 44 55 66", contractorEmail: "intervention@siemens-fire.fr" } }),
    prisma.equipmentCategory.create({ data: { name: "Menuiserie", icon: "door-open", isExternal: false } }),
  ]);

  // Connect specialists to categories
  await Promise.all([
    prisma.equipmentCategory.update({ where: { id: plomberie.id }, data: { specialists: { connect: [{ id: techPlomberie.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: electricite.id }, data: { specialists: { connect: [{ id: techElec.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: chauffage.id }, data: { specialists: { connect: [{ id: techPlomberie.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: informatique.id }, data: { specialists: { connect: [{ id: techInfo.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: electromenager.id }, data: { specialists: { connect: [{ id: techElec.id }] } } }),
    prisma.equipmentCategory.update({ where: { id: menuiserie.id }, data: { specialists: { connect: [{ id: techPlomberie.id }] } } }),
  ]);

  // ===== EQUIPMENTS =====
  const machine = await prisma.equipment.create({
    data: {
      code: "EQ-00001",
      qrCode: "EQ-00001",
      name: "Lave-linge Miele W1",
      categoryId: electromenager.id,
      locationId: buanderie.id,
      serialNumber: "MIE-W1-2237",
      brand: "Miele",
      model: "W1",
      purchaseDate: new Date("2023-03-15"),
      commissioningDate: new Date("2023-03-20"),
      warrantyEndDate: new Date("2026-03-20"),
      supplier: "Equip'Service",
      status: EquipmentStatus.IN_REPAIR,
      notes: "Utilisation intensive par l'hebergement.",
    },
  });

  const pc = await prisma.equipment.create({
    data: {
      code: "EQ-00002",
      qrCode: "EQ-00002",
      name: "PC Salle 4",
      categoryId: informatique.id,
      locationId: salle4.id,
      serialNumber: "LEN-440-998",
      brand: "Lenovo",
      model: "ThinkCentre M70",
      purchaseDate: new Date("2024-09-01"),
      commissioningDate: new Date("2024-09-05"),
      supplier: "MediaPro",
      status: EquipmentStatus.IN_SERVICE,
    },
  });

  const radiator = await prisma.equipment.create({
    data: {
      code: "EQ-00003",
      qrCode: "EQ-00003",
      name: "Radiateur Chambre 12",
      categoryId: chauffage.id,
      locationId: chambre12.id,
      brand: "Atlantic",
      model: "Confort 1500",
      purchaseDate: new Date("2022-11-10"),
      commissioningDate: new Date("2022-11-12"),
      status: EquipmentStatus.OUT_OF_ORDER,
    },
  });

  const faucet = await prisma.equipment.create({
    data: {
      code: "EQ-00004",
      qrCode: "EQ-00004",
      name: "Robinet accueil",
      categoryId: plomberie.id,
      locationId: accueil.id,
      brand: "Grohe",
      model: "QuickFix",
      purchaseDate: new Date("2021-06-21"),
      status: EquipmentStatus.IN_SERVICE,
    },
  });

  const ascenseur = await prisma.equipment.create({
    data: {
      code: "EQ-00005",
      qrCode: "EQ-00005",
      name: "Ascenseur principal",
      categoryId: ascenseurs.id,
      locationId: sousol.id,
      brand: "Otis",
      model: "Gen2",
      purchaseDate: new Date("2019-06-01"),
      commissioningDate: new Date("2019-06-15"),
      status: EquipmentStatus.IN_SERVICE,
      notes: "Contrat maintenance Otis - visite trimestrielle.",
    },
  });

  const clim = await prisma.equipment.create({
    data: {
      code: "EQ-00006",
      qrCode: "EQ-00006",
      name: "Climatisation Urgences",
      categoryId: climatisation.id,
      locationId: urgences.id,
      brand: "Daikin",
      model: "FTXM35",
      purchaseDate: new Date("2023-05-10"),
      warrantyEndDate: new Date("2026-05-10"),
      status: EquipmentStatus.IN_SERVICE,
    },
  });

  const lit = await prisma.equipment.create({
    data: {
      code: "EQ-00007",
      qrCode: "EQ-00007",
      name: "Lit medicalise Chambre 12",
      categoryId: mobilierMedical.id,
      locationId: chambre12.id,
      brand: "Hill-Rom",
      model: "Centrella",
      purchaseDate: new Date("2022-01-15"),
      status: EquipmentStatus.IN_SERVICE,
    },
  });

  const extincteur = await prisma.equipment.create({
    data: {
      code: "EQ-00008",
      qrCode: "EQ-00008",
      name: "Extincteur Hall RDC",
      categoryId: securiteIncendie.id,
      locationId: accueil.id,
      brand: "Sicli",
      model: "GP6",
      purchaseDate: new Date("2024-01-10"),
      warrantyEndDate: new Date("2029-01-10"),
      status: EquipmentStatus.IN_SERVICE,
      notes: "Verification annuelle obligatoire.",
    },
  });

  // ===== REQUESTS =====
  // Demande 1 : auto-assignee a techElec (electromenager)
  const request1 = await prisma.request.create({
    data: {
      number: "DI-2026-001",
      equipmentId: machine.id,
      requesterId: user.id,
      assignedToId: techElec.id,
      locationId: buanderie.id,
      issueType: RequestIssueType.COMPLETE_FAILURE,
      description: "Le lave-linge ne demarre plus. Aucun voyant ne s'allume.",
      urgency: RequestUrgency.CRITICAL,
      status: RequestStatus.IN_PROGRESS,
      dueDate: new Date("2026-03-20"),
      technicalPriority: "Haute",
      comments: {
        create: [
          {
            authorId: techElec.id,
            message: "Controle electrique lance. Attente de la piece de verrouillage.",
          },
        ],
      },
      history: {
        create: [
          { fromStatus: null, toStatus: RequestStatus.NEW, actorId: user.id, comment: "Signalement cree." },
          { fromStatus: RequestStatus.NEW, toStatus: RequestStatus.ACKNOWLEDGED, actorId: manager.id, comment: "Pris en compte." },
          { fromStatus: RequestStatus.ACKNOWLEDGED, toStatus: RequestStatus.IN_PROGRESS, actorId: techElec.id, comment: "Diagnostic en cours." },
        ],
      },
    },
  });

  // Demande 2 : auto-assignee a techPlomberie (chauffage)
  const request2 = await prisma.request.create({
    data: {
      number: "DI-2026-002",
      equipmentId: radiator.id,
      requesterId: user.id,
      assignedToId: techPlomberie.id,
      locationId: chambre12.id,
      issueType: RequestIssueType.MALFUNCTION,
      description: "Le radiateur reste froid malgre le thermostat au maximum.",
      urgency: RequestUrgency.URGENT,
      status: RequestStatus.WAITING,
      dueDate: new Date("2026-03-22"),
      technicalPriority: "Normale",
      history: {
        create: [
          { fromStatus: null, toStatus: RequestStatus.NEW, actorId: user.id, comment: "Creation de la demande." },
          { fromStatus: RequestStatus.NEW, toStatus: RequestStatus.WAITING, actorId: manager.id, comment: "Commande de resistance en cours." },
        ],
      },
    },
  });

  // Demande 3 : auto-assignee a techPlomberie (plomberie)
  const request3 = await prisma.request.create({
    data: {
      number: "DI-2026-003",
      equipmentId: faucet.id,
      requesterId: manager.id,
      assignedToId: techPlomberie.id,
      locationId: accueil.id,
      issueType: RequestIssueType.LEAK,
      description: "Fuite legere sous le robinet de l'accueil.",
      urgency: RequestUrgency.NORMAL,
      status: RequestStatus.NEW,
      history: {
        create: [{ fromStatus: null, toStatus: RequestStatus.NEW, actorId: manager.id, comment: "Demande en attente d'affectation." }],
      },
    },
  });

  // ===== NOTIFICATIONS =====
  await prisma.notification.createMany({
    data: [
      {
        recipientId: manager.id,
        title: "Nouvelle demande critique",
        message: `${request1.number} sur ${machine.name}`,
        link: `/demandes/${request1.id}`,
      },
      {
        recipientId: techPlomberie.id,
        title: "Demande assignee automatiquement",
        message: `${request2.number} - ${radiator.name} (Chauffage)`,
        link: `/demandes/${request2.id}`,
      },
      {
        recipientId: techPlomberie.id,
        title: "Nouvelle demande assignee",
        message: `${request3.number} - ${faucet.name} (Plomberie)`,
        link: `/demandes/${request3.id}`,
      },
      {
        recipientId: techElec.id,
        title: "Demande assignee automatiquement",
        message: `${request1.number} - ${machine.name} (Electromenager)`,
        link: `/demandes/${request1.id}`,
      },
      {
        recipientId: admin.id,
        title: "Nouvelle demande a affecter",
        message: `${request3.number} sur ${faucet.name}`,
        link: `/demandes/${request3.id}`,
      },
    ],
  });

  console.log({
    demoAccounts: [
      "admin@gmao.fr / demo1234 (Administrateur)",
      "responsable@gmao.fr / demo1234 (Responsable)",
      "tech.plomberie@gmao.fr / demo1234 (Technicien plomberie/chauffage/menuiserie)",
      "tech.elec@gmao.fr / demo1234 (Technicien electricite/electromenager)",
      "tech.info@gmao.fr / demo1234 (Technicien informatique)",
      "personnel@gmao.fr / demo1234 (Personnel)",
    ],
    categories: "10 categories (6 internes + 4 externes avec prestataires)",
    equipments: "8 equipements",
    requests: "3 demandes",
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
