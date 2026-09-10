import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Deliberately minimal: confirms the app process is up and can reach the
 * database — the two things an uptime monitor or a container
 * orchestrator's liveness/readiness probe actually needs to know. Not
 * authenticated (health checks shouldn't need credentials), and doesn't
 * leak anything beyond "database reachable: yes/no".
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
