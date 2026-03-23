import { Role } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { startOfWeek, addDays, format, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/page-header";
import { PlanningGrid, type PlanningItem } from "@/components/planning-grid";
import { PlanningSidebar } from "@/components/planning-sidebar";
import { CreateTaskForm } from "@/components/create-task-form";
import { prisma } from "@/lib/db";
import { taskTypeStyles } from "@/lib/labels";
import { requireRole } from "@/lib/session";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PlanningPage({ searchParams }: Props) {
  const user = await requireRole([Role.ADMIN, Role.MANAGER]);
  const sp = await searchParams;
  const estFilter = user.establishmentId ? { establishmentId: user.establishmentId } : {};

  // Week calculation
  const weekParam = typeof sp.week === "string" ? sp.week : undefined;
  const monday = weekParam ? startOfWeek(new Date(weekParam), { weekStartsOn: 1 }) : startOfWeek(new Date(), { weekStartsOn: 1 });
  const friday = addDays(monday, 4);
  const sundayEnd = addDays(monday, 6);
  const prevWeek = format(subWeeks(monday, 1), "yyyy-MM-dd");
  const nextWeek = format(addWeeks(monday, 1), "yyyy-MM-dd");
  const weekLabel = `${format(monday, "d MMM", { locale: fr })} — ${format(friday, "d MMM yyyy", { locale: fr })}`;
  const currentWeek = format(monday, "yyyy-MM-dd");

  const days: string[] = [];
  const dayLabels: string[] = [];
  const weekDays: { date: string; label: string }[] = [];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
  for (let i = 0; i < 5; i++) {
    const d = addDays(monday, i);
    const iso = format(d, "yyyy-MM-dd");
    days.push(iso);
    dayLabels.push(`${dayNames[i]} ${format(d, "d")}`);
    weekDays.push({ date: iso, label: `${dayNames[i]} ${format(d, "d MMM", { locale: fr })}` });
  }

  // Fetch data
  const [technicians, tasks, requests, unassigned] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TECHNICIAN", active: true, ...estFilter },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.task.findMany({
      where: { date: { gte: monday, lte: sundayEnd }, ...estFilter },
    }),
    prisma.request.findMany({
      where: { planningDate: { gte: monday, lte: sundayEnd }, assignedToId: { not: null }, ...estFilter },
      include: { equipment: { select: { name: true } } },
    }),
    prisma.request.findMany({
      where: { status: "NEW", assignedToId: null, ...estFilter },
      include: { equipment: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  // Build grid items
  const items: Record<string, Record<string, { matin: PlanningItem[]; apresMidi: PlanningItem[] }>> = {};
  for (const tech of technicians) {
    items[tech.id] = {};
    for (const day of days) {
      items[tech.id][day] = { matin: [], apresMidi: [] };
    }
  }

  for (const task of tasks) {
    const day = format(task.date, "yyyy-MM-dd");
    const slot = task.timeSlot === "MATIN" ? "matin" : "apresMidi";
    const techItems = items[task.assignedToId]?.[day];
    if (!techItems) continue;
    techItems[slot].push({
      id: task.id,
      label: task.title,
      sourceType: "task",
      colorClass: taskTypeStyles[task.type] + (task.status === "FAIT" ? " opacity-50 line-through" : ""),
    });
  }

  for (const req of requests) {
    if (!req.planningDate || !req.assignedToId) continue;
    const day = format(req.planningDate, "yyyy-MM-dd");
    const slot = req.planningTimeSlot === "MATIN" ? "matin" : "apresMidi";
    const techItems = items[req.assignedToId]?.[day];
    if (!techItems) continue;
    const urgencyColor = req.urgency === "CRITICAL" ? "bg-red-200 text-red-800" : req.urgency === "URGENT" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700";
    techItems[slot].push({
      id: req.id,
      label: req.equipment?.name ?? req.number,
      sourceType: "request",
      colorClass: urgencyColor,
      urgency: req.urgency,
    });
  }

  const sidebarRequests = unassigned.map((r) => ({
    id: r.id,
    number: r.number,
    equipmentName: r.equipment?.name ?? "Anomalie",
    urgency: r.urgency,
    categoryName: r.equipment?.category?.name ?? "—",
    isExternal: r.equipment?.category?.isExternal ?? false,
  }));

  const error = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Planning"
        description="Organisation hebdomadaire des techniciens."
      />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {/* Week nav + create task */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href={`/planning?week=${prevWeek}`} className="secondary-button p-1.5"><ChevronLeft className="h-4 w-4" /></Link>
          <span className="text-sm font-bold text-gray-800 min-w-[200px] text-center">{weekLabel}</span>
          <Link href={`/planning?week=${nextWeek}`} className="secondary-button p-1.5"><ChevronRight className="h-4 w-4" /></Link>
          <Link href="/planning" className="secondary-button text-xs px-2.5 py-1">Aujourd&apos;hui</Link>
        </div>
        <CreateTaskForm technicians={technicians} weekMonday={currentWeek} weekDays={weekDays} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-200" />Critique</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-100" />Urgente</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-orange-100" />Panne</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-emerald-100" />Ronde</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-blue-100" />Preventif</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-gray-200" />Tache</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-yellow-100" />Externe</span>
      </div>

      {/* Grid + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 panel p-2 overflow-hidden">
          {technicians.length === 0 ? (
            <p className="text-sm text-gray-400 p-4 text-center">Aucun technicien actif</p>
          ) : (
            <PlanningGrid technicians={technicians} days={days} dayLabels={dayLabels} items={items} />
          )}
        </div>
        <PlanningSidebar requests={sidebarRequests} />
      </div>
    </div>
  );
}
