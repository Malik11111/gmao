import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  const { id } = await params;

  const equipment = await prisma.equipment.findFirst({
    where: { id, ...(user.establishmentId ? { establishmentId: user.establishmentId } : {}) },
    select: { code: true, name: true, qrCode: true },
  });

  if (!equipment) {
    return Response.json({ error: "Introuvable" }, { status: 404 });
  }

  return Response.json(equipment);
}
