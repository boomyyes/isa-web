// Reads and writes content files through the GitHub Contents API. A write is a
// commit on CONTENT_BRANCH, which Vercel picks up and redeploys.
//
// Every write carries the sha of the version the editor started from; GitHub
// refuses it if the file changed since, so two admins can't silently overwrite
// each other. Commit messages never name the admin — the repository is public.
// Who did what is in the internal audit log instead.

import "server-only";

const REPO = process.env.CONTENT_REPO || "boomyyes/isa-web";
const API = `https://api.github.com/repos/${REPO}`;

/** main in production, the deployed branch on previews, testing locally. */
export const contentBranch = () =>
  process.env.CONTENT_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "testing";

export const githubConfigured = () => Boolean(process.env.GITHUB_CONTENT_TOKEN);

export class ConflictError extends Error {}

async function gh(path: string, init?: RequestInit): Promise<Response> {
  const token = process.env.GITHUB_CONTENT_TOKEN;
  if (!token) throw new Error("GITHUB_CONTENT_TOKEN is not set");
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

export type RemoteFile = { sha: string; text: string };

export async function readFile(path: string, ref = contentBranch()): Promise<RemoteFile> {
  const response = await gh(`/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`);
  if (!response.ok) throw new Error(`GitHub read ${path} -> ${response.status}`);
  const body = (await response.json()) as { sha: string; content: string; encoding: string };
  return { sha: body.sha, text: Buffer.from(body.content, "base64").toString("utf8") };
}

export type CommitResult = { commitSha: string; commitUrl: string; fileSha: string };

/** Creates or updates one file. `sha` must be the version being replaced (omit for a new file). */
export async function writeFile(
  path: string,
  content: string | Uint8Array,
  message: string,
  sha?: string
): Promise<CommitResult> {
  const bytes = typeof content === "string" ? Buffer.from(content, "utf8") : Buffer.from(content);
  const response = await gh(`/contents/${encodePath(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: bytes.toString("base64"),
      branch: contentBranch(),
      ...(sha ? { sha } : {}),
    }),
  });
  // 409: the sha is stale. 422: sha missing for an existing file, or similar.
  if (response.status === 409 || (response.status === 422 && sha)) {
    throw new ConflictError("This was changed by someone else since you opened it.");
  }
  if (!response.ok) throw new Error(`GitHub write ${path} -> ${response.status}`);
  const body = (await response.json()) as {
    content: { sha: string };
    commit: { sha: string; html_url: string };
  };
  return { commitSha: body.commit.sha, commitUrl: body.commit.html_url, fileSha: body.content.sha };
}

/**
 * Several text files in ONE commit, so a change spanning files (moving an event
 * from upcoming to past) can't half-happen. `expected` pins each file to the
 * version the editor read; the branch update is a fast-forward only, so a
 * publish that lands in between makes this fail rather than overwrite it.
 */
export async function writeFiles(
  files: { path: string; text: string }[],
  message: string,
  expected: { path: string; sha: string }[]
): Promise<CommitResult> {
  const branch = contentBranch();
  const refRes = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`);
  if (!refRes.ok) throw new Error(`GitHub ref ${branch} -> ${refRes.status}`);
  const head = ((await refRes.json()) as { object: { sha: string } }).object.sha;

  for (const { path, sha } of expected) {
    if ((await readFile(path, head)).sha !== sha) {
      throw new ConflictError("This was changed by someone else since you opened it.");
    }
  }

  const commitRes = await gh(`/git/commits/${head}`);
  if (!commitRes.ok) throw new Error(`GitHub commit ${head} -> ${commitRes.status}`);
  const baseTree = ((await commitRes.json()) as { tree: { sha: string } }).tree.sha;

  const post = async <T>(path: string, body: unknown): Promise<T> => {
    const res = await gh(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`GitHub POST ${path} -> ${res.status}`);
    return (await res.json()) as T;
  };

  const tree = await post<{ sha: string }>("/git/trees", {
    base_tree: baseTree,
    tree: files.map((f) => ({ path: f.path, mode: "100644", type: "blob", content: f.text })),
  });
  const commit = await post<{ sha: string; html_url: string }>("/git/commits", {
    message,
    tree: tree.sha,
    parents: [head],
  });

  const update = await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  // 422: the branch moved since `head` was read, so this isn't a fast-forward.
  if (update.status === 422) throw new ConflictError("Someone published at the same moment. Try again.");
  if (!update.ok) throw new Error(`GitHub ref update -> ${update.status}`);

  return { commitSha: commit.sha, commitUrl: commit.html_url, fileSha: "" };
}

export type HistoryEntry ={ sha: string; message: string; date: string; url: string };

export async function fileHistory(path: string, limit = 15): Promise<HistoryEntry[]> {
  const response = await gh(
    `/commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(contentBranch())}&per_page=${limit}`
  );
  if (!response.ok) throw new Error(`GitHub history ${path} -> ${response.status}`);
  const body = (await response.json()) as {
    sha: string;
    html_url: string;
    commit: { message: string; committer: { date: string } };
  }[];
  return body.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0],
    date: c.commit.committer.date,
    url: c.html_url,
  }));
}

/** Pretty-printed with a trailing newline, matching the files as committed by hand. */
export const toJsonText = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
