import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const unreadNotifications = await prisma.notification.count({
    where: {
      recipientId: user.id,
      read: false,
    },
  });

  return (
    <AppShell
      user={{
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        service: user.service,
      }}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </AppShell>
  );
}
