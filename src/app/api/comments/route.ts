import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  const formData = await request.formData();
  const requestId = (formData.get("requestId") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  if (!requestId || !message || message.length < 2) {
    return Response.json({ error: "Le commentaire est trop court." }, { status: 400 });
  }

  const req = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true, requesterId: true, assignedToId: true },
  });

  if (!req) {
    return Response.json({ error: "Demande introuvable." }, { status: 404 });
  }

  await prisma.requestComment.create({
    data: {
      requestId,
      authorId: user.id,
      message,
    },
  });

  const recipients = [req.requesterId, req.assignedToId]
    .filter((id): id is string => Boolean(id))
    .filter((id) => id !== user.id);

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

  return Response.json({ ok: true });
}
