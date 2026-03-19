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

  const [admin, manager, technician, user] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@ime.local",
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
        email: "responsable@ime.local",
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
        email: "tech@ime.local",
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
        email: "personnel@ime.local",
        passwordHash,
        firstName: "Julie",
        lastName: "Martin",
        role: Role.USER,
        service: "Hebergement",
        phone: "01 40 00 00 04",
      },
    }),
  ]);

  const [administratif, pedagogique, hebergement, buanderie] = await Promise.all([
    prisma.location.create({
      data: {
        building: "Batiment administratif",
        floor: "RDC",
        room: "Bureau accueil",
      },
    }),
    prisma.location.create({
      data: {
        building: "Batiment pedagogique",
        floor: "1er",
        room: "Salle 4",
      },
    }),
    prisma.location.create({
      data: {
        building: "Hebergement",
        floor: "RDC",
        room: "Chambre 12",
      },
    }),
    prisma.location.create({
      data: {
        building: "Espaces communs",
        floor: "RDC",
        room: "Buanderie",
      },
    }),
  ]);

  const [electromenager, informatique, chauffage, plomberie] = await Promise.all([
    prisma.equipmentCategory.create({ data: { name: "Electromenager", icon: "washing-machine" } }),
    prisma.equipmentCategory.create({ data: { name: "Informatique", icon: "monitor" } }),
    prisma.equipmentCategory.create({ data: { name: "Chauffage", icon: "heater" } }),
    prisma.equipmentCategory.create({ data: { name: "Plomberie", icon: "droplets" } }),
  ]);

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
      locationId: pedagogique.id,
      serialNumber: "LEN-440-998",
      brand: "Lenovo",
      model: "ThinkCentre M70",
      purchaseDate: new Date("2024-09-01"),
      commissioningDate: new Date("2024-09-05"),
      supplier: "MediaPro",
      status: EquipmentStatus.IN_SERVICE,
      notes: "Machine reference pour les tests d'impression et l'acces ENT.",
    },
  });

  const radiator = await prisma.equipment.create({
    data: {
      code: "EQ-00003",
      qrCode: "EQ-00003",
      name: "Radiateur Chambre 12",
      categoryId: chauffage.id,
      locationId: hebergement.id,
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
      locationId: administratif.id,
      brand: "Grohe",
      model: "QuickFix",
      purchaseDate: new Date("2021-06-21"),
      status: EquipmentStatus.IN_SERVICE,
    },
  });

  const request1 = await prisma.request.create({
    data: {
      number: "DI-2026-001",
      equipmentId: machine.id,
      requesterId: user.id,
      assignedToId: technician.id,
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
            authorId: technician.id,
            message: "Controle electrique lance. Attente de la piece de verrouillage.",
          },
        ],
      },
      history: {
        create: [
          { fromStatus: null, toStatus: RequestStatus.NEW, actorId: user.id, comment: "Signalement cree." },
          { fromStatus: RequestStatus.NEW, toStatus: RequestStatus.ACKNOWLEDGED, actorId: manager.id, comment: "Pris en compte." },
          { fromStatus: RequestStatus.ACKNOWLEDGED, toStatus: RequestStatus.IN_PROGRESS, actorId: technician.id, comment: "Diagnostic en cours." },
        ],
      },
    },
  });

  const request2 = await prisma.request.create({
    data: {
      number: "DI-2026-002",
      equipmentId: radiator.id,
      requesterId: user.id,
      assignedToId: technician.id,
      locationId: hebergement.id,
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

  const request3 = await prisma.request.create({
    data: {
      number: "DI-2026-003",
      equipmentId: faucet.id,
      requesterId: manager.id,
      locationId: administratif.id,
      issueType: RequestIssueType.LEAK,
      description: "Fuite legere sous le robinet de l'accueil.",
      urgency: RequestUrgency.NORMAL,
      status: RequestStatus.NEW,
      history: {
        create: [{ fromStatus: null, toStatus: RequestStatus.NEW, actorId: manager.id, comment: "Demande en attente d'affectation." }],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        recipientId: manager.id,
        title: "Nouvelle demande critique",
        message: `${request1.number} sur ${machine.name}`,
        link: `/demandes/${request1.id}`,
      },
      {
        recipientId: technician.id,
        title: "Intervention en attente",
        message: `${request2.number} attend une piece`,
        link: `/demandes/${request2.id}`,
      },
      {
        recipientId: admin.id,
        title: "Nouvelle demande a affecter",
        message: `${request3.number} sur ${faucet.name}`,
        link: `/demandes/${request3.id}`,
      },
      {
        recipientId: user.id,
        title: "Demande prise en charge",
        message: `${request1.number} est en cours de traitement`,
        link: `/demandes/${request1.id}`,
      },
    ],
  });

  await prisma.equipment.update({
    where: { id: pc.id },
    data: {
      notes: "Machine reference pour les tests d'impression et l'acces ENT.",
    },
  });

  console.log({
    demoAccounts: [
      "admin@ime.local / demo1234",
      "responsable@ime.local / demo1234",
      "tech@ime.local / demo1234",
      "personnel@ime.local / demo1234",
    ],
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
