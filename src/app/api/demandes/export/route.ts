import { NextResponse } from "next/server";
import { getSessionUser, canOperateRequests } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  requestStatusLabels,
  requestUrgencyLabels,
  requestIssueTypeLabels,
} from "@/lib/labels";
import { ExcelJS, finalizeSheet, workbookToBuffer } from "@/lib/excel";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !canOperateRequests(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.request.findMany({
    where: user.establishmentId ? { establishmentId: user.establishmentId } : {},
    include: {
      equipment: { include: { location: true } },
      requester: true,
      assignedTo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GMAO IME";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Demandes", {
    properties: { defaultColWidth: 18 },
  });

  sheet.columns = [
    { header: "Numero", key: "number", width: 16 },
    { header: "Statut", key: "status", width: 16 },
    { header: "Urgence", key: "urgency", width: 14 },
    { header: "Type", key: "issueType", width: 20 },
    { header: "Equipement", key: "equipment", width: 26 },
    { header: "Localisation", key: "location", width: 30 },
    { header: "Description", key: "description", width: 40 },
    { header: "Demandeur", key: "requester", width: 22 },
    { header: "Assigne a", key: "assignedTo", width: 22 },
    { header: "Date creation", key: "createdAt", width: 18 },
    { header: "Date echeance", key: "dueDate", width: 14 },
    { header: "Priorite technique", key: "priority", width: 18 },
  ];

  for (const req of requests) {
    const loc = req.equipment.location;
    sheet.addRow({
      number: req.number,
      status: requestStatusLabels[req.status],
      urgency: requestUrgencyLabels[req.urgency],
      issueType: requestIssueTypeLabels[req.issueType],
      equipment: req.equipment.name,
      location: loc
        ? [loc.building, loc.floor, loc.room].filter(Boolean).join(" - ")
        : "",
      description: req.description,
      requester: `${req.requester.firstName} ${req.requester.lastName}`,
      assignedTo: req.assignedTo
        ? `${req.assignedTo.firstName} ${req.assignedTo.lastName}`
        : "Non assigne",
      createdAt: new Date(req.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      dueDate: req.dueDate
        ? new Date(req.dueDate).toLocaleDateString("fr-FR")
        : "",
      priority: req.technicalPriority ?? "",
    });
  }

  finalizeSheet(sheet);

  const buffer = await workbookToBuffer(workbook);
  const filename = `demandes_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
}
