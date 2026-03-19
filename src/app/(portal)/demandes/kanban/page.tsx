import { RequestStatus, Role } from "@prisma/client";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { KanbanBoard } from "@/components/kanban-board";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

const KANBAN_COLUMNS: { status: RequestStatus; label: string; color: string }[] = [
  { status: "NEW", label: "Nouvelles", color: "#3b82f6" },
  { status: "IN_PROGRESS", label: "En cours", color: "#ea580c" },
  { status: "WAITING", label: "En attente", color: "#d97706" },
  { status: "DONE", label: "Terminees", color: "#059669" },
];

export default async function KanbanPage() {
  await requireRole([Role.ADMIN, Role.MANAGER, Role.TECHNICIAN]);

  const requests = await prisma.request.findMany({
    where: {
      status: { in: KANBAN_COLUMNS.map((c) => c.status) },
    },
    include: {
      equipment: true,
      requester: true,
      assignedTo: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const columns = KANBAN_COLUMNS.map((col) => ({
    ...col,
    requests: requests
      .filter((r) => r.status === col.status)
      .map((r) => ({
        id: r.id,
        number: r.number,
        equipmentName: r.equipment.name,
        urgency: r.urgency,
        assignee: r.assignedTo ? `${r.assignedTo.firstName[0]}${r.assignedTo.lastName[0]}` : null,
        assigneeName: r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : "Non assigne",
      })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vue Kanban"
        description="Deplacez les demandes entre les colonnes pour mettre a jour leur statut."
        actions={
          <Link href="/demandes" className="secondary-button">
            Vue liste
          </Link>
        }
      />
      <KanbanBoard columns={columns} />
    </div>
  );
}
