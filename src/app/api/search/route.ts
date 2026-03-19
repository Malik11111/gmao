import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ equipments: [], requests: [] }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return Response.json({ equipments: [], requests: [] });
  }

  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};

  const [equipments, requests] = await Promise.all([
    prisma.equipment.findMany({
      where: {
        ...estFilter,
        OR: [
          { name: { contains: q } },
          { code: { contains: q } },
          { brand: { contains: q } },
        ],
      },
      include: { location: true, category: true },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.request.findMany({
      where: {
        ...estFilter,
        ...(user.role === "USER" ? { requesterId: user.id } : {}),
        OR: [
          { number: { contains: q } },
          { description: { contains: q } },
          { equipment: { is: { name: { contains: q } } } },
        ],
      },
      include: {
        equipment: true,
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return Response.json({
    equipments: equipments.map((e) => ({
      id: e.id,
      code: e.code,
      name: e.name,
      category: e.category?.name ?? null,
      location: [e.location?.building, e.location?.room].filter(Boolean).join(" - "),
      status: e.status,
    })),
    requests: requests.map((r) => ({
      id: r.id,
      number: r.number,
      equipmentName: r.equipment.name,
      description: r.description.slice(0, 80),
      status: r.status,
      urgency: r.urgency,
    })),
  });
}
