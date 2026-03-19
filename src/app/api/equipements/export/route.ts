import { NextResponse } from "next/server";
import { getSessionUser, canManageEquipment } from "@/lib/session";
import { prisma } from "@/lib/db";
import { equipmentStatusLabels } from "@/lib/labels";

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const user = await getSessionUser();

  if (!user || !canManageEquipment(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const equipments = await prisma.equipment.findMany({
    include: { category: true, location: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Code",
    "Nom",
    "Categorie",
    "Batiment",
    "Etage",
    "Salle",
    "Marque",
    "Modele",
    "N Serie",
    "Statut",
    "Date achat",
    "Fournisseur",
  ];

  const rows = equipments.map((eq) => [
    escapeCSV(eq.code),
    escapeCSV(eq.name),
    escapeCSV(eq.category?.name),
    escapeCSV(eq.location?.building),
    escapeCSV(eq.location?.floor),
    escapeCSV(eq.location?.room),
    escapeCSV(eq.brand),
    escapeCSV(eq.model),
    escapeCSV(eq.serialNumber),
    escapeCSV(equipmentStatusLabels[eq.status]),
    escapeCSV(eq.purchaseDate ? new Date(eq.purchaseDate).toLocaleDateString("fr-FR") : null),
    escapeCSV(eq.supplier),
  ]);

  const csv = "\uFEFF" + [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=equipements.csv",
    },
  });
}
