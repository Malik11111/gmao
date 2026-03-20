"use client";

import { useRouter } from "next/navigation";

type NotificationLinkProps = {
  href: string;
  notificationId: string;
  className?: string;
  children: React.ReactNode;
};

export function NotificationLink({ href, notificationId, className, children }: NotificationLinkProps) {
  const router = useRouter();

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notificationId }),
    });
    router.push(href);
    router.refresh();
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
