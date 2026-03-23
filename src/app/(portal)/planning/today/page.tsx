import { Role } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/page-header";
import { DailyTaskList, type DailyItem } from "@/components/daily-task-list";
import { prisma } from "@/lib/db";
import { taskTypeLabels, taskTypeStyles } from "@/lib/labels";
import { requireRole } from "@/lib/session";

export default async function TodayPlanningPage() {
  const user = await requireRole([Role.TECHNICIAN, Role.ADMIN, Role.MANAGER]);
  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};

  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const [tasks, requests] = await Promise.all([
    prisma.task.findMany({
      where: {
        assignedToId: user.id,
        date: { gte: dayStart, lte: dayEnd },
        ...estFilter,
      },
      orderBy: { timeSlot: "asc" },
    }),
    prisma.request.findMany({
      where: {
        assignedToId: user.id,
        planningDate: { gte: dayStart, lte: dayEnd },
        status: { notIn: ["DONE", "CLOSED", "ARCHIVED", "REJECTED"] },
        ...estFilter,
      },
      include: { equipment: { select: { name: true } } },
      orderBy: { urgency: "desc" },
    }),
  ]);

  const items: DailyItem[] = [];

  for (const task of tasks) {
    items.push({
      id: task.id,
      label: task.title,
      description: task.description ?? undefined,
      sourceType: "task",
      colorClass: taskTypeStyles[task.type],
      typeBadge: taskTypeLabels[task.type],
      timeSlot: task.timeSlot,
      status: task.status,
    });
  }

  for (const req of requests) {
    const urgencyColor = req.urgency === "CRITICAL" ? "bg-red-200 text-red-800" : req.urgency === "URGENT" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700";
    const urgencyLabel = req.urgency === "CRITICAL" ? "Critique" : req.urgency === "URGENT" ? "Urgente" : "Panne";
    items.push({
      id: req.id,
      label: req.equipment?.name ?? req.number,
      description: req.description,
      sourceType: "request",
      colorClass: urgencyColor,
      typeBadge: urgencyLabel,
      timeSlot: req.planningTimeSlot ?? "MATIN",
      status: req.status,
      requestLink: `/demandes/${req.id}`,
    });
  }

  // Sort: MATIN first, then by urgency
  items.sort((a, b) => {
    if (a.timeSlot !== b.timeSlot) return a.timeSlot === "MATIN" ? -1 : 1;
    return 0;
  });

  const todayLabel = format(today, "EEEE d MMMM yyyy", { locale: fr });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mon planning"
        description={todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}
      />

      {items.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-gray-400">Rien de prevu pour aujourd&apos;hui.</p>
        </div>
      ) : (
        <DailyTaskList items={items} />
      )}
    </div>
  );
}
