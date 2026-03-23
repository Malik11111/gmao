import { TimeSlot } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser, canOperateRequests } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user || !canOperateRequests(user.role) || user.role === "TECHNICIAN") {
    return Response.json({ error: "Non autorise" }, { status: 403 });
  }

  const formData = await request.formData();
  const type = formData.get("type") as string; // "request" | "task"
  const id = formData.get("id") as string;
  const technicianId = formData.get("technicianId") as string;
  const date = formData.get("date") as string;
  const timeSlot = formData.get("timeSlot") as TimeSlot;

  if (!type || !id || !technicianId || !date || !timeSlot) {
    return Response.json({ error: "Donnees manquantes" }, { status: 400 });
  }

  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};

  if (type === "request") {
    const req = await prisma.request.findFirst({
      where: { id, ...estFilter },
      select: { id: true, status: true, number: true, assignedToId: true },
    });
    if (!req) return Response.json({ error: "Demande introuvable" }, { status: 404 });

    await prisma.request.update({
      where: { id },
      data: {
        assignedToId: technicianId,
        planningDate: new Date(date),
        planningTimeSlot: timeSlot,
        status: req.status === "NEW" ? "ACKNOWLEDGED" : req.status,
      },
    });

    if (req.status === "NEW") {
      await prisma.statusHistory.create({
        data: {
          requestId: id,
          fromStatus: "NEW",
          toStatus: "ACKNOWLEDGED",
          actorId: user.id,
          comment: "Planifie via le planning hebdomadaire.",
        },
      });
    }

    await prisma.notification.create({
      data: {
        recipientId: technicianId,
        title: "Intervention planifiee",
        message: `${req.number} vous a ete assignee.`,
        link: "/planning/today",
      },
    });
  } else if (type === "task") {
    const task = await prisma.task.findFirst({
      where: { id, ...estFilter },
    });
    if (!task) return Response.json({ error: "Tache introuvable" }, { status: 404 });

    await prisma.task.update({
      where: { id },
      data: { assignedToId: technicianId, date: new Date(date), timeSlot },
    });
  }

  return Response.json({ ok: true });
}
