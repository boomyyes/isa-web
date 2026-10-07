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

/** Subscribe-only to every chat channel, for an hour. Never publish. */
export function subscribeTokenRequest(email: string) {
  return client().auth.createTokenRequest({
    clientId: pseudonym(email),
    capability: { "chat:*": ["subscribe"] },
    ttl: 60 * 60 * 1000,
  });
}

/** Tells listeners to refetch. Best effort: a missed signal is caught by the client's periodic refresh. */
export async function signal(channelId: string, kind: "new" | "deleted") {
  if (!ablyConfigured()) return;
  try {
    await client().channels.get(channelName(channelId)).publish(kind, null);
  } catch {
    // The message is already stored; delivery falls back to polling.
  }
}
