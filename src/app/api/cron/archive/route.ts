import { NextResponse } from "next/server";
import { RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Archive closed requests
  const archived = await prisma.request.updateMany({
    where: { status: RequestStatus.CLOSED },
    data: { status: RequestStatus.ARCHIVED },
  });

  // Delete read notifications
  const deleted = await prisma.notification.deleteMany({
    where: { read: true },
  });

  return NextResponse.json({
    archivedRequests: archived.count,
    deletedNotifications: deleted.count,
  });
}
