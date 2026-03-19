import { prisma } from "@/lib/db";

export async function getNextEquipmentCode(establishmentId?: string | null) {
  const last = await prisma.equipment.findFirst({
    where: establishmentId ? { establishmentId } : undefined,
    orderBy: { code: "desc" },
    select: { code: true },
  });

  if (!last) {
    return "EQ-00001";
  }

  const num = parseInt(last.code.replace("EQ-", ""), 10);
  return `EQ-${String(num + 1).padStart(5, "0")}`;
}

export async function getNextRequestNumber(establishmentId?: string | null) {
  const year = new Date().getFullYear();
  const prefix = `DI-${year}-`;

  const last = await prisma.request.findFirst({
    where: {
      number: { startsWith: prefix },
      ...(establishmentId ? { establishmentId } : {}),
    },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  if (!last) {
    return `${prefix}001`;
  }

  const num = parseInt(last.number.replace(prefix, ""), 10);
  return `${prefix}${String(num + 1).padStart(3, "0")}`;
}
