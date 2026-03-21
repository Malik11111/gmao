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

      <section className="space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id}>
            {notification.link ? (
              <NotificationLink
                href={notification.link}
                notificationId={notification.id}
                className={`panel block p-5 transition hover:-translate-y-0.5 hover:border-slate-300 ${!notification.read ? "border-sky-200 bg-sky-50/60" : ""}`}
              >
                <NotificationContent notification={notification} />
              </NotificationLink>
            ) : (
              <div className={`panel p-5 ${!notification.read ? "border-sky-200 bg-sky-50/60" : ""}`}>
                <NotificationContent notification={notification} />
              </div>
            )}
          </div>
        ))}
      </section>

      {notifications.length === 0 ? (
        <section className="panel p-10 text-center">
          <Bell className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">Aucune notification</h2>
          <p className="mt-3 helper">Les notifications apparaitront ici quand des demandes seront creees ou mises a jour.</p>
        </section>
      ) : null}
    </div>
  );
}

function NotificationContent({ notification }: { notification: { title: string; message: string; read: boolean; createdAt: Date } }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {!notification.read ? <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> : null}
          <p className="font-semibold text-slate-950">{notification.title}</p>
        </div>
        <p className="text-sm text-slate-600">{notification.message}</p>
      </div>
      <p className="text-sm text-slate-500 whitespace-nowrap">{formatDateTime(notification.createdAt)}</p>
    </div>
  );
}
