import { RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser, canOperateRequests } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user || !canOperateRequests(user.role)) {
    return Response.json({ error: "Non autorise" }, { status: 403 });
  }

  const formData = await request.formData();
  const requestId = formData.get("requestId") as string;
  const newStatus = formData.get("status") as RequestStatus;

  if (!requestId || !newStatus) {
    return Response.json({ error: "Donnees manquantes" }, { status: 400 });
  }

  const currentRequest = await prisma.request.findUnique({
    where: { id: requestId },
    select: { status: true, requesterId: true, number: true },
  });

  if (!currentRequest) {
    return Response.json({ error: "Demande introuvable" }, { status: 404 });
  }

  if (currentRequest.status === newStatus) {
    return Response.json({ ok: true });
  }

  await prisma.request.update({
    where: { id: requestId },
    data: { status: newStatus },
  });

  await prisma.statusHistory.create({
    data: {
      requestId,
      fromStatus: currentRequest.status,
      toStatus: newStatus,
      actorId: user.id,
      comment: "Deplacement depuis le tableau Kanban.",
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: currentRequest.requesterId,
      title: "Statut mis a jour",
      message: `${currentRequest.number} est maintenant ${newStatus.toLowerCase()}.`,
      link: `/demandes/${requestId}`,
    },
  });

  return Response.json({ ok: true });
}
