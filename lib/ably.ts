// Ably carries one thing: "channel X changed". The browser then fetches the
// actual messages from our own API, so message text and authors never pass
// through Ably. Browsers hold short-lived, subscribe-only tokens; publishing
// happens here, on the server, with the API key.

import "server-only";
import { createHash } from "node:crypto";
import * as Ably from "ably";

let rest: Ably.Rest | null = null;

export const ablyConfigured = () => Boolean(process.env.ABLY_API_KEY);

function client(): Ably.Rest {
  const key = process.env.ABLY_API_KEY;
  if (!key) throw new Error("ABLY_API_KEY is not set");
  rest ??= new Ably.Rest({ key });
  return rest;
}

export const channelName = (channelId: string) => `chat:${channelId}`;

/** A stable pseudonym for Ably's clientId, so Ably never learns admin emails. */
const pseudonym = (email: string) => createHash("sha256").update(`isa-chat:${email}`).digest("hex").slice(0, 16);

/**
 * Subscribe-only for an hour, never publish: to every chat channel, or only to
 * `channelIds` when given. A channel created later is picked up on the next token.
 */
export function subscribeTokenRequest(email: string, channelIds: string[] | null = null) {
  const capability: Record<string, ["subscribe"]> = channelIds
    ? Object.fromEntries(channelIds.map((id) => [channelName(id), ["subscribe"]]))
    : { "chat:*": ["subscribe"] };
  return client().auth.createTokenRequest({
    clientId: pseudonym(email),
    capability,
    ttl: 60 * 60 * 1000,
  });
}

/**
 * Every admin tab listens on this one for "a sidebar count changed", then
 * refetches its own counts. A chat channel id because the API key only covers
 * chat:*; real ids are UUIDs, so it can't collide. Keep in step with LiveUpdates.
 */
export const WORKSPACE_ID = "_workspace";

/** Tells listeners to refetch. Best effort: a missed signal is caught by the client's periodic refresh or reconnect. */
export async function signal(channelId: string, kind: "new" | "deleted" | "announcements" | "bills") {
  if (!ablyConfigured()) return;
  try {
    await client().channels.get(channelName(channelId)).publish(kind, null);
  } catch {
    // The message is already stored; delivery falls back to polling.
  }
}
