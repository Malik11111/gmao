import { NextResponse } from "next/server";
import { getSessionUser, canManageEquipment } from "@/lib/session";
import { prisma } from "@/lib/db";
import { equipmentStatusLabels } from "@/lib/labels";
import { ExcelJS, finalizeSheet, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !canManageEquipment(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const equipments = await prisma.equipment.findMany({
    where: user.establishmentId ? { establishmentId: user.establishmentId } : {},
    include: { category: true, location: true, _count: { select: { requests: true } } },
    orderBy: { createdAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GMAO";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Equipements", {
    properties: { defaultColWidth: 18 },
  });

  sheet.columns = [
    { header: "Code", key: "code", width: 14 },
    { header: "Nom", key: "name", width: 28 },
    { header: "Categorie", key: "category", width: 18 },
    { header: "Statut", key: "status", width: 16 },
    { header: "Batiment", key: "building", width: 22 },
    { header: "Etage", key: "floor", width: 10 },
    { header: "Salle", key: "room", width: 16 },
    { header: "Marque", key: "brand", width: 16 },
    { header: "Modele", key: "model", width: 18 },
    { header: "N Serie", key: "serial", width: 18 },
    { header: "Fournisseur", key: "supplier", width: 18 },
    { header: "Date achat", key: "purchaseDate", width: 14 },
    { header: "Fin garantie", key: "warrantyEnd", width: 14 },
    { header: "Nb demandes", key: "requests", width: 14 },
  ];

  for (const eq of equipments) {
    sheet.addRow({
      code: eq.code,
      name: eq.name,
      category: eq.category?.name ?? "",
      status: equipmentStatusLabels[eq.status],
      building: eq.location?.building ?? "",
      floor: eq.location?.floor ?? "",
      room: eq.location?.room ?? "",
      brand: eq.brand ?? "",
      model: eq.model ?? "",
      serial: eq.serialNumber ?? "",
      supplier: eq.supplier ?? "",
      purchaseDate: eq.purchaseDate ? new Date(eq.purchaseDate).toLocaleDateString("fr-FR") : "",
      warrantyEnd: eq.warrantyEndDate ? new Date(eq.warrantyEndDate).toLocaleDateString("fr-FR") : "",
      requests: eq._count.requests,
    });
  }

  finalizeSheet(sheet);

  const buffer = await workbookToBuffer(workbook);
  const filename = `equipements_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
}
