/**
 * ISA Articles — the full text of member-written pieces, held as structured
 * content so each one can be read on the site rather than downloaded.
 *
 * Currently empty, awaiting replacement content. Add an entry to `articles` and
 * it appears in both places on its own: the initiatives hub renders `summary`
 * on a card, and /articles/[slug] renders `body` as a full page from the same
 * record. Nothing else needs touching — the route is generated from this array.
 *
 * Keep source files (PDFs and the like) out of public/: anything under that
 * folder is served as a static URL and would be downloadable.
 */

/**
 * One renderable unit of an article. Kept as structured data rather than
 * markdown so no parser dependency is needed and ArticleBody can style each
 * kind to match the rest of the site.
 */
export type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  /** Labelled rows — the sensor stack, the application breakdown, and so on. */
  | { type: "definitions"; items: { term: string; detail: string }[] }
  | { type: "table"; columns: string[]; rows: string[][] }
  /** Chronological rows, e.g. the hour-by-hour field log. */
  | { type: "timeline"; items: { time: string; text: string }[] }
  /** A single line pulled out of the flow for emphasis. */
  | { type: "callout"; text: string };

export interface Article {
  /** URL segment — the page lives at /articles/[slug]. */
  slug: string;
  title: string;
  /** The piece's cover line, when it has one. Sits under the title. */
  subtitle?: string;
  /** Omitted when the piece carries no byline. */
  author?: string;
  /** Card blurb on the initiatives hub. Two sentences is the right length. */
  summary: string;
  tags: string[];
  body: ArticleBlock[];
}

/**
 * Display order — index 0 is the featured hero of the bento grid on the
 * initiatives hub, so put the strongest piece first.
 */
export const articles: Article[] = [];

/** Look up a single article by URL slug. Undefined when nothing matches. */
export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

/**
 * Rough read time in whole minutes, derived from the body so it can never go
 * stale the way a hardcoded number would. 200 wpm is the usual prose estimate;
 * always at least 1 so a short piece never reads "0 min".
 */
export function readingMinutes(article: Article): number {
  const words = article.body.reduce((total, block) => {
    switch (block.type) {
      case "heading":
      case "paragraph":
      case "callout":
        return total + countWords(block.text);
      case "list":
        return total + block.items.reduce((n, item) => n + countWords(item), 0);
      case "definitions":
        return (
          total +
          block.items.reduce(
            (n, item) => n + countWords(item.term) + countWords(item.detail),
            0
          )
        );
      case "table":
        return (
          total +
          block.columns.reduce((n, col) => n + countWords(col), 0) +
          block.rows.reduce(
            (n, row) => n + row.reduce((m, cell) => m + countWords(cell), 0),
            0
          )
        );
      case "timeline":
        return (
          total +
          block.items.reduce(
            (n, item) => n + countWords(item.time) + countWords(item.text),
            0
          )
        );
    }
  }, 0);

  return Math.max(1, Math.round(words / 200));
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}
