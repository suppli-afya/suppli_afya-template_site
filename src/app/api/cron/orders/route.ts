import { timingSafeEqual } from "node:crypto";
import { db } from "@/server/db";
import { retryPending } from "@/server/portal";

/**
 * Called by the scheduler every morning (see vercel.json), before the distributor's Today list
 * goes out: orders the portal couldn't take when they were placed are sent again. Needs CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const store = db();
  if (!store) return Response.json({ filed: 0, dropped: 0, waiting: 0, note: "No database on this deploy" });
  return Response.json(await retryPending(await store));
}
