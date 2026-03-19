"use server";

import { Role, RequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getNextEquipmentCode, getNextRequestNumber } from "@/lib/ids";
import { authenticateUser, canOperateRequests, createSession, deleteSession, requireRole, requireUser } from "@/lib/session";
import { saveUploadedFiles } from "@/lib/uploads";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : undefined;
}

function getDateOrUndefined(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function findOrCreateLocation(formData: FormData) {
  const building = getOptionalString(formData, "building");
  const floor = getOptionalString(formData, "floor");
  const room = getOptionalString(formData, "room");

  if (!building) {
    return null;
  }

  const existing = await prisma.location.findFirst({
    where: {
      building,
      floor: floor ?? null,
      room: room ?? null,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.location.create({
    data: {
      building,
      floor,
      room,
    },
  });
}

function withSearchParams(path: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export async function loginAction(formData: FormData) {
  const schema = z.object({
    email: z.email("Adresse email invalide."),
    password: z.string().min(1, "Le mot de passe est requis."),
  });

  const parsed = schema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    redirect(withSearchParams("/login", { error: parsed.error.issues[0]?.message }));
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);

  if (!user) {
    redirect(withSearchParams("/login", { error: "Identifiants invalides.", email: parsed.data.email }));
  }

  await createSession(user.id, user.role);
  redirect("/");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}

export async function createEquipmentAction(formData: FormData) {
  await requireRole([Role.ADMIN, Role.MANAGER]);

  const schema = z.object({
    name: z.string().min(3, "Le nom de l'equipement est requis."),
    status: z.string(),
    building: z.string().min(2, "Le batiment est requis."),
  });

  const parsed = schema.safeParse({
    name: getString(formData, "name"),
    status: getString(formData, "status"),
    building: getString(formData, "building"),
  });

  if (!parsed.success) {
    redirect(withSearchParams("/equipements/new", { error: parsed.error.issues[0]?.message }));
  }

  const photos = await saveUploadedFiles(
    formData.getAll("photos").filter((file): file is File => file instanceof File),
    "equipments",
  );

  const location = await findOrCreateLocation(formData);
  const code = await getNextEquipmentCode();

  const equipment = await prisma.equipment.create({
    data: {
      code,
      qrCode: code,
      name: parsed.data.name,
      categoryId: getOptionalString(formData, "categoryId"),
      locationId: location?.id,
      serialNumber: getOptionalString(formData, "serialNumber"),
      brand: getOptionalString(formData, "brand"),
      model: getOptionalString(formData, "model"),
      purchaseDate: getDateOrUndefined(getOptionalString(formData, "purchaseDate")),
      commissioningDate: getDateOrUndefined(getOptionalString(formData, "commissioningDate")),
      warrantyEndDate: getDateOrUndefined(getOptionalString(formData, "warrantyEndDate")),
      supplier: getOptionalString(formData, "supplier"),
      status: parsed.data.status as never,
      notes: getOptionalString(formData, "notes"),
      photos,
    },
  });

  revalidatePath("/equipements");
  redirect(withSearchParams(`/equipements/${equipment.id}`, { success: "Equipement cree avec succes." }));
}

export async function createRequestAction(formData: FormData) {
  const user = await requireUser();

  const schema = z.object({
    equipmentId: z.string().min(1),
    issueType: z.string().min(1, "Le type de probleme est requis."),
    description: z.string().min(8, "Merci de decrire le probleme."),
    urgency: z.string().min(1, "Le niveau d'urgence est requis."),
  });

  const parsed = schema.safeParse({
    equipmentId: getString(formData, "equipmentId"),
    issueType: getString(formData, "issueType"),
    description: getString(formData, "description"),
    urgency: getString(formData, "urgency"),
  });

  if (!parsed.success) {
    redirect(
      withSearchParams(`/signaler/${getString(formData, "equipmentId")}`, {
        error: parsed.error.issues[0]?.message,
      }),
    );
  }

  const equipment = await prisma.equipment.findUnique({
    where: { id: parsed.data.equipmentId },
    include: { location: true },
  });

  if (!equipment) {
    redirect("/equipements");
  }

  const photos = await saveUploadedFiles(
    formData.getAll("photos").filter((file): file is File => file instanceof File),
    "requests",
  );

  const requestNumber = await getNextRequestNumber();

  const request = await prisma.request.create({
    data: {
      number: requestNumber,
      equipmentId: equipment.id,
      requesterId: user.id,
      locationId: equipment.locationId,
      issueType: parsed.data.issueType as never,
      description: parsed.data.description,
      urgency: parsed.data.urgency as never,
      photos,
      history: {
        create: {
          fromStatus: null,
          toStatus: RequestStatus.NEW,
          actorId: user.id,
          comment: "Signalement cree depuis la fiche equipement.",
        },
      },
    },
  });

  const recipients = await prisma.user.findMany({
    where: {
      role: {
        in: [Role.ADMIN, Role.MANAGER, Role.TECHNICIAN],
      },
      active: true,
    },
    select: { id: true },
  });

  if (recipients.length > 0) {
    await prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        recipientId: recipient.id,
        title: "Nouvelle demande d'intervention",
        message: `${request.number} - ${equipment.name}`,
        link: `/demandes/${request.id}`,
      })),
    });
  }

  revalidatePath("/demandes");
  revalidatePath(`/equipements/${equipment.id}`);
  redirect(withSearchParams(`/demandes/${request.id}`, { success: "Signalement envoye au service technique." }));
}

export async function updateRequestAction(formData: FormData) {
  const actor = await requireUser();

  if (!canOperateRequests(actor.role)) {
    redirect("/");
  }

  const requestId = getString(formData, "requestId");
  const nextStatus = getString(formData, "status") as RequestStatus;
  const assignedToId = getOptionalString(formData, "assignedToId");
  const dueDate = getDateOrUndefined(getOptionalString(formData, "dueDate"));
  const technicalPriority = getOptionalString(formData, "technicalPriority");
  const resolutionNotes = getOptionalString(formData, "resolutionNotes");

  const currentRequest = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      equipment: true,
    },
  });

  if (!currentRequest) {
    redirect("/demandes");
  }

  await prisma.request.update({
    where: { id: requestId },
    data: {
      status: nextStatus,
      assignedToId,
      dueDate,
      technicalPriority,
      resolutionNotes,
    },
  });

  if (currentRequest.status !== nextStatus) {
    await prisma.statusHistory.create({
      data: {
        requestId,
        fromStatus: currentRequest.status,
        toStatus: nextStatus,
        actorId: actor.id,
        comment: getOptionalString(formData, "statusComment"),
      },
    });

    await prisma.notification.create({
      data: {
        recipientId: currentRequest.requesterId,
        title: "Votre demande a evolue",
        message: `${currentRequest.number} est maintenant ${nextStatus.toLowerCase()}.`,
        link: `/demandes/${requestId}`,
      },
    });
  }

  revalidatePath("/demandes");
  revalidatePath(`/demandes/${requestId}`);
  redirect(withSearchParams(`/demandes/${requestId}`, { success: "Demande mise a jour." }));
}

export async function markAllReadAction() {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: { recipientId: user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
  redirect("/notifications");
}

export async function updateEquipmentAction(formData: FormData) {
  await requireRole([Role.ADMIN, Role.MANAGER]);

  const id = getString(formData, "id");
  const equipment = await prisma.equipment.findUnique({ where: { id } });

  if (!equipment) {
    redirect("/equipements");
  }

  const schema = z.object({
    name: z.string().min(3, "Le nom de l'equipement est requis."),
    status: z.string(),
    building: z.string().min(2, "Le batiment est requis."),
  });

  const parsed = schema.safeParse({
    name: getString(formData, "name"),
    status: getString(formData, "status"),
    building: getString(formData, "building"),
  });

  if (!parsed.success) {
    redirect(withSearchParams(`/equipements/${id}/edit`, { error: parsed.error.issues[0]?.message }));
  }

  const photos = await saveUploadedFiles(
    formData.getAll("photos").filter((file): file is File => file instanceof File),
    "equipments",
  );

  const location = await findOrCreateLocation(formData);

  const existingPhotos = equipment.photos as string[] | null;
  const allPhotos = [...(existingPhotos ?? []), ...photos];

  await prisma.equipment.update({
    where: { id },
    data: {
      name: parsed.data.name,
      categoryId: getOptionalString(formData, "categoryId") || null,
      locationId: location?.id ?? null,
      serialNumber: getOptionalString(formData, "serialNumber"),
      brand: getOptionalString(formData, "brand"),
      model: getOptionalString(formData, "model"),
      purchaseDate: getDateOrUndefined(getOptionalString(formData, "purchaseDate")),
      commissioningDate: getDateOrUndefined(getOptionalString(formData, "commissioningDate")),
      warrantyEndDate: getDateOrUndefined(getOptionalString(formData, "warrantyEndDate")),
      supplier: getOptionalString(formData, "supplier"),
      status: parsed.data.status as never,
      notes: getOptionalString(formData, "notes"),
      photos: allPhotos.length > 0 ? allPhotos : undefined,
    },
  });

  revalidatePath("/equipements");
  revalidatePath(`/equipements/${id}`);
  redirect(withSearchParams(`/equipements/${id}`, { success: "Equipement mis a jour." }));
}

export async function deleteEquipmentAction(formData: FormData) {
  await requireRole([Role.ADMIN]);

  const id = getString(formData, "id");

  const requestCount = await prisma.request.count({ where: { equipmentId: id } });
  if (requestCount > 0) {
    redirect(withSearchParams(`/equipements/${id}`, { error: "Impossible de supprimer : des demandes sont liees a cet equipement." }));
  }

  await prisma.equipment.delete({ where: { id } });

  revalidatePath("/equipements");
  redirect(withSearchParams("/equipements", { success: "Equipement supprime." }));
}

export async function addCommentAction(formData: FormData) {
  const actor = await requireUser();
  const requestId = getString(formData, "requestId");
  const message = getString(formData, "message");

  if (message.length < 2) {
    redirect(withSearchParams(`/demandes/${requestId}`, { error: "Le commentaire est trop court." }));
  }

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      requesterId: true,
      assignedToId: true,
    },
  });

  if (!request) {
    redirect("/demandes");
  }

  await prisma.requestComment.create({
    data: {
      requestId,
      authorId: actor.id,
      message,
    },
  });

  const recipients = [request.requesterId, request.assignedToId]
    .filter((recipientId): recipientId is string => Boolean(recipientId))
    .filter((recipientId) => recipientId !== actor.id);

  if (recipients.length > 0) {
    await prisma.notification.createMany({
      data: recipients.map((recipientId) => ({
        recipientId,
        title: "Nouveau commentaire sur une demande",
        message: "Un nouvel echange a ete ajoute.",
        link: `/demandes/${requestId}`,
      })),
    });
  }

  revalidatePath(`/demandes/${requestId}`);
  redirect(withSearchParams(`/demandes/${requestId}`, { success: "Commentaire ajoute." }));
}

// ===== USER MANAGEMENT =====

export async function createUserAction(formData: FormData) {
  await requireRole([Role.ADMIN]);

  const schema = z.object({
    firstName: z.string().min(2, "Le prenom est requis."),
    lastName: z.string().min(2, "Le nom est requis."),
    email: z.string().email("Email invalide."),
    password: z.string().min(6, "Le mot de passe doit faire au moins 6 caracteres."),
    role: z.string(),
  });

  const parsed = schema.safeParse({
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    role: getString(formData, "role"),
  });

  if (!parsed.success) {
    redirect(withSearchParams("/admin/utilisateurs/new", { error: parsed.error.issues[0]?.message }));
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) {
    redirect(withSearchParams("/admin/utilisateurs/new", { error: "Un compte avec cet email existe deja." }));
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: parsed.data.role as Role,
      service: getOptionalString(formData, "service"),
      phone: getOptionalString(formData, "phone"),
    },
  });

  revalidatePath("/admin/utilisateurs");
  redirect(withSearchParams("/admin/utilisateurs", { success: "Utilisateur cree avec succes." }));
}

export async function updateUserAction(formData: FormData) {
  await requireRole([Role.ADMIN]);

  const id = getString(formData, "id");

  const schema = z.object({
    firstName: z.string().min(2, "Le prenom est requis."),
    lastName: z.string().min(2, "Le nom est requis."),
    email: z.string().email("Email invalide."),
    role: z.string(),
  });

  const parsed = schema.safeParse({
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    email: getString(formData, "email"),
    role: getString(formData, "role"),
  });

  if (!parsed.success) {
    redirect(withSearchParams(`/admin/utilisateurs/${id}/edit`, { error: parsed.error.issues[0]?.message }));
  }

  const password = getOptionalString(formData, "password");

  await prisma.user.update({
    where: { id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role as Role,
      service: getOptionalString(formData, "service"),
      phone: getOptionalString(formData, "phone"),
      ...(password && password.length >= 6 ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  revalidatePath("/admin/utilisateurs");
  redirect(withSearchParams("/admin/utilisateurs", { success: "Utilisateur modifie." }));
}

export async function toggleUserActiveAction(formData: FormData) {
  await requireRole([Role.ADMIN]);

  const userId = getString(formData, "userId");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { active: true } });

  if (!user) {
    redirect("/admin/utilisateurs");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });

  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs");
}

// ===== MAINTENANCE PREVENTIVE =====

export async function createMaintenancePlanAction(formData: FormData) {
  await requireRole([Role.ADMIN, Role.MANAGER]);

  const schema = z.object({
    title: z.string().min(3, "Le titre est requis."),
    equipmentId: z.string().min(1, "L'equipement est requis."),
    intervalDays: z.coerce.number().min(1, "L'intervalle doit etre positif."),
    nextDueDate: z.string().min(1, "La date est requise."),
  });

  const parsed = schema.safeParse({
    title: getString(formData, "title"),
    equipmentId: getString(formData, "equipmentId"),
    intervalDays: getString(formData, "intervalDays"),
    nextDueDate: getString(formData, "nextDueDate"),
  });

  if (!parsed.success) {
    redirect(withSearchParams("/maintenance/new", { error: parsed.error.issues[0]?.message }));
  }

  await prisma.maintenancePlan.create({
    data: {
      title: parsed.data.title,
      description: getOptionalString(formData, "description"),
      equipmentId: parsed.data.equipmentId,
      intervalDays: parsed.data.intervalDays,
      nextDueDate: new Date(parsed.data.nextDueDate),
    },
  });

  revalidatePath("/maintenance");
  redirect(withSearchParams("/maintenance", { success: "Plan de maintenance cree." }));
}

export async function toggleMaintenancePlanAction(formData: FormData) {
  await requireRole([Role.ADMIN, Role.MANAGER]);

  const id = getString(formData, "id");
  const plan = await prisma.maintenancePlan.findUnique({ where: { id }, select: { active: true } });

  if (!plan) {
    redirect("/maintenance");
  }

  await prisma.maintenancePlan.update({
    where: { id },
    data: { active: !plan.active },
  });

  revalidatePath("/maintenance");
  redirect("/maintenance");
}

export async function generateMaintenanceAction() {
  await requireRole([Role.ADMIN, Role.MANAGER]);

  const duePlans = await prisma.maintenancePlan.findMany({
    where: {
      active: true,
      nextDueDate: { lte: new Date() },
    },
    include: { equipment: true },
  });

  let generated = 0;

  for (const plan of duePlans) {
    const requestNumber = await getNextRequestNumber();

    // Find a default technician or fallback to admin/manager
    const technician = await prisma.user.findFirst({
      where: { role: "TECHNICIAN", active: true },
      select: { id: true },
    });
    const fallbackUser = technician ?? await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "MANAGER"] }, active: true },
      select: { id: true },
    });
    if (!fallbackUser) continue;

    await prisma.request.create({
      data: {
        number: requestNumber,
        equipmentId: plan.equipmentId,
        requesterId: fallbackUser.id,
        locationId: plan.equipment.locationId,
        issueType: "OTHER",
        description: `[Maintenance preventive] ${plan.title}${plan.description ? ` - ${plan.description}` : ""}`,
        urgency: "NORMAL",
        status: "NEW",
        history: {
          create: {
            fromStatus: null,
            toStatus: "NEW",
            comment: "Generation automatique depuis un plan de maintenance preventive.",
          },
        },
      },
    });

    // Advance next due date
    const nextDate = new Date(plan.nextDueDate);
    nextDate.setDate(nextDate.getDate() + plan.intervalDays);

    await prisma.maintenancePlan.update({
      where: { id: plan.id },
      data: {
        lastGenerated: new Date(),
        nextDueDate: nextDate,
      },
    });

    generated++;
  }

  revalidatePath("/maintenance");
  revalidatePath("/demandes");
  redirect(withSearchParams("/maintenance", { success: `${generated} intervention(s) preventive(s) generee(s).` }));
}
