import { NextResponse } from "next/server";
import { RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find closed requests to archive
  const closedRequests = await prisma.request.findMany({
    where: { status: RequestStatus.CLOSED },
    select: { id: true },
  });

  // Archive closed requests
  const archived = await prisma.request.updateMany({
    where: { status: RequestStatus.CLOSED },
    data: { status: RequestStatus.ARCHIVED },
  });

  // Delete only notifications linked to the archived requests
  let deleted = { count: 0 };
  if (closedRequests.length > 0) {
    const archivedLinks = closedRequests.map((r) => `/demandes/${r.id}`);
    deleted = await prisma.notification.deleteMany({
      where: { link: { in: archivedLinks } },
    });
  }

  return NextResponse.json({
    archivedRequests: archived.count,
    deletedNotifications: deleted.count,
  });
}
