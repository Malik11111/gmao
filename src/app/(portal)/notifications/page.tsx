import { revalidatePath } from "next/cache";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationLink } from "@/components/notification-link";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { translateNotificationMessage } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";
import { markAllReadAction } from "@/app/actions";

export default async function NotificationsPage() {
  const user = await requireUser();

  const rawNotifications = await prisma.notification.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Find and delete orphaned notifications (linking to deleted requests)
  const linkedNotifs = rawNotifications.filter((n) => n.link?.startsWith("/demandes/"));
  if (linkedNotifs.length > 0) {
    const requestIds = linkedNotifs
      .map((n) => n.link!.replace("/demandes/", ""))
      .filter((id) => id.length > 0);
    const existingRequests = await prisma.request.findMany({
      where: { id: { in: requestIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingRequests.map((r) => r.id));
    const orphanedIds = linkedNotifs
      .filter((n) => !existingIds.has(n.link!.replace("/demandes/", "")))
      .map((n) => n.id);
    if (orphanedIds.length > 0) {
      await prisma.notification.deleteMany({ where: { id: { in: orphanedIds } } });
      revalidatePath("/", "layout");
    }
  }

  const notifications = (await prisma.notification.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })).map((n) => ({
    ...n,
    message: translateNotificationMessage(n.message),
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} notification(s) non lue(s) sur ${notifications.length} au total.`}
        actions={
          unreadCount > 0 ? (
            <form action={markAllReadAction}>
              <button type="submit" className="secondary-button gap-2">
                <CheckCheck className="h-4 w-4" />
                Tout marquer comme lu
              </button>
            </form>
          ) : null
        }
      />

      {/* Desktop table */}
      <section className="panel hidden lg:block overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 w-8" />
              <th className="px-5 py-3">Titre</th>
              <th className="px-5 py-3">Message</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const rowClass = !notification.read ? "bg-sky-50/60" : "";
              const inner = (
                <>
                  <td className="px-5 py-3.5 w-8">{!notification.read ? <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" /> : null}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-950">{notification.title}</td>
                  <td className="px-5 py-3.5 text-slate-600">{notification.message}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(notification.createdAt)}</td>
                </>
              );
              return notification.link ? (
                <NotificationLink key={notification.id} href={notification.link} notificationId={notification.id} className={`table-row transition hover:bg-indigo-50/40 ${rowClass}`}>
                  {inner}
                </NotificationLink>
              ) : (
                <tr key={notification.id} className={rowClass}>
                  {inner}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Mobile cards */}
      <section className="lg:hidden space-y-2">
        {notifications.map((notification) => {
          const content = (
            <div className="flex items-start gap-3">
              {!notification.read ? <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0" /> : <span className="mt-1.5 h-2.5 w-2.5 shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950 text-sm truncate">{notification.title}</p>
                  <p className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(notification.createdAt)}</p>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 truncate">{notification.message}</p>
              </div>
            </div>
          );
          return notification.link ? (
            <NotificationLink
              key={notification.id}
              href={notification.link}
              notificationId={notification.id}
              className={`panel block p-4 transition hover:border-slate-300 ${!notification.read ? "border-sky-200 bg-sky-50/60" : ""}`}
            >
              {content}
            </NotificationLink>
          ) : (
            <div key={notification.id} className={`panel p-4 ${!notification.read ? "border-sky-200 bg-sky-50/60" : ""}`}>
              {content}
            </div>
          );
        })}
      </section>

      {notifications.length === 0 ? (
        <section className="panel p-10 text-center">
          <Bell className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Aucune notification</h2>
          <p className="mt-2 text-sm text-slate-500">Les notifications apparaitront ici quand des demandes seront creees ou mises a jour.</p>
        </section>
      ) : null}
    </div>
  );
}
