import { Quote } from "lucide-react";
import type { ArticleBlock } from "@/lib/articles";

/**
 * Renders an article's structured body. One case per ArticleBlock variant —
 * adding a variant in lib/articles.ts will surface here as a type error until
 * it is handled, which is the point of keeping the union closed.
 *
 * Server component: the reader page is fully static, so none of this needs to
 * ship to the browser.
 */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="mt-12 space-y-6">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h2 className="pt-6 font-jetbrains text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
          <span className="mr-2 text-[var(--accent-color)]">{"//"}</span>
          {block.text}
        </h2>
      );

    case "paragraph":
      return (
        <p className="text-[17px] leading-[1.8] text-[var(--text-secondary)]">
          {block.text}
        </p>
      );

    case "list":
      return (
        <ul className="space-y-2.5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 text-[17px] leading-[1.8] text-[var(--text-secondary)]"
            >
              {/* mt nudges the marker onto the first line's optical centre */}
              <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-color)]" />
              {item}
            </li>
          ))}
        </ul>
      );

    case "definitions":
      return (
        <dl className="grid grid-cols-1 gap-3">
          {block.items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 p-5 backdrop-blur-md transition-colors duration-300 hover:border-[var(--border-active)]/50"
            >
              <dt className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">
                {item.term}
              </dt>
              <dd className="mt-2 leading-relaxed text-[var(--text-secondary)]">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      );

    case "table":
      return (
        // Tables are the one block that can outgrow the column on a phone, so
        // it scrolls inside its own frame rather than widening the page.
        <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 backdrop-blur-md">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="border-b border-[var(--border-color)]/60 px-5 py-3 font-jetbrains text-xs font-bold uppercase tracking-widest text-[var(--accent-color)]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="border-b border-[var(--border-color)]/30 px-5 py-3 text-sm text-[var(--text-secondary)] last:border-r-0"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "timeline":
      return (
        <div className="relative pl-6 sm:pl-8">
          {/* vertical spine — mirrors the upcoming-events timeline on the hub */}
          <div className="absolute left-2 sm:left-3 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--border-active)]/60 via-[var(--border-color)] to-transparent" />
          <ul className="space-y-6">
            {block.items.map((item, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[26px] sm:-left-[34px] mt-1 h-3 w-3 rounded-full border border-[var(--border-active)]/50 bg-[var(--card-color)] shadow-[0_0_12px_rgba(0,229,255,0.25)]" />
                <p className="font-jetbrains text-sm font-bold text-[var(--text-primary)]">
                  {item.time}
                </p>
                <p className="mt-1 leading-relaxed text-[var(--text-secondary)]">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      );

    case "callout":
      return (
        <blockquote className="relative my-4 rounded-xl border border-[var(--border-active)]/40 bg-[var(--border-active)]/5 p-6 pl-14">
          <Quote
            aria-hidden
            className="absolute left-5 top-6 h-5 w-5 text-[var(--border-active)]"
          />
          <p className="font-jetbrains text-lg font-medium leading-relaxed text-[var(--text-primary)]">
            {block.text}
          </p>
        </blockquote>
      );
  }
}
