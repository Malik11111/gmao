import { prisma } from "@/lib/db";

export async function getNextEquipmentCode() {
  const last = await prisma.equipment.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  });

  if (!last) {
    return "EQ-00001";
  }

  const num = parseInt(last.code.replace("EQ-", ""), 10);
  return `EQ-${String(num + 1).padStart(5, "0")}`;
}

export async function getNextRequestNumber() {
  const year = new Date().getFullYear();
  const prefix = `DI-${year}-`;

  const last = await prisma.request.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  if (!last) {
    return `${prefix}001`;
  }

  const num = parseInt(last.number.replace(prefix, ""), 10);
  return `${prefix}${String(num + 1).padStart(3, "0")}`;
}
