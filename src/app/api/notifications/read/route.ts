import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id || typeof id !== "string") {
    return Response.json({ error: "ID manquant" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { id, recipientId: user.id },
    data: { read: true },
  });

  revalidatePath("/", "layout");

  return Response.json({ ok: true });
}
