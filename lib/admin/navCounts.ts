import "server-only";
import { unreadCount } from "./announcements";
import { countBills } from "./finance";
import { hasCap, type Session } from "./store";
import { dbConfigured } from "@/lib/db";

/** Badge counts, streamed from the server after the page has rendered. */
export type NavCounts = { unread: number; awaiting: number };

/** The sidebar badges. A failure just means no badge. */
export async function navCounts(session: Session): Promise<NavCounts> {
  if (!dbConfigured()) return { unread: 0, awaiting: 0 };
  const [unread, awaiting] = await Promise.all([
    unreadCount(session.email).catch(() => 0),
    hasCap(session, "finance.decide") ? countBills("submitted").catch(() => 0) : 0,
  ]);
  return { unread, awaiting };
}
