// Ably channel names, shared by the server (lib/ably.ts) and the browser
// (LiveUpdates), so neither side spells them on its own. No server-only here.

export const channelName = (channelId: string) => `chat:${channelId}`;

/**
 * Every admin tab listens on this one for "a sidebar count changed", then
 * refetches its own counts. A chat channel id because the API key only covers
 * chat:*; real ids are UUIDs, so it can't collide.
 */
export const WORKSPACE_ID = "_workspace";
